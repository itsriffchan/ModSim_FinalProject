function checks = verify_scenario(cfg,r,G,data)
%VERIFY_SCENARIO Numerical conservation, local timing, stored A/B regression.
    checks=r.checks; T=r.Tc; active=T.is_active;
    record('POP','Population conserved',abs(sum(T.population_2020)-cfg.checks.expected_ncr_population)<0.5);
    record('UNITS','Occupied housing conserved',abs(r.totU-3257020)<0.5);
    record('LGUS','All 17 unique LGUs including Pateros',height(r.Lg)==17 && ...
        numel(unique(string(r.Lg.adm3_pcode)))==17 && any(string(r.Lg.lgu_name)=="Pateros"));
    record('TIMING_MONO','Per-cell progression bounded and monotone', ...
        all(data.progression>=0 & data.progression<=1,'all') && all(diff(data.progression,1,1)>=0,'all'));
    record('TIMING_ZERO','Zero before and at local onset', ...
        all(data.progression(data.times_s<=data.onset_s')==0));
    record('TIMING_END','Every cell completes at its local arrival plus duration', ...
        all(data.progression(data.times_s>=data.onset_s'+data.duration_s)==1));
    [f,q,c]=animation_state([data.horizon_s;data.horizon_s+10],data.onset_s, ...
        data.duration_s,data.final_heavy,data.final_losses);
    record('TIMING_FINAL','Terminal and post-completion states equal static arrays', ...
        all(f==1,'all') && isequal(q,[data.final_heavy';data.final_heavy']) && ...
        all(abs(c-repmat(sum(data.final_losses,1),2,1))<1e-8,'all'));
    record('MASK','Inactive cells are excluded from temporal arrays', ...
        isequal(data.cell_id,T.cell_id(active)) && isempty(intersect(data.cell_id,data.inactive_cell_id)));
    record('LOSS_FINITE','Every cell casualty is finite and nonnegative', ...
        all(isfinite(data.final_losses) & data.final_losses>=0,'all'));
    if ismember(r.id,{'A','B'})
        reference='S1_baseline_20s'; if strcmp(r.id,'B'), reference='S2_baseline_40s'; end
        filename=fullfile(cfg.repoRoot,'results','scenarios',[reference '_cells.csv']);
        if isfile(filename)
            ref=readtable(filename); [found,idx]=ismember(T.cell_id,ref.cell_id);
            assert(all(found) && height(ref)==height(T),'Regression cell keys differ');
            fields={'R_km','pgv_cm_s','p_heavy','p_moderate','p_slight_or_below', ...
                'expected_heavily_damaged_units','expected_deaths','expected_injuries'};
            for k=1:numel(fields)
                actual=T.(fields{k}); expected=ref.(fields{k})(idx);
                valid=isnan(actual)&isnan(expected) | abs(actual-expected)<=1e-8+1e-12*abs(expected);
                record(['REG_' fields{k}],['Stored ' reference ' regression: ' fields{k}],all(valid));
            end
            lguRef=readtable(fullfile(cfg.repoRoot,'results','scenarios',[reference '_lgu.csv']));
            [found,idx]=ismember(string(r.Lg.adm3_pcode),string(lguRef.adm3_pcode));
            assert(all(found) && height(lguRef)==height(r.Lg),'Regression LGU keys differ');
            for field={'expected_deaths','expected_injuries','expected_heavily_damaged_units'}
                actual=r.Lg.(field{1}); expected=lguRef.(field{1})(idx);
                record(['REG_LGU_' field{1}],['Stored LGU regression: ' field{1}], ...
                    all(abs(actual-expected)<=1e-8+1e-12*abs(expected)));
            end
        else
            checks=add_check(checks,'REG_MISSING','Stored regression reference unavailable',0,1,0,'FAIL');
        end
    end
    function record(id,description,ok)
        checks=add_check(checks,[r.id '_' id],description,double(ok),1,0,passfail(double(ok),1,0));
    end
end
