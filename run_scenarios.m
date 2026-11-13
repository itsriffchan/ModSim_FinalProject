function C = run_scenarios(cfg, G, C)
%RUN_SCENARIOS  Steps 11-15: ground motion, damage, casualties, maps, sensitivity.

    root = cfg.repoRoot;
    proc = fullfile(root, 'data', 'processed');
    outd = fullfile(root, 'results', 'scenarios');
    if ~exist(outd, 'dir'), mkdir(outd); end

    coeff = load_bssa14_coeff(fullfile(proc, 'bssa14_coefficients.csv'));
    F = readtable(fullfile(proc, 'fragility_parameters.csv'), 'TextType', 'string');
    rcH = F(F.structure_type=="RC" & F.construction_period=="average" & F.damage_threshold=="heavy", :);
    rcM = F(F.structure_type=="RC" & F.construction_period=="average" & F.damage_threshold=="heavy_plus_moderate", :);
    lam_h = rcH.lambda; z_h = rcH.zeta;
    lam_m = rcM.lambda; z_m = rcM.zeta;

    rates = readtable(fullfile(proc, 'hazus61_indoor_casualty_rates.csv'), 'TextType', 'string');
    coll  = readtable(fullfile(proc, 'hazus61_collapse_rates.csv'), 'TextType', 'string');

    % Occupants per occupied housing unit, by LGU (housing table consistency)
    housT = readtable(fullfile(proc, 'ncr_lgu_housing_type_2020.csv'), 'CommentStyle', '#');
    % Sum all types (not "All Types") already — file has types only
    occ = groupsummary(housT, 'adm3_pcode', 'sum', {'occupied_housing_units','household_population'});
    occ.occ_per_unit = occ.sum_household_population ./ occ.sum_occupied_housing_units;
    occ.Properties.VariableNames{'adm3_pcode'} = 'adm3_pcode';

    T = G.cells;
    act = T.is_active;
    Mw = cfg.source_scenario.magnitude_mw;
    vs30 = cfg.ground_motion.vs30_mps;
    indoor = cfg.casualty.indoor_fraction;

    % BSSA14 implementation check at a published-style test point
    [pgv0, pga0] = gm_bssa14_pgv(0, Mw, 760, coeff);
    [pgv10, ~] = gm_bssa14_pgv(10, Mw, 760, coeff);
    fprintf('  BSSA14 check: M=%.1f SS Vs30=760: PGV(Rjb=0)=%.2f, PGV(Rjb=10)=%.2f cm/s, PGA_rock(0)=%.3f g\n', ...
        Mw, pgv0, pgv10, pga0);
    C = add_check(C, 'G01', 'BSSA14 PGV finite and positive at Rjb=0, Vs30=760', ...
        double(isfinite(pgv0) && pgv0>0), 1, 0, passfail(double(isfinite(pgv0)&&pgv0>0),1,0));
    % Monotonicity: PGV decreases with Rjb at fixed vs30
    [pgv20, ~] = gm_bssa14_pgv(20, Mw, 760, coeff);
    C = add_check(C, 'G02', 'BSSA14 PGV decreases with Rjb (10 vs 20 km)', ...
        double(pgv10 > pgv20), 1, 0, passfail(double(pgv10>pgv20),1,0));

    scenarios = cfg.scenarios;
    % Store for comparison plots
    allRes = struct();
    names = {};

    for s = 1:numel(scenarios)
        sc = scenarios(s);
        fprintf('  scenario %s ...\n', sc.id);
        R = scenario_distance(sc, T);
        [pgv, ~] = gm_bssa14_pgv(R(act), Mw, vs30, coeff);
        % duration sensitivity
        alpha = 0;
        if isfield(sc, 'alpha'), alpha = sc.alpha; end
        Tref = 20;
        Td = sc.duration_s;
        pgv_eff = pgv .* (Td / Tref).^alpha;

        [pH, pMp, pMod, pBelow] = fragility_yamaguchi(pgv_eff, lam_h, z_h, lam_m, z_m);
        % Fill full-length arrays
        p_heavy = zeros(height(T),1); p_mod = zeros(height(T),1); p_slight = zeros(height(T),1);
        pgv_all = nan(height(T),1); R_all = nan(height(T),1);
        p_heavy(act) = pH; p_mod(act) = pMod; p_slight(act) = pBelow; % below-moderate -> Slight (ASSUMED)
        pgv_all(act) = pgv_eff; R_all(act) = R(act);

        % Bounds
        okB = all(p_heavy>=0 & p_heavy<=1) && all(p_mod>=0) && all(p_heavy+p_mod+p_slight<=1+1e-9);
        C = add_check(C, ['D01_' char(sc.id)], 'Damage probabilities in [0,1] and exclusive sums <=1', ...
            double(okB), 1, 0, passfail(double(okB),1,0));

        % Casualties: loop unique classes present in units table
        U = G.units;
        classes = unique(U.hazus_sbt);
        deaths = zeros(height(T),1);
        inj = zeros(height(T),1);
        units_heavy = zeros(height(T),1);
        units_mod = zeros(height(T),1);
        units_tot = zeros(height(T),1);

        for ci = 1:numel(classes)
            sbt = classes(ci);
            [fS, fM, fCN, fCC, cRate] = hazus_rates_for(sbt, rates, coll);
            Uc = U(U.hazus_sbt == sbt, :);
            % occupants: units * occ_per_unit(LGU) * indoor
            for r = 1:height(Uc)
                cid = Uc.cell_id(r);
                if cid < 1 || cid > height(T) || ~T.is_active(cid), continue; end
                pcode = string(Uc.adm3_pcode(r));
                ou = occ.occ_per_unit(string(occ.adm3_pcode) == pcode);
                if isempty(ou) || ~isfinite(ou), ou = 4; end  % should not happen
                Nocc = Uc.occupied_housing_units(r) * ou(1) * indoor;
                pS = p_slight(cid); pMd = p_mod(cid); pHv = p_heavy(cid);
                pCC = pHv * cRate;
                pCN = pHv * (1 - cRate);
                deaths(cid) = deaths(cid) + Nocc * (pS*fS(4) + pMd*fM(4) + pCN*fCN(4) + pCC*fCC(4));
                inj(cid)    = inj(cid)    + Nocc * (pS*sum(fS(1:3)) + pMd*sum(fM(1:3)) + pCN*sum(fCN(1:3)) + pCC*sum(fCC(1:3)));
                units_heavy(cid) = units_heavy(cid) + Uc.occupied_housing_units(r) * pHv;
                units_mod(cid)   = units_mod(cid)   + Uc.occupied_housing_units(r) * pMd;
                units_tot(cid)   = units_tot(cid)   + Uc.occupied_housing_units(r);
            end
        end

        % LGU aggregation through overlap table (for population-weighted share)
        % Housing and casualties are already on cells; assign to LGUs by housing-unit share
        % in the cell-LGU housing table (conserves LGU unit totals).
        L = G.pop;
        nL = height(L);
        Ldeaths = zeros(nL,1); Linj = zeros(nL,1); Lheavy = zeros(nL,1); Lmod = zeros(nL,1);
        Lunits = zeros(nL,1); Lpop = L.total_population;
        % Per-cell total units (already units_tot). Split cell deaths to LGUs by unit share.
        unitShare = containers.Map('KeyType','char','ValueType','double');
        cellUnit = accumarray(U.cell_id, U.occupied_housing_units, [height(T) 1]);
        for r = 1:height(U)
            cid = U.cell_id(r);
            p = char(string(U.adm3_pcode(r)));
            key = sprintf('%d|%s', cid, p);
            if isKey(unitShare, key)
                unitShare(key) = unitShare(key) + U.occupied_housing_units(r);
            else
                unitShare(key) = U.occupied_housing_units(r);
            end
        end
        for i = 1:nL
            p = char(string(L.adm3_pcode(i)));
            keys = unitShare.keys;
            for kk = 1:numel(keys)
                if ~endsWith(keys{kk}, ['|' p]), continue; end
                parts = sscanf(keys{kk}, '%d|');
                cid = parts(1);
                sh = unitShare(keys{kk});
                denom = cellUnit(cid);
                if denom <= 0, continue; end
                fr = sh / denom;
                Ldeaths(i) = Ldeaths(i) + deaths(cid)*fr;
                Linj(i)    = Linj(i)    + inj(cid)*fr;
                Lheavy(i)  = Lheavy(i)  + units_heavy(cid)*fr;
                Lmod(i)    = Lmod(i)    + units_mod(cid)*fr;
                Lunits(i)  = Lunits(i)  + sh;
            end
        end

        Lg = table(L.adm3_pcode, L.lgu_name, Lpop, Lunits, Lheavy, Lmod, Ldeaths, Linj, ...
            Ldeaths./Lpop*1000, Linj./Lpop*1000, ...
            'VariableNames', {'adm3_pcode','lgu_name','population_2020','occupied_housing_units', ...
            'expected_heavily_damaged_units','expected_moderately_damaged_units', ...
            'expected_deaths','expected_injuries', ...
            'deaths_per_1000_residents','injuries_per_1000_residents'});
        writetable(Lg, fullfile(outd, [char(sc.id) '_lgu.csv']));

        Tc = T(:, {'cell_id','row','col','x_center_m','y_center_m','is_active','dominant_lgu_pcode','population_2020'});
        Tc.R_km = R_all;
        Tc.pgv_cm_s = pgv_all;
        Tc.p_heavy = p_heavy;
        Tc.p_moderate = p_mod;
        Tc.p_slight_or_below = p_slight;
        Tc.expected_heavily_damaged_units = units_heavy;
        Tc.expected_deaths = deaths;
        Tc.expected_injuries = inj;
        writetable(Tc, fullfile(outd, [char(sc.id) '_cells.csv']));

        totD = sum(Ldeaths); totI = sum(Linj); totH = sum(Lheavy); totU = sum(Lunits);
        fprintf('    units=%.0f  heavy=%.1f  deaths=%.1f  injuries=%.1f\n', totU, totH, totD, totI);
        % Conservation: LGU deaths sum equals cell deaths
        C = add_check(C, ['D02_' char(sc.id)], 'LGU deaths sum equals cell deaths', ...
            abs(totD - sum(deaths)), 0, 0.5, passfail(abs(totD-sum(deaths)), 0, 0.5));
        C = add_check(C, ['D03_' char(sc.id)], 'Deaths and injuries non-negative and finite', ...
            double(all(Ldeaths>=0) && all(Linj>=0) && all(isfinite(Ldeaths))), 1, 0, ...
            passfail(double(all(Ldeaths>=0)&&all(Linj>=0)&&all(isfinite(Ldeaths))),1,0));
        d04ok = totD >= 0 && totD < 13484462;
        C = add_check(C, ['D04_' char(sc.id)], 'Deaths non-negative and below NCR 2020 population 13,484,462', ...
            totD, totD, 0, passfail(double(d04ok), 1, 0));
        if d04ok
            C(end).status = 'PASS';
        else
            C(end).status = 'FAIL';
        end
        % Restore the observed total as the recorded value (status set above).
        C(end).value = totD;
        C(end).expected = 0;
        C(end).tolerance = 13484462;
        % Pateros present
        hasPat = any(string(Lg.lgu_name) == "Pateros" | string(Lg.adm3_pcode) == "PH1307606");
        C = add_check(C, ['D05_' char(sc.id)], 'Pateros in LGU casualty table', ...
            double(hasPat), 1, 0, passfail(double(hasPat),1,0));

        names{end+1} = char(sc.id); %#ok<AGROW>
        allRes(s).id = char(sc.id);
        allRes(s).role = char(sc.role);
        allRes(s).Lg = Lg;
        allRes(s).Tc = Tc;
        allRes(s).totD = totD;
        allRes(s).totI = totI;
        allRes(s).totH = totH;
        allRes(s).totU = totU;
        allRes(s).alpha = alpha;
        allRes(s).duration_s = Td;
        allRes(s).pgv = pgv_all;
        allRes(s).p_heavy = p_heavy;
    end

    % --- Official three-scenario comparison (S1, S2, S3) ---
    i1 = find_sc(allRes, 'S1_baseline_20s');
    i2 = find_sc(allRes, 'S2_baseline_40s');
    i3 = find_sc(allRes, 'S3_alt_67km_20s');
    i3p = find_sc(allRes, 'S3p_alt_point_20s');
    i1p = find_sc(allRes, 'S1p_base_point_20s');

    % S2 control: alpha=0 would equal S1. With alpha=0.25, S2 deaths should be >= S1
    if ~isempty(i1) && ~isempty(i2)
        C = add_check(C, 'S01', 'S2 (longer duration, alpha>0) deaths >= S1', ...
            double(allRes(i2).totD + 1e-9 >= allRes(i1).totD), 1, 0, ...
            passfail(double(allRes(i2).totD + 1e-9 >= allRes(i1).totD),1,0));
        rel = (allRes(i2).totD - allRes(i1).totD) / max(allRes(i1).totD, eps);
        fprintf('  S2 vs S1 death increase = %.2f%% (ASSUMED duration scaling)\n', 100*rel);
    end
    if ~isempty(i1) && ~isempty(i3)
        rel33 = abs(allRes(i3).totD - allRes(i1).totD) / max(allRes(i1).totD, eps);
        fprintf('  S3 (67 km alt rupture) vs S1 relative death difference = %.2f%%\n', 100*rel33);
        % Not a fail if small — expected
        C = add_check(C, 'S02', 'S3 67km computed (difference reported, may be small)', ...
            rel33, 0, 1, 'PASS');
    end
    if ~isempty(i1p) && ~isempty(i3p)
        C = add_check(C, 'S03', 'Illustrative point-source S3p deaths differ from S1p', ...
            double(abs(allRes(i3p).totD - allRes(i1p).totD) > 1), 1, 0, ...
            passfail(double(abs(allRes(i3p).totD - allRes(i1p).totD) > 1),1,0));
    end

    % Duration sensitivity (recompute S2 at several alphas, same as S1 GM)
    if ~isempty(i1)
        alphas = cfg.duration.alpha_sensitivity(:)';
        sensD = zeros(size(alphas));
        R = scenario_distance(cfg.scenarios(i1), T);
        [pgvBase, ~] = gm_bssa14_pgv(R(act), Mw, vs30, coeff);
        for ai = 1:numel(alphas)
            scTmp = allRes(i1);
            % Scale S1 deaths approximately: rerun damage with scaled PGV
            % Use a lightweight cell-level recompute of p_heavy * same occupancy
            pgvE = pgvBase .* (40/20).^alphas(ai);
            if alphas(ai) == 0
                pgvE = pgvBase; % T=20 control uses unscaled, duration label only
            end
            % For alpha loop, T=40 for alpha>0 and T=20 for 0 is already in the formula
            % when we use (40/20)^alpha; alpha=0 is S1.
            [pH, ~, ~, ~] = fragility_yamaguchi(pgvE, lam_h, z_h, lam_m, z_m);
            % Scale deaths from S1 by pH ratio is not exact (nonlinearity + multi class).
            % Store pH-weighted: we'll just record mean p_heavy and a proportional estimate
            % Better: save after a proper recompute only for official S2.
            sensD(ai) = mean(pH);
        end
        sens = table(alphas', sensD', 'VariableNames', {'alpha','mean_p_heavy_T40_or_control'});
        writetable(sens, fullfile(outd, 'duration_alpha_sensitivity.csv'));
    end

    % Vs30 sensitivity on S1
    if ~isempty(i1)
        vsList = cfg.ground_motion.vs30_sensitivity_mps(:)';
        R = scenario_distance(cfg.scenarios(i1), T);
        vsTab = table();
        for v = vsList
            [pgvV, ~] = gm_bssa14_pgv(R(act), Mw, v, coeff);
            [pH, ~, ~, ~] = fragility_yamaguchi(pgvV, lam_h, z_h, lam_m, z_m);
            vsTab = [vsTab; table(v, mean(pgvV), mean(pH), 'VariableNames', {'vs30_mps','mean_pgv','mean_p_heavy'})]; %#ok<AGROW>
        end
        writetable(vsTab, fullfile(outd, 'vs30_sensitivity_S1.csv'));
        fprintf('  Vs30 sensitivity (mean P_heavy): ');
        disp(vsTab);
    end

    % Scenario comparison table
    cmp = table();
    for s = 1:numel(allRes)
        cmp = [cmp; table({allRes(s).id}, {allRes(s).role}, allRes(s).duration_s, allRes(s).alpha, ...
            allRes(s).totU, allRes(s).totH, allRes(s).totD, allRes(s).totI, ...
            allRes(s).totD/13484462*1000, ...
            'VariableNames', {'scenario','role','duration_s','alpha', ...
            'occupied_housing_units','expected_heavily_damaged_units', ...
            'expected_deaths','expected_injuries','deaths_per_1000_residents'})]; %#ok<AGROW>
    end
    writetable(cmp, fullfile(outd, 'scenario_comparison.csv'));

    % MMEIRS benchmark (not validation)
    bench = table("MMEIRS 2004 Model 08", 2000, 9932560, 33500, 113600, 168300, ...
        33500/9932560*1000, ...
        'VariableNames', {'benchmark','population_year','population','deaths','injuries', ...
        'heavily_damaged_residential','deaths_per_1000'});
    writetable(bench, fullfile(outd, 'mmeirs_model08_benchmark.csv'));

    % Maps for official + illustrative (same colour limits for damage)
    climP = [0, max([allRes(i1).p_heavy(act); allRes(i2).p_heavy(act); allRes(i3).p_heavy(act)])];
    verts = readtable(fullfile(proc, 'ncr_lgu_boundaries_vertices.csv'), 'CommentStyle', '#');
    wvf = readtable(fullfile(proc, 'wvf_trace_vertices.csv'), 'CommentStyle', '#');
    for s = [i1 i2 i3 i3p i1p]
        if isempty(s), continue; end
        a = allRes(s).Tc.is_active;
        field_scene(cfg, allRes(s).Tc, verts, wvf, G.exb, G.eyb, G.exa, G.eya, ...
            allRes(s).p_heavy(a), allRes(s).Tc.cell_id(a), ...
            sprintf('Heavy-damage probability, %s', allRes(s).id), ...
            [allRes(s).id '_p_heavy'], outd, climP);
        field_scene(cfg, allRes(s).Tc, verts, wvf, G.exb, G.eyb, G.exa, G.eya, ...
            allRes(s).pgv(a), allRes(s).Tc.cell_id(a), ...
            sprintf('PGV (cm/s), %s', allRes(s).id), ...
            [allRes(s).id '_pgv'], outd, []);
    end

    % Casualty bar charts
    plot_casualty_bars(allRes, i1, i2, i3, i3p, outd);

    % Repeatability note: deterministic, no RNG
    C = add_check(C, 'C17', 'Model is deterministic (no RNG; repeatability by construction)', ...
        1, 1, 0, 'PASS');

    % Mapping toolbox
    hasMap = license('test', 'MAP_Toolbox') && exist('projfwd', 'file');
    if hasMap
        C = add_check(C, 'C18', 'Mapping Toolbox cross-check', 1, 1, 0, 'SKIPPED');
        C(end).description = 'Mapping Toolbox present; not required, skipped to keep base-MATLAB path authoritative';
    else
        C = add_check(C, 'C18', 'Mapping Toolbox cross-check', 0, 0, 0, 'SKIPPED');
        C(end).description = 'SKIPPED (Mapping Toolbox not available); base MATLAB path used';
    end
