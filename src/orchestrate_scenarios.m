function [results, checks] = orchestrate_scenarios(cfg, outputRoot)
%ORCHESTRATE_SCENARIOS Prepare once, run identical engine, compare primary cases.
    prepared=fullfile(outputRoot,'prepared');
    [checks,G]=run_ncr_grid(cfg,init_checks(),prepared);
    provenance=run_provenance(cfg);
    save(fullfile(prepared,'prepared.mat'),'cfg','G','provenance','-v7.3');
    write_checks_csv(checks,fullfile(prepared,'checks.csv'));
    ids={'A','B','C'};
    for k=1:numel(ids)
        sc=resolve_scenario(cfg,ids{k});
        [r,~]=save_scenario(cfg,sc,G,outputRoot,provenance);
        if k==1, results=r; else, results(k)=r; end
        checks=[checks r.checks]; %#ok<AGROW>
    end
    outd=fullfile(outputRoot,'comparison'); mkdir(outd);
    summary=table(string({results.id})',[results.duration_s]',[results.alpha]', ...
        [results.totU]',[results.totH]',[results.totD]',[results.totI]', ...
        'VariableNames',{'scenario','duration_s','alpha','occupied_housing_units', ...
        'expected_heavily_damaged_units','expected_deaths','expected_injuries'});
    summary.deaths_per_1000_residents=summary.expected_deaths/sum(G.pop.total_population)*1000;
    writetable(summary,fullfile(outd,'scenario_comparison.csv'));
    difference=table(["B minus A";"C minus B"],diff([results.totD])',diff([results.totI])', ...
        'VariableNames',{'comparison','expected_deaths_difference','expected_injuries_difference'});
    writetable(difference,fullfile(outd,'differences.csv'));
    for k=1:3, data{k}=scenario_animation_data(cfg,results(k),G); end %#ok<AGROW>
    comparisonChecks=verify_primary_runs(cfg,results,G);
    comparisonChecks=write_casualty_timeline(cfg.scenarios,results,G.waveArrivals,outd,comparisonChecks);
    plot_shaking_timeline(cfg,outd);
    export=render_scenario_video(cfg,results,G,data,outd,'ABC_comparison');
    comparisonChecks=add_check(comparisonChecks,'VIDEO_ABC','Comparison exported and every frame decoded', ...
        double(export.verified),1,0,passfail(double(export.verified),1,0));
    inputs=struct('id',{results.id},'scenario',{results.scenario}, ...
        'fingerprints',provenance.fingerprints);
    save(fullfile(outd,'comparison_state.mat'),'inputs','export','cfg','-v7.3');
    write_checks_csv(comparisonChecks,fullfile(outd,'checks.csv'));
    checks=[checks comparisonChecks];
    plot_comparison(results,outd);
end

function plot_comparison(results,outd)
    fig=figure('Visible','off','Color','w','Position',[0 0 1600 900]);
    cleanup=onCleanup(@() close(fig)); %#ok<NASGU>
    names=string(results(1).Lg.lgu_name);
    for panel=1:2
        subplot(2,1,panel);
        if panel==1, field='expected_deaths'; else, field='expected_injuries'; end
        y=zeros(numel(names),3);
        for k=1:3, y(:,k)=results(k).Lg.(field); end
        bar(y); set(gca,'XTick',1:numel(names),'XTickLabel',names,'XTickLabelRotation',35);
        ylabel(strrep(field,'_',' ')); legend({results.id}); grid on;
    end
    export_fig(fig,fullfile(outd,'lgu_casualties_ABC'));
end
