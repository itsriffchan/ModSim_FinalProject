function [p_heavy, p_mod_plus, p_moderate, p_below] = fragility_yamaguchi(pgv_cm_s, lam_h, zeta_h, lam_m, zeta_m)
%FRAGILITY_YAMAGUCHI  Yamaguchi & Yamazaki (2000) Eq. (1): P = Phi((ln v - lambda)/zeta).
%   PGV in cm/s. P(0) = 0. Mutually exclusive states: heavy, moderate-only, below-moderate.
%   Requires 0 <= p_heavy <= p_mod_plus <= 1.

    pgv_cm_s = pgv_cm_s(:);
    n = numel(pgv_cm_s);
    p_heavy = zeros(n, 1);
    p_mod_plus = zeros(n, 1);
    pos = pgv_cm_s > 0;
    p_heavy(pos)    = phi_standard_normal((log(pgv_cm_s(pos)) - lam_h) ./ zeta_h);
    p_mod_plus(pos) = phi_standard_normal((log(pgv_cm_s(pos)) - lam_m) ./ zeta_m);
    % Numerical guard: enforce bookkeeping inequalities
    p_heavy    = min(max(p_heavy, 0), 1);
    p_mod_plus = min(max(p_mod_plus, p_heavy), 1);
    p_moderate = p_mod_plus - p_heavy;
    p_below    = 1 - p_mod_plus;
end
