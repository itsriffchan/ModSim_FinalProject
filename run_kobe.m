function C = run_kobe(cfg, C)
%RUN_KOBE  Steps 5-8: verify cleaned Kobe tables, join, descriptive rates.

    root = cfg.repoRoot;
    proc = fullfile(root, 'data', 'processed');
    outd = fullfile(root, 'results', 'kobe');
    if ~exist(outd, 'dir'), mkdir(outd); end

    opts = detectImportOptions(fullfile(proc, 'kobe_ward_population.csv'), 'Encoding', 'UTF-8');
    pop = readtable(fullfile(proc, 'kobe_ward_population.csv'), opts);
    opts2 = detectImportOptions(fullfile(proc, 'kobe_ward_outcomes.csv'), 'Encoding', 'UTF-8');
    outc = readtable(fullfile(proc, 'kobe_ward_outcomes.csv'), opts2);

    nPop = height(pop);
    nOut = height(outc);
    C = add_check(C, 'K01', 'Nine population ward records', nPop, 9, 0, passfail(nPop, 9, 0));
    C = add_check(C, 'K02', 'Nine outcome ward records (no total rows)', nOut, 9, 0, passfail(nOut, 9, 0));

    % unique keys
    uPop = numel(unique(pop.ward));
    uOut = numel(unique(outc.ward));
    C = add_check(C, 'K03', 'Unique population ward keys', uPop, 9, 0, passfail(uPop, 9, 0));
    C = add_check(C, 'K04', 'Unique outcome ward keys', uOut, 9, 0, passfail(uOut, 9, 0));

    popSum = sum(pop.population);
    C = add_check(C, 'K05', '1990-10-01 census population (nine wards)', ...
        popSum, cfg.checks.expected_kobe_population, 0, ...
        passfail(popSum, cfg.checks.expected_kobe_population, 0));

    sexOK = all(pop.male_population + pop.female_population == pop.population);
    C = add_check(C, 'K06', 'Male + female equals total for every ward', ...
        double(sexOK), 1, 0, passfail(double(sexOK), 1, 0));

    % No aggregate-row names
    names = lower(string(outc.ward));
    hasTotal = any(contains(names, 'total'));
    C = add_check(C, 'K07', 'No Total rows in outcomes', double(~hasTotal), 1, 0, ...
        passfail(double(~hasTotal), 1, 0));

    d = sum(outc.deaths);
    inj = sum(outc.injuries);
    fd = sum(outc.full_damage_buildings);
    pd = sum(outc.partial_damage_buildings);
    C = add_check(C, 'K08', 'Deaths sum (City of Kobe, reporting date 2005-12-22)', ...
        d, cfg.checks.expected_kobe_deaths, 0, passfail(d, cfg.checks.expected_kobe_deaths, 0));
    C = add_check(C, 'K09', 'Injuries sum (reporting date 2000-01-11)', ...
        inj, cfg.checks.expected_kobe_injuries, 0, passfail(inj, cfg.checks.expected_kobe_injuries, 0));
    C = add_check(C, 'K10', 'Full-damage buildings sum (1995-12-22)', ...
        fd, cfg.checks.expected_kobe_full_damage, 0, passfail(fd, cfg.checks.expected_kobe_full_damage, 0));
    C = add_check(C, 'K11', 'Partial-damage buildings sum (1995-12-22)', ...
        pd, cfg.checks.expected_kobe_partial_damage, 0, passfail(pd, cfg.checks.expected_kobe_partial_damage, 0));

    % Join on English ward name
    J = innerjoin(pop, outc, 'Keys', 'ward');
    C = add_check(C, 'K12', 'Inner join yields nine matched wards', height(J), 9, 0, ...
        passfail(height(J), 9, 0));

    J.deaths_per_1000_1990_residents = J.deaths ./ J.population * 1000;
    J.injuries_per_1000_1990_residents = J.injuries ./ J.population * 1000;
    J.full_damage_per_1000_1990_residents = J.full_damage_buildings ./ J.population * 1000;
    J.partial_damage_per_1000_1990_residents = J.partial_damage_buildings ./ J.population * 1000;
    J.deaths_per_full_damage_building = J.deaths ./ J.full_damage_buildings;

    writetable(J, fullfile(outd, 'kobe_ward_joined_rates.csv'));

    % City-wide descriptive rates (1990 census denominator, not 1995 present population)
    rate_d = d / popSum * 1000;
    rate_i = inj / popSum * 1000;
    % Independent check: 4571/1477410*1000 = 3.093928...
    C = add_check(C, 'K13', 'City deaths per 1,000 1990 residents', ...
        rate_d, 4571/1477410*1000, 1e-10, passfail(rate_d, 4571/1477410*1000, 1e-10));
    C = add_check(C, 'K14', 'City injuries per 1,000 1990 residents', ...
        rate_i, 14678/1477410*1000, 1e-10, passfail(rate_i, 14678/1477410*1000, 1e-10));

    city = table("Kobe City (nine wards)", popSum, d, inj, fd, pd, rate_d, rate_i, ...
        'VariableNames', {'area', 'population_1990_10_01', 'deaths', 'injuries', ...
        'full_damage_buildings', 'partial_damage_buildings', ...
        'deaths_per_1000_1990_residents', 'injuries_per_1000_1990_residents'});
    writetable(city, fullfile(outd, 'kobe_city_descriptive_rates.csv'));

    % Chart
    fig = figure('Visible', 'off', 'Color', 'w', 'Position', [0 0 1500 700]);
    subplot(1,2,1);
    bar(J.deaths_per_1000_1990_residents);
    set(gca, 'XTickLabel', J.ward, 'XTickLabelRotation', 45, 'FontSize', 11);
    ylabel('Reported deaths per 1,000 1990-census residents');
    title({'Kobe ward death rates', '(1990-10-01 denominator; not 1995 present population)'}, 'FontSize', 13);
    grid on;
    subplot(1,2,2);
    bar(J.injuries_per_1000_1990_residents);
    set(gca, 'XTickLabel', J.ward, 'XTickLabelRotation', 45, 'FontSize', 11);
    ylabel('Reported injuries per 1,000 1990-census residents');
    title({'Kobe ward injury rates', 'Different reporting dates from deaths'}, 'FontSize', 13);
    grid on;
    export_fig(fig, fullfile(outd, 'kobe_ward_rates'));
    close(fig);

    % Fragility coefficients present and RC heavy matches starter
    F = readtable(fullfile(proc, 'fragility_parameters.csv'), 'TextType', 'string');
    rc = F(F.structure_type == "RC" & F.construction_period == "average" & F.damage_threshold == "heavy", :);
    C = add_check(C, 'K15', 'RC average heavy lambda is 5.71', rc.lambda, 5.71, 0, ...
        passfail(rc.lambda, 5.71, 0));
    C = add_check(C, 'K16', 'RC average heavy zeta is 0.849', rc.zeta, 0.849, 0, ...
        passfail(rc.zeta, 0.849, 0));
    [ph, ~, ~, ~] = fragility_yamaguchi(100, 5.71, 0.849, 5.11, 0.798);
    C = add_check(C, 'K17', 'P_heavy(PGV=100 cm/s) = 0.0965726 (implementation check)', ...
        ph, cfg.checks.expected_p_heavy_pgv100, cfg.checks.p_heavy_pgv100_tol, ...
        passfail(ph, cfg.checks.expected_p_heavy_pgv100, cfg.checks.p_heavy_pgv100_tol));
    [p0, ~, ~, ~] = fragility_yamaguchi(0, 5.71, 0.849, 5.11, 0.798);
    C = add_check(C, 'K18', 'P_heavy(PGV=0) = 0', p0, 0, 0, passfail(p0, 0, 0));
    pMed = fragility_yamaguchi(exp(5.71), 5.71, 0.849, 5.11, 0.798);
    C = add_check(C, 'K19', 'P_heavy at exp(lambda) = 0.5', pMed, 0.5, 1e-12, passfail(pMed, 0.5, 1e-12));

    fprintf('Kobe descriptive rates: %.6f deaths and %.6f injuries per 1,000 1990 residents.\n', rate_d, rate_i);
    fprintf('These are event summaries against an earlier census, not NCR casualty coefficients.\n');
end
