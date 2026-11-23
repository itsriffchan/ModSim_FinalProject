% Open the project folder in MATLAB, then click Run to simulate one scenario.
% A = Pasig 20 s; B = Pasig 40 s; C = Muntinlupa 40 s.
scenarioId = 'A'; % Change to 'B' or 'C' to select another scenario.

addpath(fullfile(pwd,'tools'));

simulationTimer = tic;
[result, artifacts] = run_scenario(scenarioId, [], 'viewer');
fprintf('\nScenario %s completed in %.1f seconds.\n', scenarioId, toc(simulationTimer));
fprintf('Results folder: %s\n', artifacts.directory);
fprintf('Animation viewer: %s\n', fullfile(artifacts.directory, [scenarioId '_viewer.html']));
fprintf('Scenario totals:\n');
fprintf('  Heavy damaged housing units: %.1f\n', result.totH);
fprintf('  Expected deaths: %.1f\n', result.totD);
fprintf('  Expected nonfatal injuries: %.1f\n', result.totI);

reportRoot = fullfile(pwd,'results','report_figures');
export_report_scenario_figures([], reportRoot);
fprintf('\nMATLAB report charts:\n');
fprintf('  A/B/C totals: %s\n', fullfile(reportRoot,'abc_totals.png'));
fprintf('  Combined damage probability: %s\n', fullfile(reportRoot,'abc_damage_probability.png'));
fprintf('  Scenario A summary: %s\n', fullfile(reportRoot,'scenario_A_results.png'));
fprintf('  Scenario B summary: %s\n', fullfile(reportRoot,'scenario_B_results.png'));
fprintf('  Scenario C summary: %s\n', fullfile(reportRoot,'scenario_C_results.png'));
