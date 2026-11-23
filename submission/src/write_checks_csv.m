function write_checks_csv(C, path)
    T = struct2table(C);
    % stringify numeric for a stable CSV
    writetable(T, path);
    nFail = sum(strcmp({C.status}, 'FAIL'));
    nPass = sum(strcmp({C.status}, 'PASS'));
    nSkip = sum(strcmp({C.status}, 'SKIPPED'));
    fprintf('Checks: %d PASS, %d FAIL, %d SKIPPED  (%s)\n', nPass, nFail, nSkip, path);
    if nFail > 0
        for i = 1:numel(C)
            if strcmp(C(i).status, 'FAIL')
                fprintf('  FAIL %s: value=%s expected=%s tol=%s  %s\n', ...
                    C(i).check_id, num2str(C(i).value), num2str(C(i).expected), ...
                    num2str(C(i).tolerance), C(i).description);
            end
        end
    end
end
