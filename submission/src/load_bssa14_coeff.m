function coeff = load_bssa14_coeff(csvPath)
    T = readtable(csvPath, 'TextType', 'string');
    coeff = struct();
    for i = 1:height(T)
        key = lower(strtrim(char(T.imt(i))));
        s = struct();
        fn = T.Properties.VariableNames;
        for k = 1:numel(fn)
            if strcmp(fn{k}, 'imt') || strcmp(fn{k}, 'source'), continue; end
            s.(fn{k}) = T{i, fn{k}};
        end
        coeff.(key) = s;
    end
end
