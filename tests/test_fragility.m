function C = test_fragility(cfg, C)
%TEST_FRAGILITY  Yamaguchi & Yamazaki (2000) Eq. (1) implementation checks.
    lam_h = 5.71; z_h = 0.849; lam_m = 5.11; z_m = 0.798;
    target = 0.0965726;
    if isfield(cfg, 'checks') && isfield(cfg.checks, 'expected_p_heavy_pgv100')
        target = cfg.checks.expected_p_heavy_pgv100;
    end
    tol = 1e-7;
    if isfield(cfg, 'checks') && isfield(cfg.checks, 'p_heavy_pgv100_tol')
        tol = cfg.checks.p_heavy_pgv100_tol;
    end
    [ph, pmp, pmo, pbl] = fragility_yamaguchi(100, lam_h, z_h, lam_m, z_m);
    C = add_check(C, 'F01', 'P_heavy(PGV=100 cm/s) = 0.0965726', ph, target, tol, passfail(ph, target, tol));
    [p0, ~, ~, pb0] = fragility_yamaguchi(0, lam_h, z_h, lam_m, z_m);
    C = add_check(C, 'F02', 'P_heavy(PGV=0) = 0', p0, 0, 0, passfail(p0, 0, 0));
    C = add_check(C, 'F03', 'P_below(PGV=0) = 1', pb0, 1, 0, passfail(pb0, 1, 0));
    [pMed, ~, ~, ~] = fragility_yamaguchi(exp(lam_h), lam_h, z_h, lam_m, z_m);
    C = add_check(C, 'F04', 'P_heavy(exp(lambda)) = 0.5', pMed, 0.5, 1e-12, passfail(pMed, 0.5, 1e-12));
    % Exclusive states and bounds, including a vector input
    pgv = [0; 10; 50; 100; 200; 500];
    [phv, pmpv, pmov, pblv] = fragility_yamaguchi(pgv, lam_h, z_h, lam_m, z_m);
    sumv = phv + pmov + pblv;
    ok = all(phv>=0 & pmov>=0 & pblv>=0) && all(abs(sumv-1)<1e-12) && all(pmpv>=phv);
    C = add_check(C, 'F05', 'Exclusive states sum to 1 and stay in [0,1]', ...
        double(ok), 1, 0, passfail(double(ok), 1, 0));
    % Monotone in PGV
    C = add_check(C, 'F06', 'P_heavy is non-decreasing in PGV', ...
        double(all(diff(phv)>=-1e-15)), 1, 0, passfail(double(all(diff(phv)>=-1e-15)), 1, 0));
    fprintf('  P_heavy(100)=%.10f  P_heavy(e^l)=%.10f  state-sum max-err=%.2e\n', ...
        ph, pMed, max(abs(sumv-1)));
end
