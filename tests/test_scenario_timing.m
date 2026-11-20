function checks = test_scenario_timing(cfg,checks)
%TEST_SCENARIO_TIMING Synthetic cell timing includes zero-loss cells.
    A=resolve_scenario(cfg,'A'); B=resolve_scenario(cfg,'B'); C=resolve_scenario(cfg,'C');
    ok=A.duration_s==20 && B.duration_s==40 && C.duration_s==40 && ...
        strcmp(A.epicenter,B.epicenter) && strcmp(C.epicenter,'alternative') && ...
        B.alpha==cfg.duration.alpha && C.alpha==B.alpha;
    record('PRIMARY_BINDINGS','Primary duration and epicenter bindings',ok);
    [fraction,damage,counts]=animation_state([0;1;2;3;5;7;8],[1;3],4,[0.5;0],[8 16;0 0]);
    record('ANIM_ZERO','Zero-loss cell remains zero',all(damage(:,2)==0));
    record('ANIM_EXACT','Synthetic assumed progression at arrivals and completion', ...
        isequal(fraction,[0 0;0 0;.25 0;.5 0;1 .5;1 1;1 1]) && ...
        isequal(counts,[0;0;2;4;8;8;8]*[1 2]));
    function record(id,desc,ok)
        checks=add_check(checks,id,desc,double(ok),1,0,passfail(double(ok),1,0));
    end
end
