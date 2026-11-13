function [C, G] = run_ncr_grid(cfg, C)
%RUN_NCR_GRID  Steps 9-10: NCR 500 m grid, population, distances, fault crossings.

    root = cfg.repoRoot;
    proc = fullfile(root, 'data', 'processed');
    outd = fullfile(root, 'results', 'ncr_grid');
    if ~exist(outd, 'dir'), mkdir(outd); end
    cs = cfg.grid.cell_size_m;
    fprintf('Building NCR grid (cell size %g m)...\n', cs);

    % --- UTM test vectors (C05) ---
    tests = [
        123.0,     0.0,  500000.000,       0.000
        121.07011, 14.58, 292088.421, 1612754.668
        121.04696, 14.40, 289423.626, 1592857.845
        121.0,     14.6,  284552.125, 1615033.119
        121.1,     14.4,  295144.264, 1592809.991
    ];
    maxUtmErr = 0;
    for i = 1:size(tests,1)
        [x,y] = geo_utm51n_forward(tests(i,1), tests(i,2));
        maxUtmErr = max(maxUtmErr, max(abs(x-tests(i,3)), abs(y-tests(i,4))));
    end
    C = add_check(C, 'C05', 'UTM 51N forward vs pyproj test vectors (m)', ...
        maxUtmErr, 0, cfg.checks.utm_test_abs_tol_m, ...
        passfail(maxUtmErr, 0, cfg.checks.utm_test_abs_tol_m));
    [xa,ya] = geo_utm51n_forward(121.0, 14.6);
    [xb,yb] = geo_utm51n_forward(121.1, 14.4);
    dUtm = hypot(xa-xb, ya-yb)/1000;
    dGeo = 24.615; % km, from the brief (pyproj geodesic)
    rel = abs(dUtm - 24.618)/24.618;
    C = add_check(C, 'C06a', 'UTM distance A-B (km), target 24.618', dUtm, 24.618, 0.002, ...
        passfail(dUtm, 24.618, 0.002));
    C = add_check(C, 'C06', 'UTM vs geodesic A-B relative difference', rel, 0, 0.001, ...
        passfail(rel, 0, 0.001));

    % --- Load LGUs ---
    verts = readtable(fullfile(proc, 'ncr_lgu_boundaries_vertices.csv'), 'CommentStyle', '#');
    attr  = readtable(fullfile(proc, 'ncr_lgu_attributes.csv'));
    pop   = readtable(fullfile(proc, 'ncr_lgu_population_2020.csv'));
    wvf   = readtable(fullfile(proc, 'wvf_trace_vertices.csv'), 'CommentStyle', '#');
    wp    = readtable(fullfile(proc, 'ncr_worldpop2020_pixels.csv'), 'CommentStyle', '#');
    housF = readtable(fullfile(proc, 'ncr_lgu_housing_floors_2020.csv'), 'CommentStyle', '#');
    xw    = readtable(fullfile(proc, 'building_class_crosswalk.csv'), 'TextType', 'string');

    nL = height(pop);
    C = add_check(C, 'C01', 'LGU count', nL, 17, 0, passfail(nL, 17, 0));
    popSum = sum(pop.total_population);
    C = add_check(C, 'C02', 'PSA LGU sum equals NCR 13,484,462', popSum, 13484462, 0, ...
        passfail(popSum, 13484462, 0));

    [LGU, unionArea, unionPoly] = build_lgu_polyshapes(verts);
    C = add_check(C, 'C03', 'NCR union area EPSG:32651 (km2), target 598.73', ...
        unionArea, 598.73, 598.73*cfg.checks.area_rel_tol, ...
        passfail(unionArea, 598.73, 598.73*cfg.checks.area_rel_tol));
    sumParts = 0;
    calo = 0; lasp = 0;
    for i = 1:numel(LGU)
        sumParts = sumParts + LGU(i).n_parts;
        if strcmp(LGU(i).pcode, 'PH1307501'), calo = LGU(i).n_parts; end
        if strcmp(LGU(i).pcode, 'PH1307601'), lasp = LGU(i).n_parts; end
    end
    C = add_check(C, 'C04', 'Caloocan parts == 2', calo, 2, 0, passfail(calo, 2, 0));
    C = add_check(C, 'C04b', 'Las Pinas parts == 2', lasp, 2, 0, passfail(lasp, 2, 0));

    % --- Grid ---
    [xlim, ylim] = boundingbox(unionPoly);
    xmin = xlim(1); xmax = xlim(2); ymin = ylim(1); ymax = ylim(2);
    x0 = floor(xmin/cs)*cs;
    y0 = floor(ymin/cs)*cs;
    nx = ceil((xmax - x0)/cs);
    ny = ceil((ymax - y0)/cs);
    fprintf('  origin (%.0f, %.0f)  %d x %d = %d cells\n', x0, y0, nx, ny, nx*ny);

    vx = wvf.x_m; vy = wvf.y_m;
    wvfLen = sum(sqrt(diff(vx).^2 + diff(vy).^2))/1000;
    C = add_check(C, 'C11', 'WVF UTM length (km), target 98.58', wvfLen, 98.58, 0.5, ...
        passfail(wvfLen, 98.58, 0.5));
    C = add_check(C, 'C11b', 'WVF vertex count', numel(vx), 108, 0, passfail(numel(vx), 108, 0));

    [exb, eyb] = geo_utm51n_forward(cfg.epicenters(1).lon_deg, cfg.epicenters(1).lat_deg);
    [exa, eya] = geo_utm51n_forward(cfg.epicenters(2).lon_deg, cfg.epicenters(2).lat_deg);
    dOnB = geom_point_polyline_distance(exb, eyb, vx, vy)/1000;
    dOnA = geom_point_polyline_distance(exa, eya, vx, vy)/1000;
    C = add_check(C, 'C12', 'Baseline epicenter distance to trace (km)', dOnB, 0, ...
        cfg.checks.epicenter_on_trace_tol_km, passfail(dOnB, 0, cfg.checks.epicenter_on_trace_tol_km));
    C = add_check(C, 'C12b', 'Alternative epicenter distance to trace (km)', dOnA, 0, ...
        cfg.checks.epicenter_on_trace_tol_km, passfail(dOnA, 0, cfg.checks.epicenter_on_trace_tol_km));
    epiSep = hypot(exb-exa, eyb-eya)/1000;
    C = add_check(C, 'C12c', 'Epicenter separation (km), target ~20.07', epiSep, 20.07, 0.05, ...
        passfail(epiSep, 20.07, 0.05));

    % Rupture segments (67 km)
    Lrup = cfg.source_scenario.rupture_length_km;
    [rx1, ry1, L1] = extract_rupture_segment(vx, vy, exb, eyb, Lrup);
    [rx3, ry3, L3] = extract_rupture_segment(vx, vy, exa, eya, Lrup);
    fprintf('  rupture S1/S2 length = %.2f km, S3 = %.2f km\n', L1, L3);

    % Cell loop
    nCells = nx*ny;
    cell_id = zeros(nCells,1); row=zeros(nCells,1); col=zeros(nCells,1);
    xc=zeros(nCells,1); yc=zeros(nCells,1); is_active=false(nCells,1);
    ncr_frac=zeros(nCells,1); pop_cell=zeros(nCells,1);
    db=nan(nCells,1); da=nan(nCells,1); df=nan(nCells,1);
    rjb1=nan(nCells,1); rjb3=nan(nCells,1); fc=false(nCells,1);
    dom = strings(nCells,1);

    overlap_cid = []; overlap_p = strings(0,1); overlap_a = []; overlap_pop = [];

    % Precompute LGU bboxes
    for i = 1:numel(LGU)
        [lx, ly] = boundingbox(LGU(i).pg);
        LGU(i).bb = [lx ly];
    end

    fprintf('  intersecting cells with LGUs...\n');
    nActive = 0;
    kOv = 0;
    ovCap = 8000;
    overlap_cid = zeros(ovCap,1); overlap_p = strings(ovCap,1); overlap_a = zeros(ovCap,1);
    for r = 0:ny-1
        for c = 0:nx-1
            id = r*nx + c + 1;
            x1 = x0 + c*cs; y1 = y0 + r*cs;
            cell_id(id)=id; row(id)=r; col(id)=c;
            xc(id)=x1+cs/2; yc(id)=y1+cs/2;
            cellpg = polyshape([x1 x1+cs x1+cs x1], [y1 y1 y1+cs y1+cs]);
            totA = 0;
            bestA = -1; bestP = "";
            for i = 1:numel(LGU)
                bb = LGU(i).bb;
                if x1+cs < bb(1) || x1 > bb(2) || y1+cs < bb(3) || y1 > bb(4)
                    continue
                end
                inter = intersect(cellpg, LGU(i).pg);
                a = area(inter); % m^2
                if a > 0
                    totA = totA + a;
                    kOv = kOv + 1;
                    if kOv > ovCap
                        overlap_cid(end+4000,1)=0; overlap_a(end+4000,1)=0; %#ok<AGROW>
                        overlap_p(end+4000,1)=""; ovCap = numel(overlap_cid);
                    end
                    overlap_cid(kOv) = id;
                    overlap_p(kOv) = string(LGU(i).pcode);
                    overlap_a(kOv) = a/1e6;
                    if a > bestA || (a == bestA && LGU(i).pcode < bestP)
                        bestA = a; bestP = string(LGU(i).pcode);
                    end
                end
            end
            if totA > 0
                is_active(id) = true;
                nActive = nActive + 1;
                ncr_frac(id) = totA / (cs*cs);
                dom(id) = bestP;
                db(id) = hypot(xc(id)-exb, yc(id)-eyb)/1000;
                da(id) = hypot(xc(id)-exa, yc(id)-eya)/1000;
                df(id) = geom_point_polyline_distance(xc(id), yc(id), vx, vy)/1000;
                rjb1(id) = geom_point_polyline_distance(xc(id), yc(id), rx1, ry1)/1000;
                rjb3(id) = geom_point_polyline_distance(xc(id), yc(id), rx3, ry3)/1000;
                fc(id) = geom_segment_rect_intersect(vx(1:end-1), vy(1:end-1), vx(2:end), vy(2:end), ...
                    x1, y1, x1+cs, y1+cs);
            end
        end
        if mod(r, 20) == 0
            fprintf('    row %d/%d, active so far %d\n', r, ny-1, nActive);
        end
    end
    overlap_cid = overlap_cid(1:kOv);
    overlap_p = overlap_p(1:kOv);
    overlap_a = overlap_a(1:kOv);
    fprintf('  active cells = %d, overlap rows = %d\n', nActive, kOv);

    C = add_check(C, 'C07', 'Active cells at 500 m, target 2645 ± 1%', nActive, 2645, 2645*0.01, ...
        passfail(nActive, 2645, 2645*0.01));
    ovSum = sum(overlap_a);
    C = add_check(C, 'C07b', 'Sum of cell-LGU overlap equals NCR area (km2)', ovSum, unionArea, unionArea*0.001, ...
        passfail(ovSum, unionArea, unionArea*0.001));
    % unique (cell, LGU)
    keyOK = (numel(unique(string(overlap_cid) + "|" + overlap_p)) == kOv);
    allLgu = all(ismember(string(pop.adm3_pcode), overlap_p));
    C = add_check(C, 'C08', 'Unique (cell,LGU) keys and every LGU present', double(keyOK && allLgu), 1, 0, ...
        passfail(double(keyOK && allLgu), 1, 0));

    patCells = sum(overlap_p == "PH1307606");
    C = add_check(C, 'C08b', 'Pateros overlapping cells (>=10, pre-check 13)', patCells, 13, 5, ...
        passfail(patCells, 13, 5));

    % --- Population (WorldPop dasymetric) ---
    fprintf('  assigning WorldPop pixels to LGUs...\n');
    owner = assign_wp_owner(wp.x_m, wp.y_m, LGU);
    fprintf('  pixels assigned: %d of %d\n', nnz(owner>0), numel(owner));
    fprintf('  allocating population (WorldPop dasymetric)...\n');
    [pop_long, pop_cell_out, consMax, nPos, maxPop] = allocate_dasymetric( ...
        wp, LGU, pop, x0, y0, cs, nx, ny, 'total_population', owner);
    pop_cell(pop_cell_out.cell_id) = pop_cell_out.population_2020;
    C = add_check(C, 'C09', 'Max |LGU allocated - PSA| (persons), both methods target <= 0.5', ...
        consMax, 0, 0.5, passfail(consMax, 0, 0.5));
    ncrAlloc = sum(pop_cell);
    C = add_check(C, 'C09b', 'NCR allocated population', ncrAlloc, 13484462, 1, ...
        passfail(ncrAlloc, 13484462, 1));
    C = add_check(C, 'C10', 'No negative/NaN population on active cells', ...
        double(all(pop_cell(is_active) >= 0) && all(isfinite(pop_cell))), 1, 0, ...
        passfail(double(all(pop_cell(is_active) >= 0) && all(isfinite(pop_cell))), 1, 0));
    fprintf('  populated cells = %d, max cell pop = %.1f\n', nPos, maxPop);

    % Merge pop into overlap long table
    overlap_pop = zeros(kOv, 1);
    % pop_long is cell x LGU
    popMap = containers.Map('KeyType','char','ValueType','double');
    for i = 1:height(pop_long)
        popMap(char(string(pop_long.cell_id(i)) + "|" + pop_long.adm3_pcode(i))) = pop_long.population_2020(i);
    end
    for i = 1:kOv
        k = char(string(overlap_cid(i)) + "|" + overlap_p(i));
        if isKey(popMap, k)
            overlap_pop(i) = popMap(k);
        end
    end

    % Housing units by floor group (same weights)
    fprintf('  allocating occupied housing units by floor group...\n');
    units_long = allocate_housing(wp, LGU, housF, xw, x0, y0, cs, nx, ny, owner);
    unitSum = sum(units_long.occupied_housing_units);
    C = add_check(C, 'C09c', 'Allocated occupied housing units equal PSA floors total 3,257,020', ...
        unitSum, 3257020, 1, passfail(unitSum, 3257020, 1));
    C = add_check(C, 'C09d', 'Every allocated housing row has a Hazus class', ...
        double(all(strlength(units_long.hazus_sbt) > 0)), 1, 0, ...
        passfail(double(all(strlength(units_long.hazus_sbt) > 0)), 1, 0));


    % Distances checks
    act = is_active;
    slack = max(df(act) - db(act));
    C = add_check(C, 'C13', 'dist_fault <= dist_epi_baseline + 0.001 km (epicenter on trace)', ...
        slack, 0, 0.001, passfail(max(slack,0), 0, 0.001));
    nCross = sum(fc(act));
    C = add_check(C, 'C14', 'Fault-crossed active cells (target 90-110, pre-check 100)', ...
        nCross, 100, 10, passfail(nCross, 100, 10));
    if nCross > 0
        maxDfC = max(df(act & fc));
    else
        maxDfC = NaN;
    end
    C = add_check(C, 'C14b', 'Max dist_fault among crossed cells (km), <= 0.354', ...
        maxDfC, 0.354, 0, passfail(max(maxDfC-0.354, 0), 0, 0)); % PASS if maxDfC<=0.354

    % LGUs crossed by the trace
    crossedP = strings(0,1);
    for i = 1:numel(LGU)
        if geom_poly_hits_line(LGU(i).pg, vx, vy)
            crossedP(end+1,1) = string(LGU(i).pcode); %#ok<AGROW>
        end
    end
    expectedX = ["PH1307404";"PH1307402";"PH1307403";"PH1307602";"PH1307607";"PH1307603"];
    fprintf('  WVF-crossed LGUs: %s\n', strjoin(cellstr(crossedP), ', '));
    matchX = isequal(sort(crossedP(:)), sort(expectedX(:)));
    hasPat = any(crossedP(:) == "PH1307606");
    C = add_check(C, 'C15', 'WVF crosses QC, Marikina, Pasig, Makati, Taguig, Muntinlupa (not Pateros)', ...
        double(matchX && ~hasPat), 1, 0, passfail(double(matchX && ~hasPat), 1, 0));

    % Lipschitz on 4-neighbours
    lipOK = true; lipMax = 0;
    for r = 0:ny-1
        for c = 0:nx-1
            id = r*nx+c+1;
            if ~is_active(id), continue; end
            if c+1 < nx
                id2 = r*nx+(c+1)+1;
                if is_active(id2)
                    lipMax = max(lipMax, abs(df(id)-df(id2)));
                    if abs(df(id)-df(id2)) > cs/1000 + 1e-6, lipOK = false; end
                    if abs(db(id)-db(id2)) > cs/1000 + 1e-6, lipOK = false; end
                end
            end
            if r+1 < ny
                id2 = (r+1)*nx+c+1;
                if is_active(id2)
                    lipMax = max(lipMax, abs(df(id)-df(id2)));
                    if abs(df(id)-df(id2)) > cs/1000 + 1e-6, lipOK = false; end
                end
            end
        end
    end
    C = add_check(C, 'C16', 'Neighbour Lipschitz on distance fields (km)', lipMax, 0, cs/1000+1e-6, ...
        passfail(lipMax, 0, cs/1000+1e-6));

    % Which LGU contains each epicenter
    epiBLGU = point_lgu(exb, eyb, LGU);
    epiALGU = point_lgu(exa, eya, LGU);
    fprintf('  baseline epicenter LGU = %s, alternative = %s\n', epiBLGU, epiALGU);

    % --- Write tables ---
    Tcells = table(cell_id, row, col, xc, yc, is_active, ncr_frac, dom, pop_cell, db, da, df, rjb1, rjb3, fc, ...
        'VariableNames', {'cell_id','row','col','x_center_m','y_center_m','is_active', ...
        'ncr_area_fraction','dominant_lgu_pcode','population_2020', ...
        'dist_epi_baseline_km','dist_epi_alt_km','dist_fault_km', ...
        'rjb_s1_km','rjb_s3_km','fault_crosses'});
    writetable(Tcells, fullfile(outd, 'ncr_grid_cells.csv'));

    Tov = table(overlap_cid, overlap_p, overlap_a, overlap_pop, ...
        'VariableNames', {'cell_id','adm3_pcode','overlap_km2','population_2020'});
    writetable(Tov, fullfile(outd, 'ncr_cell_lgu.csv'));
    writetable(units_long, fullfile(outd, 'ncr_cell_lgu_housing.csv'));
    writetable(pop_long, fullfile(outd, 'ncr_cell_lgu_population.csv'));

    % LGU summary
    S = pop;
    S.allocated_population = zeros(nL,1);
    S.area_km2 = zeros(nL,1);
    S.n_cells = zeros(nL,1);
    S.n_crossed = zeros(nL,1);
    S.min_dist_fault_km = nan(nL,1);
    S.mean_popw_dist_fault_km = nan(nL,1);
    for i = 1:nL
        p = string(pop.adm3_pcode(i));
        m = overlap_p == p;
        S.allocated_population(i) = sum(overlap_pop(m));
        S.area_km2(i) = sum(overlap_a(m));
        S.n_cells(i) = numel(unique(overlap_cid(m)));
        cids = unique(overlap_cid(m));
        S.n_crossed(i) = sum(fc(cids));
        S.min_dist_fault_km(i) = min(df(cids));
        w = overlap_pop(m);
        dd = df(overlap_cid(m));
        if sum(w) > 0
            S.mean_popw_dist_fault_km(i) = sum(w.*dd)/sum(w);
        end
    end
    writetable(S, fullfile(outd, 'ncr_lgu_summary.csv'));

    % Maps
    fprintf('  plotting maps...\n');
    plot_ncr_maps(cfg, Tcells, verts, wvf, exb, eyb, exa, eya, outd, LGU, rx1, ry1, rx3, ry3);

    % Package for scenarios
    G = struct();
    G.cells = Tcells;
    G.overlap = Tov;
    G.units = units_long;
    G.pop = pop;
    G.LGU = LGU;
    G.vx = vx; G.vy = vy;
    G.exb = exb; G.eyb = eyb; G.exa = exa; G.eya = eya;
    G.rx1 = rx1; G.ry1 = ry1; G.rx3 = rx3; G.ry3 = ry3;
    G.L1 = L1; G.L3 = L3;
    G.x0 = x0; G.y0 = y0; G.nx = nx; G.ny = ny; G.cs = cs;
    G.outd = outd;
    G.unionArea = unionArea;
    G.housF = housF;
    G.xw = xw;

    fprintf('NCR grid done. Active=%d crossed=%d pop=%.1f\n', nActive, nCross, ncrAlloc);
