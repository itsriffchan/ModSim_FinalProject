function outputRoot = run_all(outputRoot, presentationMode)
%RUN_ALL Unit tests, Kobe, primary A/B/C and numerical sensitivity studies.
    if nargin<1, outputRoot=''; end
    if nargin<2, presentationMode=''; end
    repo=fileparts(mfilename('fullpath')); oldpath=path;
    cleanup=onCleanup(@() path(oldpath)); %#ok<NASGU>
    addpath(repo,fullfile(repo,'src'),fullfile(repo,'tests'));
    graphicsCleanup=scoped_graphics_defaults(); %#ok<NASGU>
    cfg=presentation_mode(load_modsim_config(repo),presentationMode);
    outputRoot=create_run_root(repo,outputRoot);
    checks=run_unit_tests(cfg,init_checks());
    checks=run_kobe(cfg,checks,fullfile(outputRoot,'kobe'));
    [~,scenarioChecks]=orchestrate_scenarios(cfg,outputRoot);
    checks=[checks scenarioChecks];
    write_checks_csv(checks,fullfile(outputRoot,'all_checks.csv'));
    assert_all_passed(checks);
    fprintf('Completed sandbox: %s\n',outputRoot);
end
