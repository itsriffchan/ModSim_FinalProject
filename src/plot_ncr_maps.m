function plot_ncr_maps(cfg, T, verts, wvf, exb, eyb, exa, eya, outd, LGU, rx1, ry1, rx3, ry3)
    act = T(T.is_active, :);
    cs = cfg.grid.cell_size_m;

    % Base map
    fig = figure('Visible', 'off', 'Color', 'w', 'Position', [0 0 1100 1300]);
    hold on;
    % active cells
    for i = 1:height(act)
        x1 = act.x_center_m(i) - cs/2; y1 = act.y_center_m(i) - cs/2;
        rectangle('Position', [x1/1000, y1/1000, cs/1000, cs/1000], ...
            'EdgeColor', [0.75 0.75 0.75], 'LineWidth', 0.2);
    end
    % crossed outline
    cr = act(act.fault_crosses, :);
    for i = 1:height(cr)
        x1 = cr.x_center_m(i) - cs/2; y1 = cr.y_center_m(i) - cs/2;
        rectangle('Position', [x1/1000, y1/1000, cs/1000, cs/1000], ...
            'EdgeColor', [0.7 0.2 0.1], 'LineWidth', 0.8);
    end
    % LGU borders
    pcodes = unique(string(verts.adm3_pcode), 'stable');
    for i = 1:numel(pcodes)
        sub = verts(string(verts.adm3_pcode) == pcodes(i), :);
        parts = unique(sub.part_id);
        for p = 1:numel(parts)
            ext = sortrows(sub(sub.part_id==parts(p) & sub.is_hole==0, :), 'vertex_idx');
            plot(ext.x_m/1000, ext.y_m/1000, 'k-', 'LineWidth', 1.0);
        end
    end
    hFault = plot(wvf.x_m/1000, wvf.y_m/1000, 'r-', 'LineWidth', 2.0);
    hB = plot(exb/1000, eyb/1000, 'p', 'MarkerSize', 14, 'MarkerFaceColor', [0.9 0.1 0.1], ...
        'MarkerEdgeColor', 'k', 'LineWidth', 0.8);
    hA = plot(exa/1000, eya/1000, 'd', 'MarkerSize', 10, 'MarkerFaceColor', [0.1 0.2 0.8], ...
        'MarkerEdgeColor', 'k', 'LineWidth', 0.8);
    % labels: centroids
    for i = 1:numel(LGU)
        [cx, cy] = centroid(LGU(i).pg);
        text(cx/1000, cy/1000, short_name(LGU(i).pcode), 'FontSize', 7, ...
            'HorizontalAlignment', 'center', 'Color', [0.1 0.1 0.1], 'FontWeight', 'bold');
    end
    axis equal tight;
    set(gca, 'YDir', 'normal');
    xlabel('Easting (km), EPSG:32651');
    ylabel('Northing (km), EPSG:32651');
    title({'NCR 500 m grid, West Valley Fault and assumed epicenters', ...
        'Red line: GEM PHL_{31} WVF (CC BY-SA 4.0). Star: baseline (Pasig). Diamond: alternative (Muntinlupa).'});
    % Dummy handle for crossed-cell outline
    hCr = plot(nan, nan, '-', 'Color', [0.7 0.2 0.1], 'LineWidth', 1.2);
    legend([hCr, hFault, hB, hA], {'Fault-crossed cells', 'West Valley Fault', ...
        'Baseline epicenter (ASSUMED)', 'Alternative epicenter (ASSUMED)'}, ...
        'Location', 'southwest', 'Interpreter', 'none');
    % footer
    text(min(act.x_center_m)/1000, min(act.y_center_m)/1000 - 3, ...
        ['Sources: PSA 2020 CPH; NAMRIA/PSA via OCHA HDX (CC BY-IGO); ', ...
         'GEM GAF (CC BY-SA 4.0); WorldPop (CC BY 4.0). North is up.'], ...
        'FontSize', 7, 'Interpreter', 'none');
    export_fig(fig, fullfile(outd, 'ncr_base_map'));
    close(fig);

    % Population density (persons / km2 of cell area * fraction? use persons per km2 of 500m cell)
    dens = act.population_2020 ./ ((cs/1000)^2);  % per full cell km2
    field_map(cfg, T, verts, wvf, exb, eyb, exa, eya, dens, act.cell_id, ...
        'Persons per km^{2} (PSA 2020 CPH, WorldPop-weighted)', ...
        'ncr_population_2020', outd, true);

    field_map(cfg, T, verts, wvf, exb, eyb, exa, eya, act.dist_fault_km, act.cell_id, ...
        'Distance to West Valley Fault trace (km)', 'ncr_dist_fault_km', outd, false);
    % identical colour limits for epicenter distance maps
    climE = [0, max([act.dist_epi_baseline_km; act.dist_epi_alt_km])];
    field_map(cfg, T, verts, wvf, exb, eyb, exa, eya, act.dist_epi_baseline_km, act.cell_id, ...
        'Distance to baseline epicenter (km)', 'ncr_dist_epi_baseline_km', outd, false, climE);
    field_map(cfg, T, verts, wvf, exb, eyb, exa, eya, act.dist_epi_alt_km, act.cell_id, ...
        'Distance to alternative epicenter (km)', 'ncr_dist_epi_alt_km', outd, false, climE);
    field_map(cfg, T, verts, wvf, exb, eyb, exa, eya, act.rjb_s1_km, act.cell_id, ...
        'R_{JB} to 67 km rupture at baseline (km)', 'ncr_rjb_s1_km', outd, false);
    field_map(cfg, T, verts, wvf, exb, eyb, exa, eya, act.rjb_s3_km, act.cell_id, ...
        'R_{JB} to 67 km rupture at alternative (km)', 'ncr_rjb_s3_km', outd, false);
