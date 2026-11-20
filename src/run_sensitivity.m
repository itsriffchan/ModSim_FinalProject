function checks = run_sensitivity(cfg,primary,G,outputRoot,provenance)
%RUN_SENSITIVITY One-parameter numerical experiments; never render videos.
    outd=fullfile(outputRoot,'sensitivity'); mkdir(outd);
    originalCfg=cfg; originalG=G; originalPrimary=primary;
    checks=init_checks(); cases={};
    alphas=cfg.duration.alpha_sensitivity(:)';
    sites=cfg.ground_motion.vs30_sensitivity_mps(:)';
    record('ALPHA_COVERAGE','Configured alpha coverage is exactly 0, 0.15, 0.25, 0.40', ...
        isequal(sort(alphas),[0 0.15 0.25 0.40]));
    record('VS30_COVERAGE','Configured Vs30 coverage is exactly 250, 360, 760 m/s', ...
        isequal(sort(sites),[250 360 760]));
    record('PRIMARY_BASELINE','Primary defaults retained for sensitivity anchors', ...
        cfg.ground_motion.vs30_mps==360 && cfg.duration.alpha==0.25 && cfg.duration.reference_s==20);
    for parent={'B','C'}
        for alpha=alphas
            local=cfg; local.duration.alpha=alpha; local.ground_motion.vs30_mps=360;
            sc=resolve_scenario(local,parent{1});
            cases=append_case(cases,'duration',parent{1}, ...
                sprintf('duration_%s_alpha_%s',parent{1},tag(alpha)),local,sc);
        end
    end
    for vs30=sites
        local=cfg; local.ground_motion.vs30_mps=vs30;
        cases=append_case(cases,'vs30','A',sprintf('vs30_A_%s',tag(vs30)),local,resolve_scenario(local,'A'));
    end
    % Internal same-location 20 s alternative control, never a primary case.
    local=cfg; local.duration.alpha=0; local.ground_motion.vs30_mps=360;
    sc=resolve_scenario(local,'C'); sc.duration_s=20;
    cases=append_case(cases,'control','C','control_C_20s',local,sc);

    calculated=cell(size(cases)); rows=cell(size(cases));
    for k=1:numel(cases)
        c=cases{k}; r=calculate_scenario(c.cfg,c.sc,G);
        r.checks=verify_scenario_numerics(c.cfg,r,G);
        calculated{k}=r;
        checks=[checks scoped_checks(r.checks,c.sc.id)]; %#ok<AGROW>
        a=r.Tc.is_active;
        rows{k}=table(string(c.study),string(c.sc.id),string(c.parent),string(c.sc.role), ...
            string(c.sc.epicenter),r.duration_s,r.alpha,c.cfg.ground_motion.vs30_mps, ...
            r.duration_multiplier,mean(r.Tc.pgv_cm_s(a)),mean(r.Tc.p_heavy(a)), ...
            r.totU,r.totH,sum(r.Lg.expected_moderately_damaged_units),r.totD,r.totI, ...
            'VariableNames',{'study','experiment','parent_scenario','role','epicenter', ...
            'duration_s','alpha','vs30_mps','duration_multiplier','mean_pgv_cm_s','mean_p_heavy', ...
            'occupied_housing_units','expected_heavily_damaged_units', ...
            'expected_moderately_damaged_units','expected_deaths','expected_injuries'});
    end
    summary=vertcat(rows{:});
    record('EXPERIMENT_COUNT','Eight duration, three Vs30 and one internal control', ...
        height(summary)==12 && nnz(summary.study=="duration")==8 && ...
        nnz(summary.study=="vs30")==3 && nnz(summary.study=="control")==1 && ...
        numel(unique(summary.experiment))==12);
    for k=1:numel(cases)
        c=cases{k}; r=calculated{k}; base=primary(strcmp({primary.id},c.parent));
        % Verify one-parameter changes against the corresponding primary.
        expectedCfg=cfg; expectedSc=base.scenario;
        if strcmp(c.study,'duration')
            expectedCfg.duration.alpha=c.sc.alpha; expectedSc.alpha=c.sc.alpha;
        elseif strcmp(c.study,'vs30')
            expectedCfg.ground_motion.vs30_mps=c.cfg.ground_motion.vs30_mps;
        else
            expectedCfg.duration.alpha=0; expectedSc.alpha=0; expectedSc.duration_s=20;
        end
        expectedSc.id=c.sc.id; expectedSc.role=c.sc.role;
        record([c.sc.id '_SETTINGS'],'Only intended experiment settings differ', ...
            isequaln(c.cfg,expectedCfg) && isequaln(c.sc,expectedSc));
        if strcmp(c.study,'duration') && c.sc.alpha==0
            control=primary(1);
            if strcmp(c.parent,'C'), control=calculated{end}; end
            record([c.sc.id '_ZERO_CONTROL'],'Alpha zero equals same-location 20 s scientific arrays', ...
                same_science(r,control));
        elseif strcmp(c.study,'duration') && c.sc.alpha==0.25
            record([c.sc.id '_PRIMARY'],'Alpha 0.25 reproduces primary B/C',same_science(r,base));
        elseif strcmp(c.study,'vs30') && c.cfg.ground_motion.vs30_mps==360
            record([c.sc.id '_PRIMARY'],'Vs30 360 reproduces primary A',same_science(r,base));
        end
    end
    for k=[numel(cases):-1:1 1]
        c=cases{k}; repeated=calculate_scenario(c.cfg,c.sc,G);
        record(sprintf('REPEAT_%d_%d',k,numel(checks)), ...
            'Reversed/repeated engine execution preserves scientific arrays and scenario', ...
            same_science(repeated,calculated{k}) && isequaln(repeated.scenario,calculated{k}.scenario));
    end
    for k=1:numel(primary)
        repeated=calculate_scenario(cfg,resolve_scenario(cfg,primary(k).id),G);
        record(['PRIMARY_' primary(k).id],'Primary result preserved after sensitivity execution', ...
            same_science(repeated,primary(k)) && isequaln(repeated.scenario,primary(k).scenario));
    end
    record('INPUTS_UNCHANGED','Primary settings, results and prepared inputs unchanged', ...
        isequaln(cfg,originalCfg) && isequaln(primary,originalPrimary) && isequaln(G,originalG));
    for k=1:numel(cases)
        save_case(cases{k},calculated{k},outd,provenance);
    end
    writetable(summary(summary.study=="duration",:),fullfile(outd,'duration_alpha_sensitivity.csv'));
    writetable(summary(summary.study=="vs30",:),fullfile(outd,'vs30_sensitivity_A.csv'));
    writetable(summary(summary.study=="control",:),fullfile(outd,'internal_controls.csv'));
    record('NO_VIDEOS','Numerical sensitivity creates no video exports', ...
        isempty(dir(fullfile(outd,'**','*.mp4'))) && isempty(dir(fullfile(outd,'**','*.avi'))));
    write_checks_csv(checks,fullfile(outd,'checks.csv'));

    function record(id,description,ok)
        checks=add_check(checks,['SENS_' id],description,double(ok),1,0,passfail(double(ok),1,0));
    end