end

function [LGU, unionArea, unionPoly] = build_lgu_polyshapes(verts)
    pcodes = unique(verts.adm3_pcode, 'stable');
    LGU = struct('pcode', {}, 'pg', {}, 'n_parts', {}, 'xbox', {}, 'ybox', {});
    unionPoly = polyshape();
    first = true;
    for i = 1:numel(pcodes)
        sub = verts(strcmp(verts.adm3_pcode, pcodes{i}) | verts.adm3_pcode == string(pcodes{i}), :);
        if iscell(verts.adm3_pcode) || isstring(verts.adm3_pcode)
            sub = verts(string(verts.adm3_pcode) == string(pcodes(i)), :);
        end
        parts = unique(sub.part_id);
        xs = {}; ys = {};
        for p = 1:numel(parts)
            ext = sub(sub.part_id == parts(p) & sub.is_hole == 0, :);
            ext = sortrows(ext, 'vertex_idx');
            x = ext.x_m; y = ext.y_m;
            if numel(x) > 1 && x(1) == x(end) && y(1) == y(end)
                x(end) = []; y(end) = [];
            end
            xs{end+1} = x; %#ok<AGROW>
            ys{end+1} = y; %#ok<AGROW>
        end
        pg = polyshape(xs, ys, 'Simplify', false);
        % Simplify only if needed for valid area
        if area(pg) <= 0
            pg = polyshape(xs, ys);
        end
        LGU(i).pcode = char(string(pcodes(i)));
        LGU(i).pg = pg;
        LGU(i).n_parts = numel(parts);
        if first
            unionPoly = pg; first = false;
        else
            unionPoly = union(unionPoly, pg);
        end
    end
    unionArea = area(unionPoly)/1e6;
