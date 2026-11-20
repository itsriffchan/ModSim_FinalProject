function render_scenario_maps(cfg, results, G, data, outd)
%RENDER_SCENARIO_MAPS Static maps independent of VideoWriter and video codecs.
    n=numel(results);
    fig=figure('Visible','off','Color','w','Position',[0 0 600*n 850]);
    cleanup=onCleanup(@() close(fig)); %#ok<NASGU>
    layout=tiledlayout(fig,1,n,'TileSpacing','compact','Padding','compact');
    title(layout,'Final heavy-damage probability | model expectations');
    axesList=gobjects(n,1); images=gobjects(n,1);
    for k=1:n
        ax=nexttile(layout); axesList(k)=ax; hold(ax,'on');
        T=results(k).Tc; active=T.is_active;
        idx=sub2ind([G.ny G.nx],T.row(active)+1,T.col(active)+1);
        Z=nan(G.ny,G.nx); Z(idx)=T.p_heavy(active);
        x=(G.x0+((0:G.nx-1)+0.5)*G.cs)/1000;
        y=(G.y0+((0:G.ny-1)+0.5)*G.cs)/1000;
        images(k)=imagesc(ax,x,y,Z,'AlphaData',isfinite(Z));
        set(ax,'YDir','normal','Color',cfg.plot.inactive_cell_rgb);
        colormap(ax,parula); caxis(ax,[0 1]); axis(ax,'equal');
        xlim(ax,([G.x0 G.x0+G.nx*G.cs])/1000);
        ylim(ax,([G.y0 G.y0+G.ny*G.cs])/1000);
        for j=1:numel(G.LGU)
            [bx,by]=boundary(G.LGU(j).pg); plot(ax,bx/1000,by/1000,'k-','LineWidth',0.4);
        end
        fault=plot(ax,G.vx/1000,G.vy/1000,'r-','LineWidth',1.2);
        e=results(k).scenario.epicenter_spec;
        [ex,ey]=geo_utm51n_forward(e.lon_deg,e.lat_deg);
        epi=plot(ax,ex/1000,ey/1000,'p','MarkerSize',12,'MarkerFaceColor','w','MarkerEdgeColor','k');
        legend(ax,[fault epi],{'West Valley Fault','Assumed epicenter'},'Location','southoutside');
        xlabel(ax,'Easting (km), EPSG:32651'); ylabel(ax,'Northing (km)'); colorbar(ax);
        title(ax,{sprintf('%s | %s | %g s',results(k).id,results(k).scenario.epicenter,data{k}.duration_s), ...
            sprintf('Deaths %.1f | injuries %.1f',results(k).totD,results(k).totI)},'Interpreter','none');
    end
    exportgraphics(fig,fullfile(outd,'p_heavy.png'),'Resolution',cfg.plot.dpi);
    exportgraphics(fig,fullfile(outd,'final_frame.png'),'Resolution',cfg.plot.dpi);
    if n==1
        Z=nan(G.ny,G.nx); T=results.Tc; active=T.is_active;
        Z(idx)=T.pgv_cm_s(active); set(images(1),'CData',Z);
        caxis(axesList(1),[0 max(Z(:),[],'omitnan')]);
        title(layout,'Final effective PGV (cm/s), including assumed duration treatment');
        exportgraphics(fig,fullfile(outd,'pgv.png'),'Resolution',cfg.plot.dpi);
    end
end
