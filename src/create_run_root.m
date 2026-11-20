function outputRoot = create_run_root(repoRoot, outputRoot)
%CREATE_RUN_ROOT Refuse nonempty destinations before any artifact is written.
    if nargin<2 || strlength(string(outputRoot))==0
        parent=fullfile(repoRoot,'results','runs');
        if ~exist(parent,'dir'), mkdir(parent); end
        [~,suffix]=fileparts(tempname(parent));
        outputRoot=fullfile(parent,[datestr(now,'yyyymmddTHHMMSS') '_' suffix]);
    end
    outputRoot=char(outputRoot);
    assert(~isfile(outputRoot), 'Output destination is a file');
    if exist(outputRoot,'dir')
        items=dir(outputRoot);
        assert(all(ismember({items.name},{'.','..'})), 'Output destination must be empty');
    else
        mkdir(outputRoot);
    end
    [ok,info]=fileattrib(outputRoot); assert(ok); outputRoot=info.Name;
end
