% Reproduce one published Kobe-region building fragility curve.
% Save this script in your project root and run demo_kobe_fragility.
% Source: Yamaguchi and Yamazaki (2000), 12WCEE paper 2451.
% Equation (1), printed page 4; Table 3, printed page 5.
% https://www.iitk.ac.in/nicee/wcee/article/2451.pdf
% Curve: reinforced concrete (RC), construction period = average,
% damage threshold = heavy, intensity measure = PGV in cm/s.
% This demonstration does not calculate casualties or NCR ground motion.

lambda = 5.71;
zeta = 0.849;

% Positive PGV values use a lognormal cumulative distribution.
% erf/erfc are built-in, so normcdf and the Statistics Toolbox are unnecessary.
PGV_cm_s = (0:1:180)';
P_heavy = zeros(size(PGV_cm_s));
positive = PGV_cm_s > 0;
z = (log(PGV_cm_s(positive)) - lambda) ./ zeta;
P_heavy(positive) = 0.5 .* erfc(-z ./ sqrt(2));

% Basic mathematical checks, independent of any earthquake scenario.
assert(all(isfinite(P_heavy)), 'Probabilities must be finite.');
assert(all(P_heavy >= 0 & P_heavy <= 1), 'Probabilities must be in [0,1].');
assert(all(diff(P_heavy) >= -1e-12), 'Probability must not decrease with PGV.');
assert(P_heavy(1) == 0, 'Zero PGV must have zero modeled heavy damage.');
medianPGV_cm_s = exp(lambda);
zMedian = (log(medianPGV_cm_s) - lambda) / zeta;
pMedian = 0.5 * erfc(-zMedian / sqrt(2));
assert(abs(pMedian - 0.5) < 1e-12, 'Median check failed.');

curveTable = table(PGV_cm_s, P_heavy);

% An assumed input for demonstrating interpretation, not measured NCR data.
examplePGV_cm_s = 100;
exampleBuildings = 1000;
exampleProbability = 0.5 * erfc( ...
    -(log(examplePGV_cm_s) - lambda) / (zeta * sqrt(2)));
expectedHeavyBuildings = exampleBuildings * exampleProbability;
fprintf('Example PGV: %.0f cm/s\n', examplePGV_cm_s);
fprintf('Heavy-damage probability: %.4f (%.2f%%)\n', ...
    exampleProbability, 100 * exampleProbability);
fprintf('Expected heavily damaged buildings out of %d: %.2f\n', ...
    exampleBuildings, expectedHeavyBuildings);
fprintf('This is a building-damage estimate, not a casualty estimate.\n');

fig = figure('Color', 'w');
plot(PGV_cm_s, 100 * P_heavy, 'LineWidth', 2);
set(gca, 'Color', 'w', 'XColor', 'k', 'YColor', 'k', ...
    'GridColor', [0.65 0.65 0.65]);
grid on;
xlabel('Peak ground velocity (cm/s)', 'Color', 'k');
ylabel('Heavy-damage probability (%)', 'Color', 'k');
title({'Kobe-region fragility reproduction', ...
       'Reinforced concrete; construction period: average'}, 'Color', 'k');
xlim([0 180]);
ylim([0 100]);

% Keep generated results beside this script in a results subfolder.
scriptFolder = fileparts(mfilename('fullpath'));
resultsDir = fullfile(scriptFolder, 'results');
if ~exist(resultsDir, 'dir')
    mkdir(resultsDir);
end
writetable(curveTable, fullfile(resultsDir, 'rc_heavy_fragility_curve.csv'));
saveas(fig, fullfile(resultsDir, 'rc_heavy_fragility_curve.png'));

% Retain the relationship's identity with its coefficients.
parameters = table("RC", "average", "heavy", "PGV", "cm/s", ...
    lambda, zeta, 3, ...
    'VariableNames', {'structure_type', 'construction_period', ...
    'damage_threshold', 'intensity_measure', 'intensity_unit', ...
    'lambda', 'zeta', 'source_table'});
writetable(parameters, fullfile(resultsDir, 'fragility_parameters.csv'));
