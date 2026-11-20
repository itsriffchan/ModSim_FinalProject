function result = calculate_scenario(cfg, sc, G)
%CALCULATE_SCENARIO Pure scientific calculation. No writes or rendering.
    C = init_checks();
    proc = fullfile(cfg.repoRoot, 'data', 'processed');
    coeff = load_bssa14_coeff(fullfile(proc, 'bssa14_coefficients.csv'));
    F = readtable(fullfile(proc, 'fragility_parameters.csv'), 'TextType', 'string');
    rcH = F(F.structure_type=="RC" & F.construction_period=="average" & F.damage_threshold=="heavy", :);
    rcM = F(F.structure_type=="RC" & F.construction_period=="average" & F.damage_threshold=="heavy_plus_moderate", :);
    assert(height(rcH)==1 && height(rcM)==1, 'Missing or duplicate fragility parameters');
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
    U = G.units;
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

    validate_loss_joins(G, occ, rates, coll);
    zero_pgv = zeros(height(T), 1);
    [zeroHeavy, ~, zeroModerate] = fragility_yamaguchi(zero_pgv, lam_h, z_h, lam_m, z_m);
    [zeroDeaths, zeroInjuries] = cell_losses(T, U, occ, indoor, rates, coll, zeroHeavy, zeroModerate);
    maxZeroLoss = max(abs([zeroDeaths; zeroInjuries]));
    C = add_check(C, 'D00', 'Zero PGV yields zero deaths and injuries in every cell', ...
        maxZeroLoss, 0, 0, passfail(maxZeroLoss, 0, 0));
    R = scenario_distance(sc, T);
    [pgv, ~] = gm_bssa14_pgv(R(act), Mw, vs30, coeff);
    % duration sensitivity
    alpha = 0;
    if isfield(sc, 'alpha'), alpha = sc.alpha; end
    Tref = cfg.duration.reference_s;
    Td = sc.duration_s;
    pgv_eff = pgv .* (Td / Tref).^alpha;

    [pH, ~, pMod, pBelow] = fragility_yamaguchi(pgv_eff, lam_h, z_h, lam_m, z_m);
    % Fill full-length arrays
    p_heavy = zeros(height(T),1); p_mod = zeros(height(T),1); p_below = zeros(height(T),1);
    pgv_all = nan(height(T),1); R_all = nan(height(T),1);
    p_heavy(act) = pH; p_mod(act) = pMod; p_below(act) = pBelow;
    pgv_all(act) = pgv_eff; R_all(act) = R(act);

    % Bounds
    okB = all(p_heavy>=0 & p_heavy<=1) && all(p_mod>=0) && all(p_heavy+p_mod+p_below<=1+1e-9);
    C = add_check(C, ['D01_' char(sc.id)], 'Damage probabilities in [0,1] and exclusive sums <=1', ...
        double(okB), 1, 0, passfail(double(okB),1,0));

    [deaths, inj, units_heavy, units_mod] = cell_losses(T, U, occ, indoor, rates, coll, p_heavy, p_mod);

    % LGU aggregation through overlap table (for population-weighted share)
    % Housing and casualties are already on cells; assign to LGUs by housing-unit share
    % in the cell-LGU housing table (conserves LGU unit totals).
    L = G.pop;
    nL = height(L);
    Ldeaths = zeros(nL,1); Linj = zeros(nL,1); Lheavy = zeros(nL,1); Lmod = zeros(nL,1);
    Lunits = zeros(nL,1); Lpop = L.total_population;
    % Split cell deaths to LGUs by housing-unit share.
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

    Tc = T(:, {'cell_id','row','col','x_center_m','y_center_m','is_active','dominant_lgu_pcode','population_2020'});
    Tc.R_km = R_all;
    Tc.pgv_cm_s = pgv_all;
    Tc.p_heavy = p_heavy;
    Tc.p_moderate = p_mod;
    Tc.p_slight_or_below = p_below;
    Tc.expected_heavily_damaged_units = units_heavy;
    Tc.expected_deaths = deaths;
    Tc.expected_injuries = inj;

    totD = sum(Ldeaths); totI = sum(Linj); totH = sum(Lheavy); totU = sum(Lunits);
    fprintf('    units=%.0f  heavy=%.1f  deaths=%.1f  injuries=%.1f\n', totU, totH, totD, totI);
    % Conservation: LGU deaths sum equals cell deaths
    C = add_check(C, ['D02_' char(sc.id)], 'LGU deaths sum equals cell deaths', ...
        abs(totD - sum(deaths)), 0, 0.5, passfail(abs(totD-sum(deaths)), 0, 0.5));
    C = add_check(C, ['D03_' char(sc.id)], 'Deaths and injuries non-negative and finite', ...
        double(all(Ldeaths>=0) && all(Linj>=0) && all(isfinite(Ldeaths)) && all(isfinite(Linj))), 1, 0, ...
        passfail(double(all(Ldeaths>=0)&&all(Linj>=0)&&all(isfinite(Ldeaths)) && all(isfinite(Linj))),1,0));
    populationTotal = sum(G.pop.total_population);
    d04ok = totD >= 0 && totD < populationTotal;
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
    C(end).tolerance = populationTotal;
    % Pateros present
    hasPat = any(string(Lg.lgu_name) == "Pateros" | string(Lg.adm3_pcode) == "PH1307606");
    C = add_check(C, ['D05_' char(sc.id)], 'Pateros in LGU casualty table', ...
        double(hasPat), 1, 0, passfail(double(hasPat),1,0));

    result.id = char(sc.id);
    result.role = char(sc.role);
    result.Lg = Lg;
    result.Tc = Tc;
    result.totD = totD;
    result.totI = totI;
    result.totH = totH;
    result.totU = totU;
    result.alpha = alpha;
    result.duration_s = Td;
    result.pgv = pgv_all;
    result.p_heavy = p_heavy;
    result.scenario = sc;
    result.duration_multiplier = (sc.duration_s / cfg.duration.reference_s)^sc.alpha;
    C = add_check(C, 'D06', 'LGU injuries sum equals cell injuries', ...
        abs(sum(Linj)-sum(inj)), 0, 1e-8, passfail(abs(sum(Linj)-sum(inj)),0,1e-8));
    result.checks = C;
