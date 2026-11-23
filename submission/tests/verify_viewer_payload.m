function verify_viewer_payload(runRoot)
%VERIFY_VIEWER_PAYLOAD Compare exported JSON against saved MATLAB identities/data.
    repo=fileparts(fileparts(mfilename('fullpath'))); addpath(fullfile(repo,'src'));
    saved=load(fullfile(runRoot,'prepared','prepared.mat'),'G'); G=saved.G;
    ids={'A','B','C'};
    for k=1:3
        folder=fullfile(runRoot,ids{k});
        if ~isfile(fullfile(folder,'state.mat')), continue; end
        saved=load(fullfile(folder,'state.mat'),'result','cfg','provenance'); r=saved.result;
        animation=load(fullfile(folder,'animation_data.mat'),'data'); d=animation.data;
        p=jsondecode(fileread(fullfile(folder,'presentation_payload.json'))); s=p.scenarios;
        assert(p.schema_version==1 && isequaln(p.crs,jsondecode(jsonencode(saved.cfg.crs))));
        assert(p.grid.cell_size_m==G.cs);
        assert(isequaln(p.provenance,jsondecode(jsonencode(saved.provenance))));
        assert(strcmp(s.id,r.id));
        epi=r.scenario.epicenter_spec; [ex,ey]=geo_utm51n_forward(epi.lon_deg,epi.lat_deg);
        near(s.epicenter_xy_m,[ex;ey]);
        assert(p.horizon_s==d.horizon_s);
        assert(isequal(p.encoding.probability_limits,[0;0.1]));
        assert(isequal(p.grid.cell_id,G.cells.cell_id));
        assert(isequal(p.grid.active,G.cells.is_active));
        assert(isequal(p.grid.row,G.cells.row) && isequal(p.grid.col,G.cells.col));
        assert(isequal(p.grid.x_m,G.cells.x_center_m) && isequal(p.grid.y_m,G.cells.y_center_m));
        near(p.grid.population,G.cells.population_2020);
        assert(isequal(s.cell_id,d.cell_id)); near(s.onset_s,d.onset_s);
        assert(isequaln(s.settings,jsondecode(jsonencode(r.scenario))));
        near(s.pgv_cm_s,r.Tc.pgv_cm_s(r.Tc.is_active));
        near(s.final_heavy,d.final_heavy); near(s.final_losses,d.final_losses);
        assert(isequaln(s.lgu,jsondecode(jsonencode(table2struct(r.Lg)))));
        near(s.totals(:),[r.totD;r.totI]);
        assert(numel(s.lgu)==17 && any(strcmp({s.lgu.lgu_name},'Pateros')));
        assert(s.horizon_s==d.horizon_s && s.duration_s==r.duration_s);
        [~,damage,counters]=animation_state(s.reference.times_s,s.onset_s,s.duration_s,s.final_heavy,s.final_losses);
        near(damage(:,1),s.reference.damage_first_cell); near(counters,s.reference.counters);
        assert(numel(p.overlays.lgu)==numel(G.LGU));
        for j=1:numel(G.LGU)
            [x,y]=boundary(G.LGU(j).pg);
            assert(strcmp(p.overlays.lgu(j).pcode,G.LGU(j).pcode));
            assert(isequaln(p.overlays.lgu(j).xy_m,[x y]));
        end
        assert(isequaln(p.overlays.fault_xy_m,[G.vx(:) G.vy(:)]));
        if isfield(p,'membership') && ~isempty(p.membership)
            assert(strcmp(p.membership.method,'occupied_housing_unit_share'));
            assert(isfield(p.membership,'rows') && ~isempty(p.membership.rows));
            byCell=containers.Map('KeyType','double','ValueType','any');
            for m=1:numel(p.membership.rows)
                row=p.membership.rows(m);
                assert(row.housing_share>=0 && row.housing_share<=1+1e-8);
                if ~isKey(byCell,row.cell_id), byCell(row.cell_id)=0; end
                byCell(row.cell_id)=byCell(row.cell_id)+row.housing_share;
            end
            for cid=keys(byCell)
                near(byCell(cid{1}),1);
            end
            fprintf('PASS viewer %s: optional membership shares sum to 1 per attributed cell\n',r.id);
        end
        fprintf('PASS viewer %s: all grid/cell identities, arrivals, settings, scientific arrays, overlays, 17 LGUs and reference samples\n',r.id);
    end
    if isfolder(fullfile(runRoot,'comparison'))
        p=jsondecode(fileread(fullfile(runRoot,'comparison','presentation_payload.json')));
        assert(isequal({p.scenarios.id},{'A','B','C'}));
        for k=1:3
            single=jsondecode(fileread(fullfile(runRoot,ids{k},'presentation_payload.json')));
            assert(isequaln(p.scenarios(k),single.scenarios));
            assert(isequaln(p.grid,single.grid) && isequaln(p.overlays,single.overlays));
        end
        fprintf('PASS comparison payload exactly matches independent presentation payloads\n');
    end
end

function near(actual,expected)
    assert(isequal(size(actual),size(expected)) && all(abs(actual-expected)<1e-8,'all'),'Exported numerical values differ');
end