end

function field_map(cfg, T, verts, wvf, exb, eyb, exa, eya, values, ids, clabel, stem, outd, doLog, climFixed)
    if nargin < 15, climFixed = []; end
    cs = cfg.grid.cell_size_m;
    ny = max(T.row)+1; nx = max(T.col)+1;
    Z = nan(ny, nx);
    % map values onto grid by cell id
    for i = 1:numel(ids)
        r = T.row(T.cell_id == ids(i));
        c = T.col(T.cell_id == ids(i));
        if isempty(r), continue; end
        Z(r(1)+1, c(1)+1) = values(i);
    end
    x0 = min(T.x_center_m) - cs/2;
    y0 = min(T.y_center_m) - cs/2;
    % actually use true origin from min col/row among all cells
    xOrig = min(T.x_center_m - T.col*cs) - cs/2; % messy
    xs = (min(T.x_center_m(T.col==min(T.col))) : cs : max(T.x_center_m)) / 1000;
    ys = (min(T.y_center_m(T.row==min(T.row))) : cs : max(T.y_center_m)) / 1000;
    % safer: unique sorted centres
    xcent = accumarray(T.col+1, T.x_center_m, [], @mean)/1000;
    ycent = accumarray(T.row+1, T.y_center_m, [], @mean)/1000;

    fig = figure('Visible', 'off', 'Color', 'w', 'Position', [0 0 1000 1200]);
    hold on;
    if doLog
        Zplot = Z;
        Zplot(Zplot <= 0) = NaN;
        imagesc(xcent, ycent, log10(Zplot));
        cb = colorbar;
        cb.Label.String = ['log_{10} ' clabel];
    else
        imagesc(xcent, ycent, Z);
        cb = colorbar;
        cb.Label.String = clabel;
        if ~isempty(climFixed)
            caxis(climFixed);
        end
    end
    colormap(parula);
    set(gca, 'YDir', 'normal');
    axis equal tight;
    % borders and fault
    pcodes = unique(string(verts.adm3_pcode), 'stable');
    for i = 1:numel(pcodes)
        sub = verts(string(verts.adm3_pcode) == pcodes(i), :);
        parts = unique(sub.part_id);
        for p = 1:numel(parts)
            ext = sortrows(sub(sub.part_id==parts(p) & sub.is_hole==0, :), 'vertex_idx');
            plot(ext.x_m/1000, ext.y_m/1000, 'k-', 'LineWidth', 0.7);
        end
    end
    plot(wvf.x_m/1000, wvf.y_m/1000, 'r-', 'LineWidth', 1.6);
    plot(exb/1000, eyb/1000, 'p', 'MarkerSize', 12, 'MarkerFaceColor', [1 1 1], 'MarkerEdgeColor', 'k');
    plot(exa/1000, eya/1000, 'd', 'MarkerSize', 8, 'MarkerFaceColor', [1 1 1], 'MarkerEdgeColor', 'k');
    xlabel('Easting (km), EPSG:32651');
    ylabel('Northing (km), EPSG:32651');
    title(clabel);
    text(min(xcent), min(ycent)-2.5, 'North is up. Inactive cells are blank (outside NCR).', 'FontSize', 7);
    export_fig(fig, fullfile(outd, stem));
    close(fig);
end

function s = short_name(pcode)
    persistent map
    if isempty(map)
        map = containers.Map( ...
            {'PH1303901','PH1307401','PH1307402','PH1307403','PH1307404','PH1307405', ...
             'PH1307501','PH1307502','PH1307503','PH1307504', ...
             'PH1307601','PH1307602','PH1307603','PH1307604','PH1307605','PH1307606','PH1307607'}, ...
            {'Manila','Mandaluyong','Marikina','Pasig','Quezon City','San Juan', ...
             'Caloocan','Malabon','Navotas','Valenzuela', ...
             'Las Pinas','Makati','Muntinlupa','Paranaque','Pasay','Pateros','Taguig'});
    end
    key = char(string(pcode));
    if isKey(map, key), s = map(key); else, s = key; end
end