end

function R = scenario_distance(sc, T)
    switch string(sc.distance_model)
        case "finite_rupture"
            if strcmp(sc.epicenter,'baseline'), R=T.rjb_s1_km;
            elseif strcmp(sc.epicenter,'alternative'), R=T.rjb_s3_km;
            else, error('Unknown epicenter'); end
        case "point_source_illustrative"
            if strcmp(sc.epicenter,'baseline'), R=T.dist_epi_baseline_km;
            elseif strcmp(sc.epicenter,'alternative'), R=T.dist_epi_alt_km;
            else, error('Unknown epicenter'); end
        otherwise, error('Unknown distance model');
    end
    R(~T.is_active)=NaN;
end

function validate_loss_joins(G, occ, rates, coll)
    assert(numel(unique(string(G.pop.adm3_pcode)))==height(G.pop), 'Duplicate LGU key');
    assert(all(ismember(string(G.units.adm3_pcode), string(G.pop.adm3_pcode))), 'Unknown exposure LGU');
    assert(all(G.units.cell_id>=1 & G.units.cell_id<=height(G.cells)), 'Invalid cell key');
    assert(all(G.cells.is_active(G.units.cell_id)), 'Housing in inactive cell');
    for p=unique(string(G.units.adm3_pcode))'
        m=string(occ.adm3_pcode)==p;
        assert(nnz(m)==1 && isfinite(occ.occ_per_unit(m)) && occ.occ_per_unit(m)>0, 'Invalid occupancy join');
    end
    for sbt=unique(G.units.hazus_sbt)'
        hazus_rates_for(sbt,rates,coll);
    end
end

function [deaths, injuries, units_heavy, units_mod] = cell_losses(T, U, occ, indoor, rates, coll, p_heavy, p_mod)
    deaths = zeros(height(T), 1);
    injuries = zeros(height(T), 1);
    units_heavy = zeros(height(T), 1);
    units_mod = zeros(height(T), 1);

    % The fragility curves distinguish moderate-only and heavy damage.
    % The combined below-moderate state contributes zero modeled casualties.
    classes = unique(U.hazus_sbt);
    for ci = 1:numel(classes)
        sbt = classes(ci);
        [fM, fCN, fCC, cRate] = hazus_rates_for(sbt, rates, coll);
        Uc = U(U.hazus_sbt == sbt, :);
        for r = 1:height(Uc)
            cid = Uc.cell_id(r);
            if cid < 1 || cid > height(T) || ~T.is_active(cid), continue; end
            pcode = string(Uc.adm3_pcode(r));
            ou = occ.occ_per_unit(string(occ.adm3_pcode) == pcode);
            assert(numel(ou)==1 && isfinite(ou) && ou>0, 'Missing or duplicate occupancy join');
            units = Uc.occupied_housing_units(r);
            occupants = units * ou(1) * indoor;
            moderate = p_mod(cid);
            heavy = p_heavy(cid);
            collapse = heavy * cRate;
            no_collapse = heavy * (1 - cRate);
            deaths(cid) = deaths(cid) + occupants * (moderate*fM(4) + no_collapse*fCN(4) + collapse*fCC(4));
            injuries(cid) = injuries(cid) + occupants * ...
                (moderate*sum(fM(1:3)) + no_collapse*sum(fCN(1:3)) + collapse*sum(fCC(1:3)));
            units_heavy(cid) = units_heavy(cid) + units * heavy;
            units_mod(cid) = units_mod(cid) + units * moderate;
        end
    end
end

function [fM, fCN, fCC, cRate] = hazus_rates_for(sbt, rates, coll)
    % Returns severity fractions (divide percent by 100) for moderate,
    % complete_no_collapse, complete_collapse. cRate = P(collapse|complete).
    fM  = row4(rates, sbt, "moderate");
    fCN = row4(rates, sbt, "complete_no_collapse");
    fCC = row4(rates, sbt, "complete_collapse");
    m = coll.hazus_sbt == sbt;
    assert(nnz(m)==1, 'Missing or duplicate collapse rate');
    cRate = coll.collapse_given_complete(m);
    assert(isfinite(cRate) && cRate>=0 && cRate<=1, 'Invalid collapse rate');
end

function f = row4(rates, sbt, state)
    m = rates.hazus_sbt == sbt & rates.damage_state == state;
    if nnz(m) ~= 1
        error('Missing Hazus rate for %s %s', sbt, state);
    end
    r = rates(find(m,1), :);
    f = [r.severity1_pct, r.severity2_pct, r.severity3_pct, r.severity4_pct] / 100;
    assert(all(isfinite(f) & f>=0 & f<=1), 'Invalid casualty rates');
end

