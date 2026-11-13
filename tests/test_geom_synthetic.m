function C = test_geom_synthetic(cfg, C) %#ok<INUSD>
%TEST_GEOM_SYNTHETIC  3x3 grid: distances, crossings, and rupture length.

    cs = 500;
    x0 = 0; y0 = 0;
    % Vertical fault through the middle of the centre column (x = 750)
    vx = [750; 750]; vy = [-100; 1600];

    nCross = 0;
    df = nan(3,3);
    for r = 0:2
        for c = 0:2
            x1 = x0 + c*cs; y1 = y0 + r*cs;
            xc = x1 + cs/2; yc = y1 + cs/2;
            df(r+1,c+1) = geom_point_polyline_distance(xc, yc, vx, vy);
            hit = geom_segment_rect_intersect(vx(1:end-1), vy(1:end-1), vx(2:end), vy(2:end), ...
                x1, y1, x1+cs, y1+cs);
            if hit, nCross = nCross + 1; end
        end
    end
    % Centre column (c=1, x=500..1000) is crossed: 3 cells. Others are not.
    C = add_check(C, 'T01', 'Synthetic 3x3: exactly 3 cells crossed by vertical fault at x=750', ...
        nCross, 3, 0, passfail(nCross, 3, 0));
    % Centre cell centre is at (750, 750), on the line: distance 0
    C = add_check(C, 'T02', 'Synthetic 3x3: centre-cell distance to fault is 0', ...
        df(2,2), 0, 1e-9, passfail(df(2,2), 0, 1e-9));
    % Left-column centres at x=250: distance 500 m
    C = add_check(C, 'T03', 'Synthetic 3x3: left-column distance is 500 m', ...
        df(2,1), 500, 1e-9, passfail(df(2,1), 500, 1e-9));
    C = add_check(C, 'T04', 'Synthetic 3x3: right-column distance is 500 m', ...
        df(2,3), 500, 1e-9, passfail(df(2,3), 500, 1e-9));

    % Lipschitz: neighbour |df| <= cell size
    lip = max([abs(df(2,2)-df(2,1)), abs(df(2,2)-df(2,3)), abs(df(2,2)-df(1,2)), abs(df(2,2)-df(3,2))]);
    C = add_check(C, 'T05', 'Synthetic 3x3: neighbour Lipschitz <= 500 m', ...
        lip, 500, 1e-9, passfail(lip, 500, 1e-6));

    % Rupture extraction: a 1 km target on a 2 km line, centred, length ~ 1 km
    [sx, sy, L] = extract_rupture_segment(vx, vy, 750, 750, 1.0);
    C = add_check(C, 'T06', 'Rupture segment length is 1.00 km on a long enough trace', ...
        L, 1.0, 0.001, passfail(L, 1.0, 0.001));
    % The segment is vertical at x=750
    C = add_check(C, 'T07', 'Extracted rupture stays on the trace (x=750)', ...
        max(abs(sx-750)), 0, 1e-6, passfail(max(abs(sx-750)), 0, 1e-6));
    fprintf('  synthetic 3x3 crossings=%d, centre df=%.3f m, rupture=%.4f km\n', nCross, df(2,2), L);
end
