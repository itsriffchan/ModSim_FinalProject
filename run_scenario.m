function [result, artifacts] = run_scenario(id, outputRoot, presentationMode)
%RUN_SCENARIO Run A, B, or C in a fresh isolated destination.
    if nargin<2, outputRoot=''; end
    if nargin<3, presentationMode=''; end
    repo=fileparts(mfilename('fullpath')); oldpath=path;
    cleanup=onCleanup(@() path(oldpath)); %#ok<NASGU>
    addpath(fullfile(repo,'src'));
    graphicsCleanup=scoped_graphics_defaults(); %#ok<NASGU>
    cfg=presentation_mode(load_modsim_config(repo),presentationMode); sc=resolve_scenario(cfg,id);
    outputRoot=create_run_root(repo,outputRoot);
    prepared=fullfile(outputRoot,'prepared');
    [checks,G]=run_ncr_grid(cfg,init_checks(),prepared);
    write_checks_csv(checks,fullfile(prepared,'checks.csv'));
    provenance=run_provenance(cfg);
    save(fullfile(prepared,'prepared.mat'),'cfg','G','provenance','-v7.3');
    [result,artifacts]=save_scenario(cfg,sc,G,outputRoot,provenance);
    assert_all_passed([checks result.checks]);
end
