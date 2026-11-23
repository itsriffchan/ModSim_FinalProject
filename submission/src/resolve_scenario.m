function sc = resolve_scenario(cfg, id)
%RESOLVE_SCENARIO Bind primary identity and duration treatment centrally.
    assert(isequal(sort(string({cfg.scenarios.id})), ["A" "B" "C"]), ...
        'Primary scenarios must be exactly A, B, C');
    idx=find(strcmp({cfg.scenarios.id},char(id)));
    assert(isscalar(idx), 'Unknown or duplicate primary scenario ID');
    sc=cfg.scenarios(idx);
    e=find(strcmp({cfg.epicenters.id},sc.epicenter));
    assert(isscalar(e), 'Unknown or duplicate epicenter ID');
    sc.epicenter_spec=cfg.epicenters(e);
    assert(strcmp(sc.distance_model,'finite_rupture'), 'Primary cases require finite rupture');
    sc.alpha=cfg.duration.alpha;
    validateattributes(sc.duration_s,{'numeric'},{'scalar','finite','positive'});
    validateattributes(sc.alpha,{'numeric'},{'scalar','finite','nonnegative'});
    assert(cfg.duration.reference_s==20,'Primary reference duration must be 20 s');
    if strcmp(sc.id,'A'), sc.alpha=0; end
    expected_epi='baseline'; expected_duration=40;
    if strcmp(sc.id,'A'), expected_duration=cfg.duration.reference_s; end
    if strcmp(sc.id,'C'), expected_epi='alternative'; end
    assert(strcmp(sc.epicenter,expected_epi) && sc.duration_s==expected_duration, ...
        'Invalid primary scenario binding');
end
