function [pgv_cm_s, pga_rock_g] = gm_bssa14_pgv(Rjb_km, Mw, vs30_mps, coeff)
%GM_BSSA14_PGV  Median RotD50 PGV (cm/s) from Boore et al. (2014) BSSA14.
%   Strike-slip (e1), default region (Dc3 = 0), median (epsilon = 0).
%   Equations (1)-(8) of Boore et al., Earthquake Spectra 30(3), 1057-1085.
%   PGV units are cm/s; PGA on rock (for the nonlinear site term) is in g.
%   The Philippines has no listed regional Dc3; none is applied.
%
%   coeff is a struct with fields pgv and pga, each having e1,e4,e5,e6,Mh,
%   c1,c2,c3,h,Dc3,c,Vc,f4,f5 as in data/processed/bssa14_coefficients.csv.

    Rjb_km = Rjb_km(:);
    Mref = 4.5;
    Rref = 1.0;
    Vref = 760.0;
    f1 = 0.0;
    f3 = 0.1;

    C = coeff.pgv;
    P = coeff.pga;

    fe  = bssa14_FE(Mw, C);
    fp  = bssa14_FP(Rjb_km, Mw, C, Mref, Rref);
    pfe = bssa14_FE(Mw, P);
    pfp = bssa14_FP(Rjb_km, Mw, P, Mref, Rref);
    pga_rock_g = exp(pfe + pfp);

    vs_lin = min(vs30_mps, C.Vc);
    flin = C.c .* log(vs_lin / Vref);
    vs_nl = min(vs30_mps, 760.0);
    f2 = C.f4 .* (exp(C.f5 .* (vs_nl - 360.0)) - exp(C.f5 .* 400.0));
    fnl = f1 + f2 .* log((pga_rock_g + f3) ./ f3);
    pgv_cm_s = exp(fe + fp + flin + fnl);
end

function fe = bssa14_FE(Mw, C)
    d = Mw - C.Mh;
    if Mw <= C.Mh
        magterm = C.e4 * d + C.e5 * d^2;
    else
        magterm = C.e6 * d;
    end
    fe = C.e1 + magterm;   % strike-slip
end

function fp = bssa14_FP(Rjb, Mw, C, Mref, Rref)
    R = sqrt(Rjb.^2 + C.h.^2);
    fp = (C.c1 + C.c2 .* (Mw - Mref)) .* log(R ./ Rref) ...
        + (C.c3 + C.Dc3) .* (R - Rref);
end
