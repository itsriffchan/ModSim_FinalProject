function files = export_scenario_viewer(runRoot)
%EXPORT_SCENARIO_VIEWER Export saved batch/independent run without calculation.
% Accept a run root with prepared/prepared.mat and A/B/C state directories.
    repo=fileparts(mfilename('fullpath')); oldpath=path;
    cleanup=onCleanup(@() path(oldpath)); %#ok<NASGU>
    addpath(fullfile(repo,'src'));
    saved=load(fullfile(runRoot,'prepared','prepared.mat'),'G');
    G=saved.G; ids={'A','B','C'}; results=[]; data={}; files={};
    available=cellfun(@(id)isfile(fullfile(runRoot,id,'state.mat')),ids);
    assert(nnz(available)==1 || nnz(available)==3,'Expected one independent scenario or complete A/B/C batch');
    for k=find(available)
        assert(isfile(fullfile(runRoot,ids{k},'animation_data.mat')),'Missing saved animation data');
    end
    for k=1:3
        folder=fullfile(runRoot,ids{k});
        if ~isfile(fullfile(folder,'state.mat')), continue; end
        state=load(fullfile(folder,'state.mat'),'cfg','result','provenance');
        animation=load(fullfile(folder,'animation_data.mat'),'data');
        cfg=state.cfg; cfg.repoRoot=repo; cfg=presentation_mode(cfg,'viewer');
        r=state.result; d=animation.data;
        report=write_scenario_viewer(cfg,r,G,{d},folder,r.id,state.provenance);
        files{end+1}=report.file; %#ok<AGROW>
        % Results can have different export metadata; use only shared fields.
        r=rmfield(r,intersect(fieldnames(r),{'export'}));
        if isempty(results), results=r; else, results(end+1)=r; end %#ok<AGROW>
        data{end+1}=d; %#ok<AGROW>
    end
    assert(~isempty(results),'No saved primary scenarios found');
    assert(numel(results)==1 || numel(results)==3,'Expected one independent scenario or complete A/B/C batch');
    if numel(results)==3
        folder=fullfile(runRoot,'comparison'); if ~isfolder(folder), mkdir(folder); end
        report=write_scenario_viewer(cfg,results,G,data,folder,'ABC_comparison',state.provenance);
        files{end+1}=report.file;
    end
end
