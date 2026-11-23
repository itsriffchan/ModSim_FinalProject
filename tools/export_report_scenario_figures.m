function outputRoot = export_report_scenario_figures(batchRoot, outputRoot)
%EXPORT_REPORT_SCENARIO_FIGURES Plot saved A/B/C results without rerunning the model.
    repo = fileparts(fileparts(mfilename('fullpath')));
    if nargin < 1 || isempty(batchRoot)
        batchRoot = fullfile(repo, 'results', 'runs', ...
            '20261123T125422_tpeaa1c0df_2e9a_4bf0_8109_705ecb4e78ed', 'batch');
    end
    if nargin < 2 || isempty(outputRoot)
        outputRoot = fullfile(repo, 'results', 'report_figures');
    end
    if ~isfolder(outputRoot), mkdir(outputRoot); end
    oldPath = path;
    pathCleanup = onCleanup(@() path(oldPath)); %#ok<NASGU>
    addpath(fullfile(repo, 'src'));
    graphicsCleanup = scoped_graphics_defaults();
    summary = readtable(fullfile(batchRoot, 'comparison', 'scenario_comparison.csv'), 'TextType', 'string');
    assert(isequal(summary.scenario, ["A"; "B"; "C"]), 'Expected primary A/B/C results.');
    colors = [0.12 0.34 0.58; 0.76 0.34 0.10; 0.24 0.47 0.37];
    locations = ["Pasig", "Pasig", "Muntinlupa"];
    tables = cell(1, 3);
    cells = cell(1, 3);
    for k = 1:3
        id = char(summary.scenario(k));
        tables{k} = readtable(fullfile(batchRoot, id, 'lgu.csv'), 'TextType', 'string');
        cells{k} = readtable(fullfile(batchRoot, id, 'cells.csv'), 'TextType', 'string');
        assert(height(tables{k}) == 17 && numel(unique(tables{k}.adm3_pcode)) == 17, 'Expected 17 unique LGUs.');
        assert(abs(sum(tables{k}.expected_deaths) - summary.expected_deaths(k)) < 1e-6, 'Death total mismatch.');
        assert(abs(sum(tables{k}.expected_injuries) - summary.expected_injuries(k)) < 1e-6, 'Injury total mismatch.');
    end
    maxDeaths = max(cellfun(@(t) max(t.expected_deaths), tables));
    maxInjuries = max(cellfun(@(t) max(t.expected_injuries), tables));
    for k = 1:3
        id = char(summary.scenario(k));
        fig = figure('Visible', 'off', 'Color', [1 1 1], 'Position', [0 0 1400 780], 'InvertHardcopy', 'off');
        cleanup = onCleanup(@() close(fig));
        annotation(fig, 'textbox', [0.04 0.91 0.92 0.065], 'String', ...
            sprintf('Scenario %s: %s, %g seconds', id, locations(k), summary.duration_s(k)), ...
            'LineStyle', 'none', 'FontName', 'Arial', 'FontSize', 24, 'FontWeight', 'bold', 'Color', [0 0 0]);
        values = [summary.expected_deaths(k), summary.expected_injuries(k), summary.expected_heavily_damaged_units(k)];
        labels = {'Expected deaths', 'Expected nonfatal injuries', 'Expected heavily damaged housing units'};
        for j = 1:3
            left = 0.04 + (j - 1) * 0.315;
            annotation(fig, 'rectangle', [left 0.69 0.29 0.15], 'Color', [0.55 0.55 0.55], 'FaceColor', [0.96 0.97 0.98]);
            annotation(fig, 'textbox', [left + 0.012 0.755 0.266 0.06], 'String', comma_value(values(j)), ...
                'LineStyle', 'none', 'FontName', 'Arial', 'FontSize', 24, 'FontWeight', 'bold', 'Color', colors(k, :));
            annotation(fig, 'textbox', [left + 0.012 0.70 0.266 0.05], 'String', labels{j}, ...
                'LineStyle', 'none', 'FontName', 'Arial', 'FontSize', 12, 'Color', [0.20 0.20 0.20]);
        end
        T = sortrows(tables{k}, 'expected_deaths', 'descend');
        top = T(1:5, :);
        names = erase(top.lgu_name, 'City of ');
        annotation(fig, 'textbox', [0.04 0.60 0.92 0.055], 'String', ...
            'Five LGUs with the highest expected death counts', ...
            'LineStyle', 'none', 'FontName', 'Arial', 'FontSize', 16, 'FontWeight', 'bold', 'Color', [0 0 0]);
        for j = 1:2
            if j == 1
                v = top.expected_deaths; lim = maxDeaths * 1.24; heading = 'Expected deaths';
                pos = [0.16 0.16 0.32 0.40];
            else
                v = top.expected_injuries; lim = maxInjuries * 1.24; heading = 'Expected nonfatal injuries';
                pos = [0.62 0.16 0.32 0.40];
            end
            ax = axes('Parent', fig, 'Position', pos, 'Color', [1 1 1], 'XColor', [0 0 0], ...
                'YColor', [0 0 0], 'GridColor', [0.75 0.75 0.75], 'FontName', 'Arial');
            barh(ax, 1:5, v, 0.60, 'FaceColor', colors(k, :), 'EdgeColor', 'none');
            set(ax, 'YDir', 'reverse', 'YTick', 1:5, 'FontName', 'Arial', 'FontSize', 13, 'Box', 'off');
            if j == 1, set(ax, 'YTickLabel', names); else, set(ax, 'YTickLabel', []); end
            xlim(ax, [0 lim]); ylim(ax, [0.4 5.6]); grid(ax, 'on'); ax.YGrid = 'off';
            xlabel(ax, heading, 'FontSize', 12);
            for r = 1:5
                text(ax, v(r) + lim * 0.012, r, comma_value(v(r)), 'FontName', 'Arial', 'FontSize', 12, ...
                'VerticalAlignment', 'middle', 'Color', [0 0 0]);
            end
        end
        exportgraphics(fig, fullfile(outputRoot, ['scenario_' id '_results.png']), 'Resolution', 200, 'BackgroundColor', 'white');
        clear cleanup;
    end
    draw_probability_maps(repo, cells, summary, locations, outputRoot);
    draw_scenario_total_comparison(summary, locations, outputRoot);
    writetable(summary, fullfile(outputRoot, 'scenario_totals.csv'));
    fprintf('Report figures exported from saved CSVs only: %s\n', outputRoot);
