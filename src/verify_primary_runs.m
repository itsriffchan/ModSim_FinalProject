function checks = verify_primary_runs(cfg,results,G)
%VERIFY_PRIMARY_RUNS Measured reordered/repeated calculations and presentation isolation.
    checks=init_checks();
    record('PRIMARY_IDS','Exactly primary A/B/C',isequal(string({results.id}),["A" "B" "C"]));
    record('AB_DISTANCE','A/B rupture distances identical',isequaln(results(1).Tc.R_km,results(2).Tc.R_km));
    record('BC_SCALE','B/C duration multipliers identical',results(2).duration_multiplier==results(3).duration_multiplier);
    record('DURATION','Assumed duration increase does not reduce deaths',results(2).totD>=results(1).totD);
    originalG=G;
    for k=[3 1 2 1]
        sc=resolve_scenario(cfg,results(k).id);
        repeated=calculate_scenario(cfg,sc,G);
        record(sprintf('REPEAT_%d_%d',k,numel(checks)),'Reordered independent calculation equals orchestration', ...
            isequaln(repeated.Tc,results(k).Tc) && isequaln(repeated.Lg,results(k).Lg) && ...
            isequaln(repeated.scenario,results(k).scenario));
    end
    changed=cfg; changed.animation.sample_spacing_s=0.7;
    changed.animation.fps=12; changed.animation.playback_speed=3; changed.animation.final_hold_s=1;
    r=calculate_scenario(changed,resolve_scenario(changed,'B'),G);
    altered=scenario_animation_data(changed,r,G);
    record('PRESENTATION','Presentation changes preserve scientific arrays', ...
        isequaln(r.Tc,results(2).Tc) && isequaln(r.Lg,results(2).Lg));
    record('NO_RESCALE','Repeated temporal preparation does not scale damage again', ...
        isequal(altered.damage_display(end,:)',results(2).Tc.p_heavy(results(2).Tc.is_active)));
    record('PREPARED_READONLY','Prepared exposure and geometry unchanged',isequaln(G,originalG));
    function record(id,description,ok)
        checks=add_check(checks,id,description,double(ok),1,0,passfail(double(ok),1,0));
    end
end
