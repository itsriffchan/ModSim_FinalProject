function outputRoot = run_acceptance(outputRoot)
%RUN_ACCEPTANCE Full exports plus public independent-run isolation comparisons.
% This is intentionally slower than unit tests. Uses fresh nested sandboxes.
    if nargin<1, outputRoot=''; end
    repo=fileparts(mfilename('fullpath')); oldpath=path;
    cleanup=onCleanup(@() path(oldpath)); %#ok<NASGU>
    addpath(fullfile(repo,'src'));
    outputRoot=create_run_root(repo,outputRoot);
    batchRoot=run_all(fullfile(outputRoot,'batch'));
    checks=init_checks(); ids={'C','A','B','A'};
    before=snapshot(batchRoot);
    for k=1:numel(ids)
        id=ids{k};
        [independent,~]=run_scenario(id,fullfile(outputRoot,sprintf('independent_%d_%s',k,id)));
        batch=load(fullfile(batchRoot,id,'state.mat'),'result','cfg');
        ok=isequaln(independent.Tc,batch.result.Tc) && isequaln(independent.Lg,batch.result.Lg) && ...
            isequaln(independent.scenario,batch.result.scenario);
        checks=add_check(checks,sprintf('ISOLATION_%d',k), ...
            'Public independent run equals batch scientific arrays and scenario',double(ok),1,0,passfail(double(ok),1,0));
        unchanged=isequal(before,snapshot(batchRoot));
        checks=add_check(checks,sprintf('ARTIFACTS_%d',k),'Other sandbox bytes unchanged', ...
            double(unchanged),1,0,passfail(double(unchanged),1,0));
    end
    rejected=false;
    try, run_scenario('A',batchRoot); catch ME
        rejected=contains(ME.message,'must be empty');
    end
    checks=add_check(checks,'NONEMPTY','Nonempty destination rejected before writing', ...
        double(rejected && isequal(before,snapshot(batchRoot))),1,0, ...
        passfail(double(rejected && isequal(before,snapshot(batchRoot))),1,0));
    write_checks_csv(checks,fullfile(outputRoot,'acceptance_checks.csv'));
    assert_all_passed(checks);
end

function hashes=snapshot(root)
    files=dir(fullfile(root,'**','*')); hashes=cell(0,2);
    for k=1:numel(files)
        if files(k).isdir, continue; end
        filename=fullfile(files(k).folder,files(k).name);
        fid=fopen(filename,'rb'); assert(fid>=0); cleanup=onCleanup(@() fclose(fid));
        bytes=fread(fid,Inf,'*uint8'); clear cleanup;
        md=java.security.MessageDigest.getInstance('SHA-256'); md.update(typecast(bytes,'int8'));
        hash=lower(reshape(dec2hex(typecast(md.digest(),'uint8'),2)',1,[]));
        hashes(end+1,:)={filename,hash}; %#ok<AGROW>
    end
    hashes=sortrows(hashes,1);
end
