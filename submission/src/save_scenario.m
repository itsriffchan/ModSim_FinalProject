function [result, artifacts] = save_scenario(cfg, sc, G, outputRoot, provenance)
%SAVE_SCENARIO Persist one calculation and all scenario-specific presentations.
    outd=fullfile(outputRoot,sc.id); mkdir(outd);
    result=calculate_scenario(cfg,sc,G);
    artifacts=struct('directory',outd,'state',fullfile(outd,'state.mat'));
    writetable(result.Tc,fullfile(outd,'cells.csv'));
    writetable(result.Lg,fullfile(outd,'lgu.csv'));
    data=scenario_animation_data(cfg,result,G);
    save(fullfile(outd,'animation_data.mat'),'data','-v7.3');
    timeline=table(data.times_s,data.cumulative_casualties(:,1),data.cumulative_casualties(:,2), ...
        data.simultaneous_control(:,1),data.simultaneous_control(:,2), ...
        'VariableNames',{'origin_elapsed_s','expected_deaths','expected_injuries', ...
        'simultaneous_control_deaths','simultaneous_control_injuries'});
    writetable(timeline,fullfile(outd,'timeline.csv'));
    result.checks=verify_scenario(cfg,result,G,data);
    % Save numerical state before attempting any graphics or codec operations.
    save(artifacts.state,'cfg','sc','result','provenance','artifacts','-v7.3');
    export=render_scenario_presentation(cfg,result,G,{data},outd,sc.id,provenance);
    mode=presentation_mode(cfg);
    result.checks=add_check(result.checks,upper(mode.presentation.mode),'Selected presentation exported and verified', ...
        double(export.verified),1,0,passfail(double(export.verified),1,0));
    result.export=export;
    write_checks_csv(result.checks,fullfile(outd,'checks.csv'));
    save(artifacts.state,'cfg','sc','result','provenance','artifacts','-v7.3');
end