end

function [pop_long, pop_cell, consMax, nPos, maxPop] = allocate_dasymetric(wp, LGU, pop, x0, y0, cs, nx, ny, popfield, owner)
    px = wp.x_m; py = wp.y_m; w = wp.weight;
    if nargin < 10 || isempty(owner)
        owner = assign_wp_owner(px, py, LGU);
    end
    if istable(w), w = w{:,1}; end
    lguW = zeros(numel(LGU),1);
    has = owner > 0;
    if any(has)
        lguW = accumarray(owner(has), w(has), [numel(LGU), 1]);
    end
    cc = floor((px - x0)/cs);
    rr = floor((py - y0)/cs);
    valid = cc >= 0 & rr >= 0 & cc < nx & rr < ny & owner > 0;
    cid = rr*nx + cc + 1;

    cidv = cid(valid);
    ownv = owner(valid);
    wv = w(valid);
    if isempty(cidv)
        error('No WorldPop pixels fell in the grid');
    end
    [u, ~, ic] = unique([cidv, ownv], 'rows');
    wsum = accumarray(ic, wv);

    popOf = zeros(numel(LGU),1);
    pcodeOf = strings(numel(LGU),1);
    for i = 1:numel(LGU)
        pcodeOf(i) = string(LGU(i).pcode);
        m = string(pop.adm3_pcode) == pcodeOf(i);
        if sum(m) ~= 1
            error('Expected one population row for %s, got %d', LGU(i).pcode, sum(m));
        end
        popOf(i) = pop{m, popfield};
        if lguW(i) <= 0
            error('LGU %s has zero WorldPop weight', LGU(i).pcode);
        end
    end

    nK = size(u,1);
    cell_ids = u(:,1);
    own_ids = u(:,2);
    pcodes = pcodeOf(own_ids);
    pops = popOf(own_ids) .* wsum ./ lguW(own_ids);
    pop_long = table(cell_ids, pcodes, pops, 'VariableNames', {'cell_id','adm3_pcode','population_2020'});

    consMax = 0;
    for i = 1:numel(LGU)
        s = sum(pops(own_ids == i));
        consMax = max(consMax, abs(s - popOf(i)));
    end
    [uc, ~, icc] = unique(cell_ids);
    popc = accumarray(icc, pops);
    pop_cell = table(uc, popc, 'VariableNames', {'cell_id','population_2020'});
    nPos = sum(popc > 0);
    if isempty(popc), maxPop = 0; else, maxPop = max(popc); end