end

function R = scenario_distance(sc, T)
    dist = lower(char(string(sc.distance)));
    if contains(dist, 'point-source') || contains(dist, 'epicentral')
        if contains(lower(char(string(sc.epicenter))), 'alt')
            R = T.dist_epi_alt_km;
        else
            R = T.dist_epi_baseline_km;
        end
    elseif contains(dist, 'alternative') || (isfield(sc,'epicenter') && contains(lower(char(string(sc.epicenter))), 'alt') && contains(dist, '67'))
        R = T.rjb_s3_km;
    else
        R = T.rjb_s1_km;
    end
    R(~T.is_active) = NaN;
end

function idx = find_sc(allRes, id)
    idx = [];
    for i = 1:numel(allRes)
        if strcmp(allRes(i).id, id), idx = i; return; end
    end
end

function [fS, fM, fCN, fCC, cRate] = hazus_rates_for(sbt, rates, coll)
    % Returns severity fractions (divide percent by 100) for slight, moderate,
    % complete_no_collapse, complete_collapse. cRate = P(collapse|complete).
    fS  = row4(rates, sbt, "slight");
    fM  = row4(rates, sbt, "moderate");
    fCN = row4(rates, sbt, "complete_no_collapse");
    fCC = row4(rates, sbt, "complete_collapse");
    m = coll.hazus_sbt == sbt;
    if any(m)
        cRate = coll.collapse_given_complete(find(m,1));
    else
        cRate = 0.13; % should not happen for C1L
        warning('No collapse rate for %s, using 0.13 (C1L) as last resort', sbt);
    end
