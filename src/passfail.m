function status = passfail(value, expected, tol)
    if ~isnumeric(value) || ~isnumeric(expected) || isnan(value) || isnan(expected)
        status = 'FAIL';
        return
    end
    if abs(double(value) - double(expected)) <= double(tol)
        status = 'PASS';
    else
        status = 'FAIL';
    end
end
