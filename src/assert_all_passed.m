function assert_all_passed(C)
    nFail = sum(strcmp({C.status}, 'FAIL'));
    if nFail > 0
        error('ModSim:ChecksFailed', '%d check(s) FAILED. See results/*checks.csv.', nFail);
    end
end
