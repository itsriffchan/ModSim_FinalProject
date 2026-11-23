function report = render_scenario_video(cfg, results, G, data, outd, stem)
%RENDER_SCENARIO_VIDEO Reuse graphics, stream RGB frames, decode every frame.
    a=cfg.animation; n=numel(results);
    pixels=a.standalone_pixels; if n>1, pixels=a.comparison_pixels; end
    pixels=reshape(pixels,1,[]);
    horizon=max(cellfun(@(d)d.horizon_s,data));
    times=unique([(0:a.playback_speed/a.fps:horizon)';horizon]);
    hold_count=round(a.final_hold_s*a.fps);
    times=[times; repmat(horizon,hold_count,1)];
    manifest=table((1:numel(times))',(0:numel(times)-1)'/a.fps,times, ...
        [(false(numel(times)-hold_count,1));true(hold_count,1)], ...
        'VariableNames',{'frame','playback_elapsed_s','origin_elapsed_s','final_hold'});
    for k=1:n
        manifest.(['elapsed_' results(k).id '_s'])=min(times,data{k}.horizon_s);
    end
    writetable(manifest,fullfile(outd,'frame_times.csv'));
    report=struct('verified',false,'status','failed','codec','','file','', ...
        'dimensions',[],'frame_count',numel(times),'decoded_frame_count',0, ...
        'fps',a.fps,'quality',a.quality,'playback_speed',a.playback_speed, ...
        'final_hold_frames',hold_count,'horizon_s',horizon,'errors',{{}}, ...
        'visual_review','PENDING: inspect first, onset, completion, final frames');
    report.exceptions=struct('operation',{},'codec',{},'identifier',{},'message',{},'stack',{});
    operation='validate pixel dimensions';
    try
        assert(isnumeric(pixels) && isreal(pixels) && numel(pixels)==2 && ...
            all(isfinite(pixels) & pixels>0 & pixels==fix(pixels)), ...
            'modsim:InvalidVideoPixels', ...
            'Video pixels must contain exactly two finite positive integer dimensions [width height].');
        report.dimensions=pixels;
        operation='create figure and set paper dimensions';
        fig=figure('Visible','off','Color','w','Units','pixels','Position',[0 0 pixels]);
        figCleanup=onCleanup(@() close(fig)); %#ok<NASGU>
        set(fig,'PaperUnits','inches','PaperPosition',[0 0 pixels/100], ...
            'PaperSize',pixels/100,'PaperPositionMode','manual','InvertHardcopy','off');
        operation='initialize graphics';
        images=gobjects(n,1); labels=gobjects(n,1);
        T=G.cells; active=T.is_active;
        nx=G.nx; ny=G.ny;
        x=(G.x0+((0:nx-1)+0.5)*G.cs)/1000;
        y=(G.y0+((0:ny-1)+0.5)*G.cs)/1000;
        index=sub2ind([ny nx],T.row(active)+1,T.col(active)+1);
        for k=1:n
            ax=subplot(1,n,k,'Parent',fig); hold(ax,'on');
            Z=nan(ny,nx); Z(index)=0;
            images(k)=imagesc(ax,x,y,Z,'AlphaData',isfinite(Z));
            set(ax,'Color',cfg.plot.inactive_cell_rgb,'YDir','normal','FontSize',10, ...
                'XColor','k','YColor','k');
            colormap(ax,parula); caxis(ax,[0 1]);
            axis(ax,'equal'); xlim(ax,[x(1)-G.cs/2000 x(end)+G.cs/2000]);
            ylim(ax,[y(1)-G.cs/2000 y(end)+G.cs/2000]);
            for j=1:numel(G.LGU)
                [bx,by]=boundary(G.LGU(j).pg); plot(ax,bx/1000,by/1000,'k-','LineWidth',0.5);
            end
            fault=plot(ax,G.vx/1000,G.vy/1000,'r-','LineWidth',1.4);
            epi=results(k).scenario.epicenter_spec;
            [ex,ey]=geo_utm51n_forward(epi.lon_deg,epi.lat_deg);
            marker=plot(ax,ex/1000,ey/1000,'p','MarkerSize',12,'MarkerFaceColor','w','MarkerEdgeColor','k');
            inactive=plot(ax,NaN,NaN,'s','MarkerFaceColor',cfg.plot.inactive_cell_rgb,'MarkerEdgeColor','k');
            legend(ax,[fault marker inactive],{'West Valley Fault','Assumed epicenter','Inactive cell'}, ...
                'Location','southoutside','FontSize',9,'Color','w','TextColor','k');
            xlabel(ax,'Easting (km), EPSG:32651'); ylabel(ax,'Northing (km)');
            colorbar(ax,'Location','eastoutside','Color','k');
            labels(k)=title(ax,'','Interpreter','none','FontSize',11,'Color','k');
        end
        heading=annotation(fig,'textbox',[0.04 0.94 0.92 0.055],'String', ...
            'Assumed progression toward final heavy-damage probability', ...
            'EdgeColor','none','HorizontalAlignment','center','FontSize',15,'Color','k');
        annotation(fig,'textbox',[0.04 0.005 0.92 0.065],'String', ...
            {data{1}.assumption,sprintf('Color = probability [0,1]. Playback: %g simulated seconds per playback second.',a.playback_speed)}, ...
            'EdgeColor','none','HorizontalAlignment','center','FontSize',11,'Color','k');
        operation='render final and static frames';
        update(horizon); terminal=rgb();
        imwrite(terminal,fullfile(outd,'final_frame.png'));
        % Terminal map is also the static final heavy-probability map.
        imwrite(terminal,fullfile(outd,'p_heavy.png'));
        if n==1
            Z=nan(ny,nx); Z(index)=results.Tc.pgv_cm_s(active);
            set(images(1),'CData',Z); caxis(get(images(1),'Parent'),[0 max(Z(:),[],'omitnan')]);
            set(heading,'String','Final effective PGV (cm/s), including assumed duration treatment');
            imwrite(rgb(),fullfile(outd,'pgv.png'));
            set(heading,'String','Assumed progression toward final heavy-damage probability');
            caxis(get(images(1),'Parent'),[0 1]); update(horizon);
        end
        reviewFrames=[1 numel(times)];
        for k=1:n
            reviewFrames=[reviewFrames find(times>=min(data{k}.onset_s),1) ...
                find(times>=data{k}.horizon_s,1)]; %#ok<AGROW>
        end
        candidates={'MPEG-4','Motion JPEG AVI'}; extensions={'.mp4','.avi'};
        operation='list codec profiles';
        profiles=VideoWriter.getProfiles();
        available={profiles.Name};
        for attempt=1:2
            codec=candidates{attempt};
            if ~ismember(codec,available), report.errors{end+1}=[codec ': unavailable']; continue; end
            filename=fullfile(outd,[stem extensions{attempt}]);
            try
                operation='encode codec probe';
                probe=[tempname(outd) extensions{attempt}];
                probeCleanup=onCleanup(@() remove_probe(probe));
                w=VideoWriter(probe,codec); w.FrameRate=a.fps; w.Quality=a.quality;
                open(w); writerCleanup=onCleanup(@() safe_close(w));
                writeVideo(w,terminal); writeVideo(w,terminal); close(w); clear writerCleanup;
                operation='decode codec probe';
                reader=VideoReader(probe); probeCount=0;
                while hasFrame(reader)
                    frame=readFrame(reader); probeCount=probeCount+1;
                    assert(isequal(size(frame),[pixels(2) pixels(1) 3]),'Probe dimensions differ');
                end
                assert(probeCount==2,'Probe frame count differs'); clear reader probeCleanup;
                operation='encode production video and save review frames';
                w=VideoWriter(filename,codec); w.FrameRate=a.fps; w.Quality=a.quality;
                open(w); writerCleanup=onCleanup(@() safe_close(w));
                for frameIndex=1:numel(times)
                    update(times(frameIndex)); frame=rgb(); writeVideo(w,frame);
                    if ismember(frameIndex,reviewFrames)
                        imwrite(frame,fullfile(outd,sprintf('review_frame_%05d.png',frameIndex)));
                    end
                end
                close(w); clear writerCleanup;
                operation='decode production video and verify final hold';
                reader=VideoReader(filename); count=0; decodedTerminal=[];
                while hasFrame(reader)
                    frame=readFrame(reader); count=count+1;
                    assert(isequal(size(frame),[pixels(2) pixels(1) 3]),'Decoded dimensions differ');
                    if count==numel(times)-hold_count, decodedTerminal=frame; end
                    if count>numel(times)-hold_count
                        % Codec noise may vary; the held source image is constant.
                        errorPixels=abs(double(frame)-double(decodedTerminal));
                        assert(mean(errorPixels,'all')<5,'Decoded final hold is not stable');
                    end
                end
                clear reader;
                assert(count==numel(times),'Decoded frame count differs');
                report.verified=true; report.status='exported_and_decoded';
                report.codec=codec; report.file=filename; report.decoded_frame_count=count;
                break;
            catch ME
                clear writerCleanup;
                report.errors{end+1}=[codec ': ' ME.message];
                report.exceptions(end+1)=exception_detail(ME,operation,codec);
            end
        end
    catch ME
        report.errors{end+1}=ME.message;
        report.exceptions(end+1)=exception_detail(ME,operation,'');
    end
    save(fullfile(outd,'video_export.mat'),'report');
    fid=fopen(fullfile(outd,'video_export.json'),'w');
    if fid>=0, c=onCleanup(@() fclose(fid)); fwrite(fid,jsonencode(report),'char'); end %#ok<NASGU>

    function update(t)
        for panel=1:n
            d=data{panel};
            [~,damage,counts]=animation_state(t,d.onset_s,d.duration_s,d.final_heavy,d.final_losses);
            if t>=d.horizon_s
                assert(isequal(damage,d.final_heavy'),'Terminal renderer differs from static damage');
                assert(all(abs(counts-sum(d.final_losses,1))<=1e-8),'Terminal casualties differ');
            end
            Z=nan(ny,nx); Z(index)=damage;
            set(images(panel),'CData',Z);
            set(labels(panel),'String',{sprintf('%s | %s | duration %g s', ...
                results(panel).id,results(panel).scenario.epicenter,d.duration_s), ...
                sprintf('Origin elapsed: %.2f simulated s',t), ...
                sprintf('Expected deaths %.1f | injuries %.1f',counts(1),counts(2)), ...
                'ASSUMED timing: reveal of final expected totals'});
        end
    end
    function frame=rgb()
        drawnow; frame=print(fig,'-RGBImage','-r100');
        assert(isequal(size(frame),[pixels(2) pixels(1) 3]),'Rendered dimensions differ');
    end
end

function detail=exception_detail(exception,operation,codec)
    detail=struct('operation',operation,'codec',codec,'identifier',exception.identifier, ...
        'message',exception.message,'stack',exception.stack);
end

function safe_close(writer)
    try, close(writer); catch, end
end
function remove_probe(filename)
    if isfile(filename), delete(filename); end
end
