function outputRoot = run_all(outputRoot)
%RUN_ALL Unit tests, Kobe processing, and isolated primary A/B/C simulations.
    if nargin<1, outputRoot=''; end
    repo=fileparts(mfilename('fullpath')); oldpath=path;
    cleanup=onCleanup(@() path(oldpath)); %#ok<NASGU>
    addpath(repo,fullfile(repo,'src'),fullfile(repo,'tests'));
    cfg=load_modsim_config(repo);
    outputRoot=create_run_root(repo,outputRoot);
    checks=run_unit_tests(cfg,init_checks());
    checks=run_kobe(cfg,checks,fullfile(outputRoot,'kobe'));
    [~,scenarioChecks]=orchestrate_scenarios(cfg,outputRoot);
    checks=[checks scenarioChecks];
    write_checks_csv(checks,fullfile(outputRoot,'all_checks.csv'));
    assert_all_passed(checks);
    fprintf('Completed sandbox: %s\n',outputRoot);
end
