function checks = verify_scenario_numerics(cfg,r,G)
%VERIFY_SCENARIO_NUMERICS Shared numerical checks without graphics or timing.
    checks=r.checks; T=r.Tc; active=T.is_active;
    record('POP','Population conserved',abs(sum(T.population_2020)-cfg.checks.expected_ncr_population)<0.5);
    record('UNITS','Occupied housing conserved',abs(r.totU-sum(G.units.occupied_housing_units))<0.5 && ...
        abs(r.totU-3257020)<0.5);
    record('LGUS','All 17 unique LGUs including Pateros',height(r.Lg)==17 && ...
        numel(unique(string(r.Lg.adm3_pcode)))==17 && any(string(r.Lg.lgu_name)=="Pateros"));
    [found,idx]=ismember(string(r.Lg.adm3_pcode),string(G.pop.adm3_pcode));
    record('LGU_POP','LGU populations preserved',all(found) && ...
        all(abs(r.Lg.population_2020-G.pop.total_population(idx))<0.5));
    for k=1:height(r.Lg)
        units=sum(G.units.occupied_housing_units(string(G.units.adm3_pcode)==string(r.Lg.adm3_pcode(k))));
        record(sprintf('LGU_UNITS_%d',k),'LGU housing exposure conserved', ...
            abs(r.Lg.occupied_housing_units(k)-units)<0.5);
    end
    probabilities=[T.p_heavy T.p_moderate T.p_slight_or_below];
    record('PROBABILITY','Finite bounded exclusive probabilities on active cells', ...
        all(isfinite(probabilities) & probabilities>=0 & probabilities<=1,'all') && ...
        all(abs(sum(probabilities(active,:),2)-1)<1e-9));
    record('PGV','Active PGV finite and positive; inactive PGV masked', ...
        all(isfinite(T.pgv_cm_s(active)) & T.pgv_cm_s(active)>0) && all(isnan(T.pgv_cm_s(~active))));
    fields={'expected_heavily_damaged_units','expected_deaths','expected_injuries'};
    for k=1:numel(fields)
        cellValues=T.(fields{k}); lguValues=r.Lg.(fields{k});
        record(['FINITE_' fields{k}],'Cell and LGU expectations finite and nonnegative', ...
            all(isfinite(cellValues) & cellValues>=0) && all(isfinite(lguValues) & lguValues>=0));
        record(['TOTAL_' fields{k}],'Cell and LGU totals agree',abs(sum(cellValues)-sum(lguValues))<1e-7);
    end
    moderate=r.Lg.expected_moderately_damaged_units;
    record('MODERATE','Moderately damaged housing finite, nonnegative; damage <= exposure', ...
        all(isfinite(moderate) & moderate>=0) && ...
        all(moderate+r.Lg.expected_heavily_damaged_units<=r.Lg.occupied_housing_units+1e-8));
    if matches_primary_reference(cfg,r)
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

function tf = matches_primary_reference(cfg,r)
% Sensitivity IDs/roles and changed primary settings never use stored A/B fits.
    tf=false;
    if ~ismember(r.id,{'A','B'}) || ~strcmp(r.role,'primary'), return; end
    expected=resolve_scenario(cfg,r.id);
    tf=isequaln(r.scenario,expected) && cfg.ground_motion.vs30_mps==360 && ...
        cfg.duration.reference_s==20 && cfg.duration.alpha==0.25;
end
