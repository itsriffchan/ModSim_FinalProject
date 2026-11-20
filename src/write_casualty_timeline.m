function C = write_casualty_timeline(scenarios, results, arrivals, outd, C)
%WRITE_CASUALTY_TIMELINE  Compare S-wave onset with a simultaneous-onset control.

    end_s = ceil(max([scenarios.duration_s]) + max(arrivals.s_arrival_s));
    elapsed_s = (0:0.25:end_s)';
    timelines = cell(numel(scenarios), 1);
    tolerance = 1e-8;

    for i = 1:numel(scenarios)
        scenario = scenarios(i);
        cells = results(i).Tc;
        cells = cells(cells.is_active, :);
        sourceArrivals = arrivals(arrivals.epicenter_id == string(scenario.epicenter), :);
        [matched, index] = ismember(cells.cell_id, sourceArrivals.cell_id);
        if ~all(matched) || numel(unique(sourceArrivals.cell_id)) ~= height(sourceArrivals)
            error('Expected one arrival per active cell for epicenter %s.', scenario.epicenter);
        end

        counts = [cells.expected_deaths, cells.expected_injuries];
        onset_s = sourceArrivals.s_arrival_s(index);
        delayed = casualty_accumulation(elapsed_s, onset_s, scenario.duration_s, counts);
        control = casualty_accumulation(elapsed_s, zeros(size(onset_s)), scenario.duration_s, counts);

        finalCounts = [results(i).totD, results(i).totI];
        finalError = max(abs([delayed(end,:); control(end,:)] - finalCounts), [], 'all');
        C = add_check(C, ['CT01_' char(scenario.id)], 'Both timeline endpoints match scenario totals', ...
            finalError, 0, tolerance, passfail(finalError, 0, tolerance));
        curves = [delayed, control];
        beforeArrival = elapsed_s <= min(onset_s);
        valid = all(delayed(beforeArrival,:) == 0, 'all') && all(curves(1,:) == 0) && ...
            all(diff(curves) >= -tolerance, 'all') && all(delayed <= control + tolerance, 'all');
        C = add_check(C, ['CT02_' char(scenario.id)], 'Curves start at zero, accumulate, and respect arrival delays', ...
            double(valid), 1, 0, passfail(double(valid), 1, 0));

        nTimes = numel(elapsed_s);
        timelines{i} = table(repmat(string(scenario.id), nTimes, 1), ...
            repmat(string(scenario.epicenter), nTimes, 1), elapsed_s, ...
            delayed(:,1), delayed(:,2), control(:,1), control(:,2), ...
            'VariableNames', {'scenario','epicenter_id','elapsed_time_s', ...
            'expected_deaths_s_wave','expected_injuries_s_wave', ...
            'expected_deaths_simultaneous','expected_injuries_simultaneous'});
    end

    writetable(vertcat(timelines{:}), fullfile(outd, 'casualty_timeline.csv'));
    plot_casualty_timeline(scenarios, timelines, outd);
end

function plot_casualty_timeline(scenarios, timelines, outd)
    official = find(startsWith(string({scenarios.role}), "official"));
    maxDeaths = max(cellfun(@(data) data.expected_deaths_s_wave(end), timelines(official)));
    fig = figure('Visible','off', 'Color','w', 'Position',[0 0 1350 510]);
    for j = 1:numel(official)
        data = timelines{official(j)};
        ax = subplot(1, numel(official), j);
        plot(ax, data.elapsed_time_s, data.expected_deaths_s_wave, '-', 'Color',[0 0.35 0.65], 'LineWidth',2);
        hold(ax, 'on');
        plot(ax, data.elapsed_time_s, data.expected_deaths_simultaneous, '--', 'Color',[0.7 0.27 0.08], 'LineWidth',2);
        title(ax, scenarios(official(j)).id, 'Interpreter','none');
        xlabel(ax, 'Seconds after origin');
        ylabel(ax, 'Cumulative expected deaths');
        ylim(ax, [0, max(1, 1.05 * maxDeaths)]);
        grid(ax, 'on');
        legend(ax, {'S-wave onset','Simultaneous control'}, 'Location','southeast', ...
            'Color','w', 'TextColor','k');
    end
    sgtitle('Casualty timing sensitivity with uniform accumulation during shaking', 'Color','k');
    export_fig(fig, fullfile(outd, 'casualty_timeline'));
    close(fig);
end
