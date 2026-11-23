function cumulative = casualty_accumulation(elapsed_s, onset_s, duration_s, final_counts)
%CASUALTY_ACCUMULATION  Spread each cell's expected counts over its shaking window.
%   final_counts has one row per cell and one column per casualty outcome.

    validateattributes(duration_s, {'numeric'}, {'real','finite','scalar','positive'});
    fraction = min(max((elapsed_s(:) - onset_s(:)') ./ duration_s, 0), 1);
    cumulative = fraction * final_counts;
end
