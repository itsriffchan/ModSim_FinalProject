function p = phi_standard_normal(z)
%PHI_STANDARD_NORMAL  Standard normal CDF via built-in erfc (no toolbox).
    p = 0.5 .* erfc(-z ./ sqrt(2));
end
