% Open the project folder in MATLAB, then click Run to simulate one scenario.
% A = Pasig 20 s; B = Pasig 40 s; C = Muntinlupa 40 s.
scenarioId = 'A'; % Change to 'B' or 'C' to select another scenario.

addpath(pwd, fullfile(pwd, 'src'), fullfile(pwd, 'tests'));

simulationTimer = tic;
[result, artifacts] = run_scenario(scenarioId, [], 'viewer');
fprintf('\nScenario %s completed in %.1f seconds.\n', scenarioId, toc(simulationTimer));
fprintf('Results folder: %s\n', artifacts.directory);
fprintf('Animation viewer: %s\n', fullfile(artifacts.directory, [scenarioId '_viewer.html']));
fprintf('Scenario totals:\n');
fprintf('  Heavy-damaged housing units: %.1f\n', result.totH);
fprintf('  Expected deaths: %.1f\n', result.totD);
fprintf('  Expected nonfatal injuries: %.1f\n', result.totI);