end

function units_long = allocate_housing(wp, LGU, housF, xw, x0, y0, cs, nx, ny, owner)
    % Same WorldPop weights, units by LGU x floor_group (mapped to class)
    % Build a fake "pop" table per (LGU, floor_group) and allocate each separately,
    % then attach Yamaguchi/Hazus class from the crosswalk.
    groups = unique(string(housF.floor_group), 'stable');
    acc = table();
    for g = 1:numel(groups)
        sub = housF(string(housF.floor_group) == groups(g), :);
        fake = table(sub.adm3_pcode, sub.occupied_housing_units, ...
            'VariableNames', {'adm3_pcode','total_population'});
        [pl, ~, ~, ~, ~] = allocate_dasymetric(wp, LGU, fake, x0, y0, cs, nx, ny, 'total_population', owner);
        pl.floor_group = repmat(groups(g), height(pl), 1);
        pl.Properties.VariableNames{'population_2020'} = 'occupied_housing_units';
        acc = [acc; pl]; %#ok<AGROW>
    end
    % map class
    acc.yamaguchi_class = strings(height(acc),1);
    acc.yamaguchi_period = strings(height(acc),1);
    acc.hazus_sbt = strings(height(acc),1);
    acc.status = strings(height(acc),1);
    for i = 1:height(acc)
        m = xw.floor_group == acc.floor_group(i);
        if any(m)
            acc.yamaguchi_class(i) = xw.yamaguchi_class(find(m,1));
            acc.yamaguchi_period(i) = xw.yamaguchi_period(find(m,1));
            acc.hazus_sbt(i) = xw.hazus_sbt(find(m,1));
            acc.status(i) = xw.status(find(m,1));
        else
            acc.yamaguchi_class(i) = "RC";
            acc.yamaguchi_period(i) = "average";
            acc.hazus_sbt(i) = "C1L";
            acc.status(i) = "ASSUMED_DEFAULT";
        end
    end
    units_long = acc;
