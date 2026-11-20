function C = test_casualty_accumulation(C)
%TEST_CASUALTY_ACCUMULATION  Two arrivals with overlapping shaking windows.

    counts = [8 16; 4 8];
    computed = casualty_accumulation([0; 1; 2; 3; 5; 7; 8], [1; 3], 4, counts);
    expected = [0; 0; 2; 4; 10; 12; 12] * [1 2];
    value = max(abs(computed - expected), [], 'all');
    tolerance = 1e-12;
    C = add_check(C, 'CT00', 'Two-cell casualty accumulation across staggered arrivals', ...
        value, 0, tolerance, passfail(value, 0, tolerance));
end
