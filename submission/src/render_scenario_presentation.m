function report = render_scenario_presentation(cfg, results, G, data, outd, stem, provenance)
%RENDER_SCENARIO_PRESENTATION Select default offline viewer or explicit video.
    cfg=presentation_mode(cfg);
    if strcmp(cfg.presentation.mode,'video')
        report=render_scenario_video(cfg,results,G,data,outd,stem);
    else
        render_scenario_maps(cfg,results,G,data,outd);
        report=write_scenario_viewer(cfg,results,G,data,outd,stem,provenance);
    end
end