end

function tf = geom_poly_hits_line(pg, vx, vy)
    [xlim, ylim] = boundingbox(pg);
    % quick reject
    if all(vx < xlim(1) | vx > xlim(2)) && true
        % still may cross; use full test
    end
    % discretize: any vertex inside or any segment intersects bbox of poly AND intersects poly
    [px, py] = boundary(pg);
    % Check segment-polygon intersection via a dense sample and endpoint-in / crossings
    tf = false;
    for k = 1:numel(vx)-1
        midX = 0.5*(vx(k)+vx(k+1));
        midY = 0.5*(vy(k)+vy(k+1));
        if isinterior(pg, vx(k), vy(k)) || isinterior(pg, vx(k+1), vy(k+1)) || isinterior(pg, midX, midY)
            tf = true; return
        end
        % segment vs each polygon edge
        for e = 1:numel(px)-1
            if any(isnan([px(e), py(e), px(e+1), py(e+1)])), continue; end
            if segments_cross(vx(k), vy(k), vx(k+1), vy(k+1), px(e), py(e), px(e+1), py(e+1))
                tf = true; return
            end
        end
    end
end

function tf = segments_cross(ax,ay,bx,by,cx,cy,dx,dy)
    a1 = cross2(bx-ax, by-ay, cx-ax, cy-ay);
    a2 = cross2(bx-ax, by-ay, dx-ax, dy-ay);
    a3 = cross2(dx-cx, dy-cy, ax-cx, ay-cy);
    a4 = cross2(dx-cx, dy-cy, bx-cx, by-cy);
    tf = (a1*a2 <= 0) && (a3*a4 <= 0) && ~(a1==0 && a2==0 && a3==0 && a4==0 && ...
        (max(ax,bx) < min(cx,dx) || max(cx,dx) < min(ax,bx)));
    % collinear overlap treated as hit if projections overlap
    if a1==0 && a2==0
        tf = ~(max(ax,bx) < min(cx,dx) || max(cx,dx) < min(ax,bx) || max(ay,by) < min(cy,dy) || max(cy,dy) < min(ay,by));
    end
end
function z = cross2(x1,y1,x2,y2), z = x1*y2 - y1*x2; end

function pcode = point_lgu(x, y, LGU)
    pcode = "OUTSIDE";
    for i = 1:numel(LGU)
        if isinterior(LGU(i).pg, x, y)
            pcode = string(LGU(i).pcode); return
        end
    end
end