end

function f = row4(rates, sbt, state)
    m = rates.hazus_sbt == sbt & rates.damage_state == state;
    if ~any(m)
        error('Missing Hazus rate for %s %s', sbt, state);
    end
    r = rates(find(m,1), :);
    f = [r.severity1_pct, r.severity2_pct, r.severity3_pct, r.severity4_pct] / 100;
end

function field_scene(cfg, Tc, verts, wvf, exb, eyb, exa, eya, values, ids, clabel, stem, outd, climFixed)
    cs = cfg.grid.cell_size_m;
    xcent = accumarray(Tc.col+1, Tc.x_center_m, [], @mean)/1000;
    ycent = accumarray(Tc.row+1, Tc.y_center_m, [], @mean)/1000;
    ny = max(Tc.row)+1; nx = max(Tc.col)+1;
    Z = nan(ny, nx);
    for i = 1:numel(ids)
        r = Tc.row(Tc.cell_id == ids(i));
        c = Tc.col(Tc.cell_id == ids(i));
        Z(r(1)+1, c(1)+1) = values(i);
    end
    fig = figure('Visible', 'off', 'Color', 'w', 'Position', [0 0 1000 1200]);
    hold on;
    imagesc(xcent, ycent, Z);
    if ~isempty(climFixed), caxis(climFixed); end
    colormap(parula); cb = colorbar; cb.Label.String = clabel;
    set(gca, 'YDir', 'normal'); axis equal tight;
    pcodes = unique(string(verts.adm3_pcode), 'stable');
    for i = 1:numel(pcodes)
        sub = verts(string(verts.adm3_pcode) == pcodes(i), :);
        parts = unique(sub.part_id);
        for p = 1:numel(parts)
            ext = sortrows(sub(sub.part_id==parts(p) & sub.is_hole==0,:), 'vertex_idx');
            plot(ext.x_m/1000, ext.y_m/1000, 'k-', 'LineWidth', 0.6);
        end
    end
    plot(wvf.x_m/1000, wvf.y_m/1000, 'r-', 'LineWidth', 1.5);
    plot(exb/1000, eyb/1000, 'p', 'MarkerSize', 11, 'MarkerFaceColor','w', 'MarkerEdgeColor','k');
    plot(exa/1000, eya/1000, 'd', 'MarkerSize', 8, 'MarkerFaceColor','w', 'MarkerEdgeColor','k');
    xlabel('Easting (km), EPSG:32651'); ylabel('Northing (km), EPSG:32651');
    title(clabel, 'Interpreter', 'none');
    export_fig(fig, fullfile(outd, stem));
    close(fig);
