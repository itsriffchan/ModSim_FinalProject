function C = run_unit_tests(cfg, C)
%RUN_UNIT_TESTS  Fast checks of geometry, UTM, fragility, and BSSA14.
    C = test_geo_utm51n(cfg, C);
    C = test_geom_synthetic(cfg, C);
    C = test_fragility(cfg, C);
    C = test_bssa14(cfg, C);
end
