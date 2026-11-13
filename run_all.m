function run_all()
%RUN_ALL  Steps 5-17 entry point. Run from the repository root:
%   matlab -batch "run_all"
% Uses only base MATLAB (R2020a+). No Mapping Toolbox is required.

    thisDir = fileparts(mfilename('fullpath'));
    if isempty(thisDir)
        thisDir = pwd;
    end
    cd(thisDir);
    addpath(fullfile(thisDir, 'src'));
    addpath(fullfile(thisDir, 'tests'));
    addpath(thisDir);
    set(0, 'DefaultFigureVisible', 'off');

    fprintf('============================================================\n');
    fprintf('ModSim NCR grid casualty model  —  run_all\n');
    fprintf('MATLAB %s\n', version);
    fprintf('repo: %s\n', thisDir);
    fprintf('============================================================\n');

    % Report installed toolboxes (do not require any beyond base MATLAB).
    try
        v = ver;
        fprintf('Installed products:\n');
        for i = 1:numel(v)
            fprintf('  - %s %s\n', v(i).Name, v(i).Version);
        end
    catch ME
        fprintf('Could not list toolboxes (%s).\n', ME.message);
    end

    cfg = load_modsim_config(thisDir);
    C = init_checks();

    fprintf('\n--- Unit tests ---\n');
    C = run_unit_tests(cfg, C);

    fprintf('\n--- Steps 5-8: Kobe tables and descriptive rates ---\n');
    C = run_kobe(cfg, C);
    write_checks_csv(C, fullfile(thisDir, 'results', 'kobe', 'kobe_checks.csv'));

    fprintf('\n--- Steps 9-10: NCR grid ---\n');
    [C, G] = run_ncr_grid(cfg, C);
    write_checks_csv(C, fullfile(thisDir, 'results', 'ncr_grid', 'ncr_grid_checks.csv'));

    fprintf('\n--- Steps 11-15: ground motion, damage, casualties ---\n');
    C = run_scenarios(cfg, G, C);
    write_checks_csv(C, fullfile(thisDir, 'results', 'scenarios', 'scenario_checks.csv'));

    if ~exist(fullfile(thisDir, 'results'), 'dir')
        mkdir(fullfile(thisDir, 'results'));
    end
    write_checks_csv(C, fullfile(thisDir, 'results', 'all_checks.csv'));

    assert_all_passed(C);
    fprintf('\nrun_all complete: all required checks passed.\n');
end
