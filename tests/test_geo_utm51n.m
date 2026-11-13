function C = test_geo_utm51n(cfg, C)
%TEST_GEO_UTM51N  Forward UTM 51N vs pyproj test vectors (limit 0.05 m).
    tests = [
        123.0,      0.0,  500000.000,       0.000
        121.07011, 14.58, 292088.421, 1612754.668
        121.04696, 14.40, 289423.626, 1592857.845
        121.0,      14.6, 284552.125, 1615033.119
        121.1,      14.4, 295144.264, 1592809.991
    ];
    maxErr = 0;
    for i = 1:size(tests,1)
        [x, y] = geo_utm51n_forward(tests(i,1), tests(i,2));
        maxErr = max(maxErr, max(abs(x-tests(i,3)), abs(y-tests(i,4))));
    end
    tol = 0.05;
    if isfield(cfg, 'checks') && isfield(cfg.checks, 'utm_test_abs_tol_m')
        tol = cfg.checks.utm_test_abs_tol_m;
    end
    C = add_check(C, 'U01', 'UTM 51N Snyder series vs pyproj (max abs error, m)', ...
        maxErr, 0, tol, passfail(maxErr, 0, tol));
    % Vectorised call
    [xv, yv] = geo_utm51n_forward(tests(:,1), tests(:,2));
    maxErrV = max([abs(xv-tests(:,3)); abs(yv-tests(:,4))]);
    C = add_check(C, 'U02', 'UTM 51N vectorised call agrees with scalars (m)', ...
        maxErrV, maxErr, 1e-12, passfail(maxErrV, maxErr, 1e-12));
    fprintf('  UTM max abs error = %.6e m (tol %.2f m)\n', maxErr, tol);
end
