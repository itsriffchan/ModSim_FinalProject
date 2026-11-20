function outputRoot = run_acceptance(outputRoot)
%RUN_ACCEPTANCE Automated acceptance evidence; human video review stays separate.
% This is intentionally slower than unit tests. Uses fresh nested sandboxes.
    if nargin<1, outputRoot=''; end
    repo=fileparts(mfilename('fullpath')); oldpath=path;
    cleanup=onCleanup(@() path(oldpath)); %#ok<NASGU>
    addpath(fullfile(repo,'src'));
    outputRoot=create_run_root(repo,outputRoot);
    batchRoot=run_all(fullfile(outputRoot,'batch'));
    checks=check_sensitivity(batchRoot);
    checks=check_exports(batchRoot,checks);
    ids={'C','A','B','A'};
    before=snapshot(batchRoot);
    sensitivityBefore=snapshot(fullfile(batchRoot,'sensitivity'));
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
        unchanged=isequal(sensitivityBefore,snapshot(fullfile(batchRoot,'sensitivity')));
        checks=add_check(checks,sprintf('SENS_ARTIFACTS_%d',k), ...
            'Independent public run preserves every sensitivity artifact byte', ...
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
    % A reviewer fills this after inspecting all four actual videos and frames.
    video=repelem(["A";"B";"C";"ABC_comparison"],4);
    phase=repmat(["first";"onset";"completion";"final"],4,1);
    review=table(video,phase,repmat("PENDING",16,1),strings(16,1),strings(16,1), ...
        strings(16,1),strings(16,1),'VariableNames', ...
        {'video','phase','status','reviewer','reviewed_utc','evidence_path','notes'});
    writetable(review,fullfile(outputRoot,'visual_review.csv'));
    assert_all_passed(checks);
    fprintf('Automated checks passed. Delivery remains pending recorded human review in visual_review.csv.\n');
end

function checks=check_sensitivity(root)
    folder=fullfile(root,'sensitivity'); checks=init_checks();
    ledger=readtable(fullfile(folder,'checks.csv'),'TextType','string');
    required=["SENS_ALPHA_COVERAGE" "SENS_VS30_COVERAGE" "SENS_PRIMARY_BASELINE" ...
        "SENS_EXPERIMENT_COUNT" "SENS_duration_B_alpha_0_ZERO_CONTROL" ...
        "SENS_duration_C_alpha_0_ZERO_CONTROL" "SENS_duration_B_alpha_0p25_PRIMARY" ...
        "SENS_duration_C_alpha_0p25_PRIMARY" "SENS_vs30_A_360_PRIMARY" ...
        "SENS_PRIMARY_A" "SENS_PRIMARY_B" "SENS_PRIMARY_C" "SENS_INPUTS_UNCHANGED" "SENS_NO_VIDEOS"];
    ok=all(ledger.status=="PASS") && all(ismember(required,ledger.check_id)) && ...
        nnz(startsWith(ledger.check_id,"SENS_REPEAT_"))==13;
    checks=add_check(checks,'SENS_LEDGER','Sensitivity coverage, anchors, repeatability and preservation pass', ...
        double(ok),1,0,passfail(double(ok),1,0));
    d=readtable(fullfile(folder,'duration_alpha_sensitivity.csv'),'TextType','string');
    v=readtable(fullfile(folder,'vs30_sensitivity_A.csv'),'TextType','string');
    c=readtable(fullfile(folder,'internal_controls.csv'),'TextType','string');
    rows=[d;v;c];
    ok=height(d)==8 && height(v)==3 && height(c)==1 && numel(unique(rows.experiment))==12;
    checks=add_check(checks,'SENS_SUMMARIES','All sensitivity summaries and internal control present', ...
        double(ok),1,0,passfail(double(ok),1,0));
    for k=1:height(rows)
        folderCase=fullfile(folder,rows.experiment(k));
        state=load(fullfile(folderCase,'state.mat'));
        caseLedger=readtable(fullfile(folderCase,'checks.csv'),'TextType','string');
        ok=isfile(fullfile(folderCase,'cells.csv')) && isfile(fullfile(folderCase,'lgu.csv')) && ...
            all(caseLedger.status=="PASS") && ~isempty(state.caseProvenance.matlab_version) && ...
            ~isempty(state.caseProvenance.computer) && ~isempty(state.caseProvenance.products) && ...
            ~isempty(state.caseProvenance.fingerprints) && ...
            isequaln(state.cfg,state.caseProvenance.config) && ...
            isequaln(state.sc,state.result.scenario) && ...
            state.sc.alpha==rows.alpha(k) && state.sc.duration_s==rows.duration_s(k) && ...
            state.cfg.ground_motion.vs30_mps==rows.vs30_mps(k) && ...
            abs(state.result.totD-rows.expected_deaths(k))<1e-7 && ...
            abs(state.result.totI-rows.expected_injuries(k))<1e-7 && ...
            abs(state.result.totH-rows.expected_heavily_damaged_units(k))<1e-7;
        checks=add_check(checks,sprintf('SENS_STATE_%d',k), ...
            'Experiment state, settings, provenance, runtime, checks and tables present', ...
            double(ok),1,0,passfail(double(ok),1,0));
    end
end

function checks=check_exports(root,checks)
    prepared=load(fullfile(root,'prepared','prepared.mat'),'provenance'); p=prepared.provenance;
    ok=~isempty(p.matlab_version) && ~isempty(p.computer) && ~isempty(p.products) && ~isempty(p.fingerprints);
    checks=add_check(checks,'RUNTIME','Actual MATLAB runtime, products and input/code fingerprints recorded', ...
        double(ok),1,0,passfail(double(ok),1,0));
    folders={'A','B','C','comparison'};
    for k=1:4
        folder=fullfile(root,folders{k});
        saved=load(fullfile(folder,'video_export.mat'),'report'); r=saved.report;
        ok=r.verified && strcmp(r.status,'exported_and_decoded') && isfile(r.file) && ...
            r.frame_count>0 && r.decoded_frame_count==r.frame_count && ...
            isfile(fullfile(folder,'final_frame.png')) && ~isempty(dir(fullfile(folder,'review_frame_*.png')));
        checks=add_check(checks,sprintf('EXPORT_%d',k),'Production video encoded, every frame decoded; review frames saved', ...
            double(ok),1,0,passfail(double(ok),1,0));
    end
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