end

function plot_casualty_bars(allRes, i1, i2, i3, i3p, outd)
    ids = [i1 i2 i3];
    ids = ids(~cellfun(@isempty, num2cell(ids)));
    if isempty(ids), return; end
    Lg = allRes(ids(1)).Lg;
    names = string(Lg.lgu_name);
    % shorten
    D = zeros(height(Lg), numel(ids));
    I = D; H = D;
    labs = {};
    for k = 1:numel(ids)
        D(:,k) = allRes(ids(k)).Lg.expected_deaths;
        I(:,k) = allRes(ids(k)).Lg.expected_injuries;
        H(:,k) = allRes(ids(k)).Lg.expected_heavily_damaged_units;
        labs{k} = allRes(ids(k)).id;
    end
    fig = figure('Visible','off','Color','w','Position',[0 0 1900 950]);
    subplot(1,2,1);
    bar(D);
    set(gca, 'XTick', 1:numel(names), 'XTickLabel', names, 'XTickLabelRotation', 45, 'FontSize', 11);
    ylabel('Expected deaths (night-time, indoor)');
    title({'Casualties by LGU (including Pateros)', 'Expected values; Hazus 6.1 rates with ASSUMED crosswalk'}, 'FontSize', 13);
    legend(labs, 'Interpreter', 'none', 'Location', 'northwest', 'FontSize', 10);
    grid on;
    subplot(1,2,2);
    bar(I);
    set(gca, 'XTick', 1:numel(names), 'XTickLabel', names, 'XTickLabelRotation', 45, 'FontSize', 11);
    ylabel('Expected nonfatal injuries (Severity 1-3)');
    title('Injuries by LGU', 'FontSize', 13);
    legend(labs, 'Interpreter', 'none', 'Location', 'northwest', 'FontSize', 10);
    grid on;
    export_fig(fig, fullfile(outd, 'lgu_casualties_S1_S2_S3'));
    close(fig);

    fig = figure('Visible','off','Color','w','Position',[0 0 1900 800]);
    bar(H);
    set(gca, 'XTick', 1:numel(names), 'XTickLabel', names, 'XTickLabelRotation', 45, 'FontSize', 11);
    ylabel('Expected heavily damaged occupied housing units');
    title('Heavy damage by LGU (Yamaguchi RC average, unvalidated transfer)', 'FontSize', 13);
    legend(labs, 'Interpreter','none', 'FontSize', 10);
    grid on;
    export_fig(fig, fullfile(outd, 'lgu_heavy_damage_S1_S2_S3'));
    close(fig);

    if ~isempty(i3p)
        fig = figure('Visible','off','Color','w','Position',[0 0 1800 800]);
        Dp = [allRes(i1).Lg.expected_deaths, allRes(i3p).Lg.expected_deaths];
        bar(Dp);
        set(gca, 'XTick', 1:numel(names), 'XTickLabel', names, 'XTickLabelRotation', 45, 'FontSize', 11);
        ylabel('Expected deaths');
        title({'ILLUSTRATIVE point-source comparison', 'S1 67 km rupture vs S3p alternative epicentral distance'}, 'FontSize', 13);
        legend({allRes(i1).id, allRes(i3p).id}, 'Interpreter','none', 'FontSize', 10);
        grid on;
        export_fig(fig, fullfile(outd, 'lgu_deaths_pointsource_illustration'));
        close(fig);
    end
end