end

function draw_probability_maps(repo, cells, summary, locations, outputRoot)
    vertices = readtable(fullfile(repo, 'data', 'processed', 'ncr_lgu_boundaries_vertices.csv'), 'CommentStyle', '#', 'TextType', 'string');
    fault = readtable(fullfile(repo, 'data', 'processed', 'wvf_trace_vertices.csv'), 'CommentStyle', '#');
    cfg = jsondecode(fileread(fullfile(repo, 'config', 'modsim_config.json')));
    fig = figure('Visible', 'off', 'Color', [1 1 1], 'Position', [0 0 1500 1000], 'InvertHardcopy', 'off');
    cleanup = onCleanup(@() close(fig)); %#ok<NASGU>
    layout = tiledlayout(fig, 1, 3, 'TileSpacing', 'compact', 'Padding', 'compact');
    title(layout, 'Heavy-damage probability', 'FontName', 'Arial', 'FontSize', 21, 'Color', [0 0 0]);
    subtitle(layout, 'Common 0-10% scale', 'FontSize', 13, 'Color', [0.25 0.25 0.25]);
    blue = interp1([0; 1], [0.95 0.97 0.99; 0.06 0.25 0.48], linspace(0, 1, 256)');
    for k = 1:3
        T = cells{k}; nx = max(T.col) + 1; ny = max(T.row) + 1;
        Z = nan(ny, nx); active = logical(T.is_active);
        idx = sub2ind([ny nx], T.row(active) + 1, T.col(active) + 1);
        Z(idx) = T.p_heavy(active) * 100;
        x = sort(unique(T.x_center_m)) / 1000; y = sort(unique(T.y_center_m)) / 1000;
        ax = nexttile(layout); hold(ax, 'on');
        imagesc(ax, x, y, Z, 'AlphaData', isfinite(Z));
        set(ax, 'YDir', 'normal', 'Color', [0.88 0.88 0.88], 'FontName', 'Arial', 'FontSize', 12, ...
            'XColor', [0 0 0], 'YColor', [0 0 0]);
        colormap(ax, blue); clim(ax, [0 10]); axis(ax, 'equal');
        xlim(ax, [min(x)-0.25 max(x)+0.25]); ylim(ax, [min(y)-0.25 max(y)+0.25]);
        key = vertices.adm3_pcode + "|" + string(vertices.part_id) + "|" + string(vertices.ring_id);
        for group = unique(key, 'stable')'
            V = sortrows(vertices(key == group, :), 'vertex_idx');
            plot(ax, V.x_m / 1000, V.y_m / 1000, '-', 'Color', [0.25 0.30 0.35], 'LineWidth', 0.5);
        end
        hFault = plot(ax, fault.x_m / 1000, fault.y_m / 1000, '-', 'Color', [0.75 0.12 0.18], 'LineWidth', 1.4);
        e = cfg.epicenters(1); if k == 3, e = cfg.epicenters(2); end
        [ex, ey] = geo_utm51n_forward(e.lon_deg, e.lat_deg);
        hEpi = plot(ax, ex / 1000, ey / 1000, 'p', 'MarkerSize', 12, 'MarkerFaceColor', [1 0.8 0.1], 'MarkerEdgeColor', 'k');
        title(ax, sprintf('%s | %s | %g s', summary.scenario(k), locations(k), summary.duration_s(k)), ...
            'FontSize', 14, 'Color', [0 0 0]);
        xlabel(ax, 'Easting (km)'); if k == 1, ylabel(ax, 'Northing (km)'); end
        legend(ax, [hFault hEpi], {'West Valley Fault', 'Assumed epicenter'}, 'Location', 'southoutside', 'FontSize', 10);
    end
    cb = colorbar; cb.Layout.Tile = 'east'; cb.Ticks = 0:2:10; cb.Label.String = 'Heavy-damage probability (%)';
    exportgraphics(fig, fullfile(outputRoot, 'abc_damage_probability.png'), 'Resolution', 200, 'BackgroundColor', 'white');
end

function s = comma_value(value)
    parts = split(string(sprintf('%.1f', value)), '.');
    whole = regexprep(char(parts(1)), '(\d)(?=(\d{3})+$)', '$1,');
    s = [whole '.' char(parts(2))];
end

function draw_scenario_total_comparison(summary, locations, outputRoot)
    fig = figure('Visible', 'off', 'Color', [1 1 1], 'Position', [0 0 1800 760], 'InvertHardcopy', 'off');
    cleanup = onCleanup(@() close(fig));
    colors = [0.12 0.34 0.58; 0.76 0.34 0.10; 0.24 0.47 0.37];
    layout = tiledlayout(fig, 1, 3, 'TileSpacing', 'compact', 'Padding', 'compact');
    title(layout, 'A/B/C NCR totals', 'FontName', 'Arial', 'FontSize', 24, 'Color', [0 0 0]);

    fields = {'expected_deaths', 'expected_injuries', 'expected_heavily_damaged_units'};
    headings = {'Expected deaths', 'Expected nonfatal injuries', 'Heavily damaged housing units'};
    tickSteps = [2000, 20000, 40000];
    for k = 1:3
        ax = nexttile(layout);
        set(ax, 'Color', [1 1 1], 'XColor', [0 0 0], 'YColor', [0 0 0], ...
            'GridColor', [0.78 0.78 0.78], 'FontName', 'Arial', 'FontSize', 13);
        values = summary.(fields{k});
        bar(ax, 1:3, values, 'FaceColor', 'flat');
        ax.Children.CData = colors;
        set(ax, 'XTick', 1:3, 'XTickLabel', {
            sprintf('A\n%s\n%g s', locations(1), summary.duration_s(1));
            sprintf('B\n%s\n%g s', locations(2), summary.duration_s(2));
            sprintf('C\n%s\n%g s', locations(3), summary.duration_s(3));
        }, 'FontName', 'Arial', 'FontSize', 12, 'Box', 'off');
        top = ceil(max(values) * 1.22 / tickSteps(k)) * tickSteps(k);
        yticks(ax, 0:tickSteps(k):top);
        ytickformat(ax, '%,.0f');
        ylim(ax, [0 top]);
        ylabel(ax, headings{k}, 'FontName', 'Arial', 'FontSize', 14, 'Color', [0 0 0]);
        grid(ax, 'on');
        ax.YGrid = 'on';
        ax.XGrid = 'off';
        for r = 1:3
            text(ax, r, values(r) + top * 0.035, comma_value(values(r)), ...
                'HorizontalAlignment', 'center', 'FontName', 'Arial', 'FontSize', 14, ...
                'FontWeight', 'bold', 'Color', [0 0 0]);
        end
    end

    exportgraphics(fig, fullfile(outputRoot, 'abc_totals.png'), 'Resolution', 200, 'BackgroundColor', 'white');
    clear cleanup;
end
