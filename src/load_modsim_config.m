function cfg = load_modsim_config(repoRoot)
    p = fullfile(repoRoot, 'config', 'modsim_config.json');
    txt = fileread(p);
    cfg = jsondecode(txt);
    cfg.repoRoot = repoRoot;
    if ~isfield(cfg.checks, 'expected_ncr_population')
        error('config missing checks.expected_ncr_population');
    end
end
