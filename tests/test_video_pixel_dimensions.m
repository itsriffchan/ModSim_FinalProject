function checks = test_video_pixel_dimensions(cfg, outputRoot)
%TEST_VIDEO_PIXEL_DIMENSIONS Exercise renderer setup without encoding a video.
% Intentionally stop at the first grid access, after both graphics properties
% are set. Capture the actual properties when the renderer closes its figure.
    outputRoot=create_run_root(cfg.repoRoot,outputRoot);
    previous=get(groot,'DefaultFigureCreateFcn');
    cleanup=onCleanup(@() set(groot,'DefaultFigureCreateFcn',previous)); %#ok<NASGU>
    set(groot,'DefaultFigureCreateFcn',@watch_figure);
    checks=init_checks(); observed={};
    results=struct('id',{'A','B','C'});
    data=repmat({struct('horizon_s',0)},1,3);
    for count=[1 3]
        selected='standalone_pixels';
        if count>1, selected='comparison_pixels'; end
        expected=reshape(cfg.animation.(selected),1,[]);
        positions=cell(1,2);
        for form=1:2
            trial=cfg; pixels=expected;
            if form==2, pixels=pixels'; end
            trial.animation.(selected)=pixels;
            folder=fullfile(outputRoot,sprintf('%s_form_%d',selected,form)); mkdir(folder);
            observed={};
            report=render_scenario_video(trial,results(1:count),struct(),data(1:count),folder,'test');
            assert(numel(observed)==1,'Expected one graphics-property observation');
            positions{form}=observed{1};
            ok=~report.verified && numel(report.exceptions)==1 && ...
                strcmp(report.exceptions.operation,'initialize graphics') && ...
                ~isempty(report.exceptions.identifier) && ~isempty(report.exceptions.stack) && ...
                isequal(report.dimensions,expected) && ...
                isequal(observed{1}.position,[0 0 expected]) && ...
                max(abs(observed{1}.paper_position-[0 0 expected/100]))<1e-10 && ...
                max(abs(observed{1}.paper_size-expected/100))<1e-10;
            record(sprintf('%s_FORM_%d',selected,form),'Actual figure and paper dimensions; exception details retained',ok);
        end
        record([selected '_EQUIVALENT'],'Row and column inputs give identical graphics properties', ...
            isequaln(positions{1},positions{2}));
        invalid={[],1280,[1280 960 1],[0 960],[-1 960],[1280.5 960], ...
            [NaN 960],[Inf 960],[1280 960+1i],'1280x960'};
        for k=1:numel(invalid)
            trial=cfg; trial.animation.(selected)=invalid{k};
            folder=fullfile(outputRoot,sprintf('%s_invalid_%d',selected,k)); mkdir(folder);
            observed={};
            report=render_scenario_video(trial,results(1:count),struct(),data(1:count),folder,'test');
            ok=~report.verified && isempty(observed) && numel(report.exceptions)==1 && ...
                strcmp(report.exceptions.identifier,'modsim:InvalidVideoPixels') && ...
                strcmp(report.exceptions.operation,'validate pixel dimensions') && ...
                contains(report.errors{1},'[width height]') && ~isempty(report.exceptions.stack);
            record(sprintf('%s_INVALID_%d',selected,k),'Malformed dimensions rejected before creating graphics',ok);
        end
    end
    write_checks_csv(checks,fullfile(outputRoot,'checks.csv'));
    assert_all_passed(checks);

    function watch_figure(fig,~)
        addlistener(fig,'ObjectBeingDestroyed',@capture_properties);
    end
    function capture_properties(fig,~)
        observed{end+1}=struct('position',get(fig,'Position'), ...
            'paper_position',get(fig,'PaperPosition'),'paper_size',get(fig,'PaperSize'));
    end
    function record(id,description,ok)
        checks=add_check(checks,id,description,double(ok),1,0,passfail(double(ok),1,0));
    end
end
