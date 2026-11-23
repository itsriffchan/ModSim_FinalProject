function report = write_scenario_viewer(cfg, results, G, data, outd, stem, provenance)
%WRITE_SCENARIO_VIEWER Versioned display-only payload and fully offline HTML.
    T=G.cells;
    payload.schema_version=1;
    payload.crs=cfg.crs;
    payload.grid=struct('cell_size_m',G.cs,'cell_id',T.cell_id, ...
        'x_m',T.x_center_m,'y_m',T.y_center_m,'active',T.is_active, ...
        'population',T.population_2020,'row',T.row,'col',T.col);
    payload.timing=struct('formula','clip((t - S_arrival)/duration, 0, 1)', ...
        'disclaimer',data{1}.assumption,'playback_speed',cfg.animation.playback_speed, ...
        'wave_arrival',cfg.wave_arrival);
    payload.encoding=struct('probability_limits',[0 0.1],'height_max_km',0, ...
        'height_label','Flat north-up heatmap; no height encoding', ...
        'probability_ticks',[0 0.02 0.04 0.06 0.08 0.1], ...
        'overflow_label','>=10%', ...
        'progression_label','Assumed progression toward final heavy-damage probability.', ...
        'arrival_boundary','Shared arrived/awaiting cell edges from saved onset times');
    payload.provenance=provenance;
    bounds=struct('pcode',{},'name',{},'xy_m',{});
    for j=1:numel(G.LGU)
        [x,y]=boundary(G.LGU(j).pg);
        m=string(G.pop.adm3_pcode)==string(G.LGU(j).pcode);
        assert(nnz(m)==1,'Missing or duplicate LGU boundary name');
        bounds(j)=struct('pcode',G.LGU(j).pcode,'name',char(string(G.pop.lgu_name(m))),'xy_m',[x y]);
    end
    payload.overlays=struct('lgu',bounds,'fault_xy_m',[G.vx(:) G.vy(:)]);
    for k=1:numel(results)
        r=results(k); d=data{k}; active=r.Tc.is_active;
        assert(isequal(r.Tc.cell_id,T.cell_id) && isequal(active,T.is_active),'Viewer grid identity mismatch');
        assert(isequal(r.Tc{:,{'row','col','x_center_m','y_center_m'}},T{:,{'row','col','x_center_m','y_center_m'}}),'Viewer geometry differs');
        assert(isequal(r.Tc.population_2020,T.population_2020),'Viewer population differs');
        assert(d.duration_s==r.duration_s && r.duration_s==r.scenario.duration_s,'Viewer scenario duration differs');
        assert(isequal(d.cell_id,r.Tc.cell_id(active)),'Viewer arrival identity mismatch');
        assert(isequal(d.inactive_cell_id,r.Tc.cell_id(~active)),'Viewer inactive identity mismatch');
        arrival=G.waveArrivals(string(G.waveArrivals.epicenter_id)==string(r.scenario.epicenter),:);
        assert(numel(unique(arrival.cell_id))==height(arrival),'Duplicate viewer arrival key');
        [found,index]=ismember(d.cell_id,arrival.cell_id);
        assert(all(found) && isequal(d.onset_s,arrival.s_arrival_s(index)),'Viewer arrival join differs');
        assert(isequal(d.final_heavy,r.Tc.p_heavy(active)) && ...
            isequal(d.final_losses,[r.Tc.expected_deaths(active) r.Tc.expected_injuries(active)]),'Viewer scientific arrays differ');
        assert(height(r.Lg)==17 && numel(unique(string(r.Lg.adm3_pcode)))==17 && ...
            any(strcmp(string(r.Lg.lgu_name),'Pateros')),'Viewer requires all 17 LGUs including Pateros');
        epi=r.scenario.epicenter_spec; [ex,ey]=geo_utm51n_forward(epi.lon_deg,epi.lat_deg);
        % Reference samples are MATLAB outputs, used by browser acceptance.
        times=unique([0;min(d.onset_s);d.onset_s(1);d.onset_s(1)+d.duration_s/2;d.horizon_s]);
        [~,damage,counters]=animation_state(times,d.onset_s,d.duration_s,d.final_heavy,d.final_losses);
        s=struct('id',r.id,'settings',r.scenario,'duration_s',r.duration_s, ...
            'horizon_s',d.horizon_s,'cell_id',d.cell_id,'onset_s',d.onset_s, ...
            'pgv_cm_s',r.Tc.pgv_cm_s(active),'final_heavy',d.final_heavy, ...
            'final_losses',d.final_losses,'lgu',table2struct(r.Lg), ...
            'totals',[r.totD r.totI],'epicenter_xy_m',[ex ey], ...
            'reference',struct('times_s',times,'damage_first_cell',damage(:,1),'counters',counters));
        assert(all(abs(sum(s.final_losses,1)-s.totals)<1e-8),'Viewer totals differ');
        if k==1, payload.scenarios=s; else, payload.scenarios(k)=s; end
    end
    payload.horizon_s=max([payload.scenarios.horizon_s]);
    % Optional presentation metadata: cell–LGU housing shares + geometric intersection flags.
    % Sourced from prepared/ncr_cell_lgu_housing.csv and ncr_cell_lgu.csv beside the run root.
    % Older exports omit membership; the Next.js city focus UI disables allocation without it.
    membership=attach_viewer_membership(cfg,outd);
    if ~isempty(fieldnames(membership))
        payload.membership=membership;
    end
    source=fullfile(cfg.repoRoot,'viewer');
    json=jsonencode(payload); % Nonfinite inactive geometry separators become null.
    file=fullfile(outd,[stem '_viewer.html']);
    html=fileread(fullfile(source,'template.html'));
    html=strrep(html,'/*__STYLE__*/',fileread(fullfile(source,'viewer.css')));
    html=strrep(html,'/*__THREE__*/',fileread(fullfile(source,'vendor','three.min.js')));
    html=strrep(html,'/*__CONTROLS__*/',fileread(fullfile(source,'vendor','OrbitControls.js')));
    html=strrep(html,'/*__APP__*/',fileread(fullfile(source,'viewer.js')));
    html=strrep(html,'__PAYLOAD__',strrep(json,'<','\u003c'));
    write_utf8(file,html);
    write_utf8(fullfile(outd,'presentation_payload.json'),json);
    % Verify serialization, including every cell, LGU, arrival and scenario.
    decoded=jsondecode(fileread(fullfile(outd,'presentation_payload.json')));
    assert(isequaln(decoded,jsondecode(json)),'Viewer JSON round trip failed');
    report=struct('verified',true,'status','payload_verified','mode','viewer', ...
        'file',file,'schema_version',1,'scenario_ids',{{results.id}}, ...
        'horizon_s',payload.horizon_s,'dependency','Three.js 0.160.1 (MIT)', ...
        'browser_review','See docs/VIEWER-VERIFICATION.md; payload checks do not establish browser acceptance');
    report.dependencies=jsondecode(fileread(fullfile(source,'vendor','manifest.json')));
    files=[dir(fullfile(source,'*.html'));dir(fullfile(source,'*.css'));dir(fullfile(source,'*.js')); ...
        dir(fullfile(cfg.repoRoot,'src','write_scenario_viewer.m'));dir(fullfile(cfg.repoRoot,'export_scenario_viewer.m'))];
    hashes=struct('path',{},'sha256',{});
    for j=1:numel(files)
        filename=fullfile(files(j).folder,files(j).name);
        fid=fopen(filename,'rb'); assert(fid>=0); cleanup=onCleanup(@() fclose(fid));
        bytes=fread(fid,Inf,'*uint8'); clear cleanup;
        md=java.security.MessageDigest.getInstance('SHA-256'); md.update(typecast(bytes,'int8'));
        hash=lower(reshape(dec2hex(typecast(md.digest(),'uint8'),2)',1,[]));
        hashes(end+1)=struct('path',strrep(filename,[cfg.repoRoot filesep],''),'sha256',hash); %#ok<AGROW>
    end
    report.presentation_fingerprints=hashes;
    write_utf8(fullfile(outd,'presentation_manifest.json'),jsonencode(report));
end

function write_utf8(filename,value)
    fid=fopen(filename,'w','n','UTF-8'); assert(fid>=0,'Cannot write viewer artifact');
    cleanup=onCleanup(@() fclose(fid)); %#ok<NASGU>
    fwrite(fid,unicode2native(value,'UTF-8'),'uint8');
end

function membership = attach_viewer_membership(cfg,outd)
%ATTACH_VIEWER_MEMBERSHIP Occupied-housing-unit shares per cell/LGU for city focus UI.
    membership=struct();
    prepared='';
    if isfield(cfg,'preparedDir') && strlength(string(cfg.preparedDir))>0
        prepared=char(cfg.preparedDir);
    else
        prepared=fullfile(fileparts(outd),'prepared');
    end
  housingPath=fullfile(prepared,'ncr_cell_lgu_housing.csv');
    intersectPath=fullfile(prepared,'ncr_cell_lgu.csv');
    if ~isfile(housingPath) || ~isfile(intersectPath)
        return;
    end
    U=readtable(housingPath,'TextType','string');
    I=readtable(intersectPath,'TextType','string');
    assert(all(ismember({'cell_id','adm3_pcode','occupied_housing_units'},U.Properties.VariableNames)), ...
        'ncr_cell_lgu_housing.csv missing required columns');
    assert(all(ismember({'cell_id','adm3_pcode','overlap_km2'},I.Properties.VariableNames)), ...
        'ncr_cell_lgu.csv missing required columns');
    [gi,cell_ids,pcodes]=findgroups(U.cell_id,U.adm3_pcode);
    units=splitapply(@sum,U.occupied_housing_units,gi);
    cellTotals=containers.Map('KeyType','double','ValueType','double');
    for k=1:numel(cell_ids)
        cid=cell_ids(k);
        if isKey(cellTotals,cid)
            cellTotals(cid)=cellTotals(cid)+units(k);
        else
            cellTotals(cid)=units(k);
        end
    end
    inter=containers.Map('KeyType','char','ValueType','logical');
    for r=1:height(I)
        key=sprintf('%d|%s',I.cell_id(r),char(I.adm3_pcode(r)));
        inter(key)=I.overlap_km2(r)>0;
    end
    rows=struct('cell_id',{},'adm3_pcode',{},'occupied_housing_units',{}, ...
        'housing_share',{},'geometric_intersection',{});
    for k=1:numel(cell_ids)
        cid=cell_ids(k); den=cellTotals(cid);
        share=0;
        if den>0, share=units(k)/den; end
        key=sprintf('%d|%s',cid,pcodes{k});
        geom=isKey(inter,key) && inter(key);
        rows(end+1)=struct('cell_id',cid,'adm3_pcode',pcodes{k}, ...
            'occupied_housing_units',units(k),'housing_share',share, ...
            'geometric_intersection',logical(geom)); %#ok<AGROW>
    end
    for cid=keys(cellTotals)
        cid=cid{1}; den=cellTotals(cid);
        if den<=0, continue; end
        idx=[rows.cell_id]==cid;
        s=sum([rows(idx).housing_share]);
        assert(abs(s-1)<1e-8,'Housing share sum differs for cell %d',cid);
    end
    sourceLabel=housingPath;
    if isfield(cfg,'repoRoot')
        sourceLabel=strrep(housingPath,[cfg.repoRoot filesep],'');
    end
    membership=struct('method','occupied_housing_unit_share', ...
        'source',sourceLabel, ...
        'rows',rows);
end
