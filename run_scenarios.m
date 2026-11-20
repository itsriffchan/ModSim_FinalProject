function [results, outputRoot, checks] = run_scenarios(outputRoot)
%RUN_SCENARIOS A/B duration and B/C location comparisons in a fresh sandbox.
    if nargin<1, outputRoot=''; end
    repo=fileparts(mfilename('fullpath')); oldpath=path;
    cleanup=onCleanup(@() path(oldpath)); %#ok<NASGU>
    addpath(fullfile(repo,'src'));
    cfg=load_modsim_config(repo);
    outputRoot=create_run_root(repo,outputRoot);
    [results,checks]=orchestrate_scenarios(cfg,outputRoot);
    write_checks_csv(checks,fullfile(outputRoot,'checks.csv'));
    assert_all_passed(checks);
end
