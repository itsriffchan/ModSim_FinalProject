file = "data/raw/jma_kobe/H1171931.csv";
lines = readlines(file);
disp(lines(1:7));

acceleration = readmatrix(file, "NumHeaderLines", 7);

% Read acceleration values, skipping the seven metadata lines.
A = readmatrix(file, "NumHeaderLines", 7);
A = A(:, 1:3);  % Ignore trailing empty CSV columns.

% Construct elapsed time from the sampling frequency.
fs = 50;
t = (0:size(A, 1)-1)' / fs;

figure;
plot(t, A);
grid on;
xlabel("Elapsed time (seconds)");
ylabel("Acceleration (cm/s^2)");
legend("North-South", "East-West", "Vertical");
title("1995 Kobe earthquake: JMA Kobe recording");

% Report peak absolute acceleration for each direction.
peakAcceleration = max(abs(A), [], 1);
disp(array2table(peakAcceleration, ...
    'VariableNames', {'NS', 'EW', 'UD'}));