end

function cases = append_case(cases,study,parent,id,local,sc)
    sc.id=id; sc.role='sensitivity';
    if strcmp(study,'control'), sc.role='internal_control'; end
    cases{end+1}=struct('study',study,'parent',parent,'cfg',local,'sc',sc);
end

function save_case(c,result,outd,provenance)
    cfg=c.cfg; sc=c.sc; experiment=rmfield(c,{'cfg','sc'}); %#ok<NASGU>
    caseDir=fullfile(outd,sc.id); mkdir(caseDir);
    caseProvenance=provenance; caseProvenance.config=cfg;
    caseProvenance.resolved_scenario=sc;
    writetable(result.Tc,fullfile(caseDir,'cells.csv'));
    writetable(result.Lg,fullfile(caseDir,'lgu.csv'));
    write_checks_csv(result.checks,fullfile(caseDir,'checks.csv'));
    save(fullfile(caseDir,'state.mat'),'cfg','sc','experiment','result','caseProvenance','-v7.3');
end

function value = tag(number)
    value=strrep(sprintf('%g',number),'.','p');
end

function tf = same_science(a,b)
    tf=isequaln(a.Tc,b.Tc) && isequaln(a.Lg,b.Lg) && ...
        isequaln([a.totU a.totH a.totD a.totI],[b.totU b.totH b.totD b.totI]);
end

function checks = scoped_checks(checks,id)
    for k=1:numel(checks), checks(k).check_id=['SENS_' id '_' checks(k).check_id]; end
end
