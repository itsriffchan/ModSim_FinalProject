function C = add_check(C, id, desc, value, expected, tol, status)
    n = numel(C) + 1;
    C(n).check_id = char(string(id));
    C(n).description = char(string(desc));
    if isnumeric(value) && isscalar(value)
        C(n).value = value;
    else
        C(n).value = value;
    end
    C(n).expected = expected;
    C(n).tolerance = tol;
    C(n).status = char(string(status));
end
