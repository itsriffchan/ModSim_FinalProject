function C = test_wave_arrival_times(C)
%TEST_WAVE_ARRIVAL_TIMES  Check the cell above the focus and a 5-12-13 triangle.

    [distance_km, p_s, s_s] = wave_arrival_times([0; 12], 5, 5, 2.5);
    tol = 1e-12;
    distanceError = max(abs(distance_km - [5; 13]));
    pError = max(abs(p_s - [1; 2.6]));
    sError = max(abs(s_s - [2; 5.2]));
    C = add_check(C, 'W01', 'Synthetic hypocentral distances (km)', ...
        distanceError, 0, tol, passfail(distanceError, 0, tol));
    C = add_check(C, 'W02', 'Synthetic P-wave arrivals (s after origin)', ...
        pError, 0, tol, passfail(pError, 0, tol));
    C = add_check(C, 'W03', 'Synthetic S-wave arrivals (s after origin)', ...
        sError, 0, tol, passfail(sError, 0, tol));
end
