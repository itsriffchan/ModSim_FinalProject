function C = test_bssa14(cfg, C)
%TEST_BSSA14  Median PGV vs an independent implementation of BSSA14 Eqs. (1)-(8).
%   Reference values are from a direct evaluation of Boore et al. (2014)
%   with OpenQuake electronic-supplement coefficients (strike-slip, Dc3=0).
    proc = fullfile(cfg.repoRoot, 'data', 'processed', 'bssa14_coefficients.csv');
    coeff = load_bssa14_coeff(proc);
    Mw = 7.2;

    % Vs30 = 360 m/s (default assumed site)
    [g0, pga0] = gm_bssa14_pgv(0, Mw, 360, coeff);
    [g10, ~]  = gm_bssa14_pgv(10, Mw, 360, coeff);
    [g20, ~]  = gm_bssa14_pgv(20, Mw, 360, coeff);
    C = add_check(C, 'B01', 'BSSA14 PGV(M7.2, Rjb=0, Vs30=360) = 77.112769 cm/s', ...
        g0, 77.112769, 0.001, passfail(g0, 77.112769, 0.001));
    C = add_check(C, 'B02', 'BSSA14 PGV(M7.2, Rjb=10, Vs30=360) = 41.746428 cm/s', ...
        g10, 41.746428, 0.001, passfail(g10, 41.746428, 0.001));
    C = add_check(C, 'B03', 'BSSA14 PGV decreases 0 -> 10 -> 20 km', ...
        double(g0 > g10 && g10 > g20), 1, 0, passfail(double(g0>g10 && g10>g20), 1, 0));
    C = add_check(C, 'B04', 'BSSA14 PGA_rock (Rjb=0) = 0.471245 g', ...
        pga0, 0.471245, 0.0001, passfail(pga0, 0.471245, 0.0001));

    % Vs30 = 760 m/s (Vref, linear site, no nonlinear amplification)
    [gR0, ~] = gm_bssa14_pgv(0, Mw, 760, coeff);
    [gR10, ~] = gm_bssa14_pgv(10, Mw, 760, coeff);
    C = add_check(C, 'B05', 'BSSA14 PGV(M7.2, Rjb=0, Vs30=760) = 48.711571 cm/s', ...
        gR0, 48.711571, 0.001, passfail(gR0, 48.711571, 0.001));
    C = add_check(C, 'B06', 'BSSA14 PGV(M7.2, Rjb=10, Vs30=760) = 25.209116 cm/s', ...
        gR10, 25.209116, 0.001, passfail(gR10, 25.209116, 0.001));

    % Softer site produces higher PGV
    [gS0, ~] = gm_bssa14_pgv(0, Mw, 250, coeff);
    C = add_check(C, 'B07', 'Softer site (Vs30=250) PGV > default (360) at Rjb=0', ...
        double(gS0 > g0), 1, 0, passfail(double(gS0 > g0), 1, 0));
    C = add_check(C, 'B08', 'BSSA14 PGV(M7.2, Rjb=0, Vs30=250) = 80.227326 cm/s', ...
        gS0, 80.227326, 0.001, passfail(gS0, 80.227326, 0.001));

    % Vectorised Rjb
    gv = gm_bssa14_pgv([0; 10; 20], Mw, 360, coeff);
    C = add_check(C, 'B09', 'Vectorised BSSA14 matches scalar calls', ...
        max(abs(gv - [g0; g10; g20])), 0, 1e-12, passfail(max(abs(gv-[g0;g10;g20])), 0, 1e-12));

    fprintf('  PGV M7.2 Vs30=360: Rjb0=%.4f  Rjb10=%.4f  Rjb20=%.4f cm/s\n', g0, g10, g20);
end
