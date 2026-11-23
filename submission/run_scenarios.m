function [results, outputRoot, checks] = run_scenarios(outputRoot, presentationMode)
%RUN_SCENARIOS Primary A/B/C comparisons plus isolated numerical sensitivities.
    if nargin<1, outputRoot=''; end
    if nargin<2, presentationMode=''; end
    repo=fileparts(mfilename('fullpath')); oldpath=path;
    cleanup=onCleanup(@() path(oldpath)); %#ok<NASGU>
    addpath(fullfile(repo,'src'));
    graphicsCleanup=scoped_graphics_defaults(); %#ok<NASGU>
    cfg=presentation_mode(load_modsim_config(repo),presentationMode);
    outputRoot=create_run_root(repo,outputRoot);
    [results,checks]=orchestrate_scenarios(cfg,outputRoot);
    write_checks_csv(checks,fullfile(outputRoot,'checks.csv'));
    assert_all_passed(checks);
end
