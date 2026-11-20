function plot_shaking_timeline(cfg, outd)
%PLOT_SHAKING_TIMELINE  Plot an assumed duration-only shaking profile.
%
% This is a presentation aid, not a wave-arrival or ground-motion model.
% Separate simultaneous-onset control; never drives damage or casualties.

    scenarios = cfg.scenarios;
    if isempty(scenarios)
        error('No official scenarios are configured for the shaking timeline.');
    end

    durations = zeros(numel(scenarios), 1);
    for i = 1:numel(scenarios)
        durations(i) = scenarios(i).duration_s;
        if ~isfinite(durations(i)) || durations(i) <= 0
            error('Scenario duration must be positive and finite.');
        end
    end

    tEnd = max(durations) + 5;
    times = linspace(0, tEnd, 101)';
    rise = min(2, min(durations) / 4);
    fall = rise;
    fig = figure('Visible', 'off', 'Color', 'w', 'Position', [0 0 1200 700]);
    allTimes = [];
    allNames = string.empty(0, 1);
    allDurations = [];
    allIntensities = [];
    hold on;

    colors = lines(numel(scenarios));
    for i = 1:numel(scenarios)
        d = durations(i);
        intensity = zeros(size(times));
        up = times >= 0 & times < rise;
        steady = times >= rise & times < max(rise, d - fall);
        down = times >= max(rise, d - fall) & times < d;
        intensity(up) = times(up) / rise;
        intensity(steady) = 1;
        intensity(down) = max(0, (d - times(down)) / fall);

        plot(times, intensity, 'LineWidth', 2, 'Color', colors(i, :));
        xline(d, '--', 'Color', colors(i, :), 'HandleVisibility', 'off');

        allTimes = [allTimes; times]; %#ok<AGROW>
        allNames = [allNames; repmat(string(scenarios(i).id), numel(times), 1)]; %#ok<AGROW>
        allDurations = [allDurations; repmat(d, numel(times), 1)]; %#ok<AGROW>
        allIntensities = [allIntensities; intensity]; %#ok<AGROW>
    end

    grid on;
    ylim([0 1.1]);
    xlabel('Elapsed time (s)');
    ylabel('Assumed normalized shaking intensity');
    title({'SIMULTANEOUS-ONSET CONTROL: assumed shaking-over-time profiles', ...
        'Presentation aid: common start, ramp-up, sustained shaking, and duration-based stop'}, ...
        'Interpreter', 'none');
    labels = cell(numel(scenarios), 1);
    for i = 1:numel(scenarios)
        labels{i} = sprintf('%s (%g s)', char(scenarios(i).id), durations(i));
    end
    legend(labels, 'Location', 'best', 'Interpreter', 'none');

    rows = table(allTimes, allNames, allDurations, allIntensities, ...
        'VariableNames', {'elapsed_time_s','scenario','duration_s', ...
        'normalized_shaking_intensity'});
    writetable(rows, fullfile(outd, 'shaking_over_time.csv'));
    export_fig(fig, fullfile(outd, 'shaking_over_time'));
    close(fig);
end
