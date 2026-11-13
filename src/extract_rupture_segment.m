function [sx, sy, length_km] = extract_rupture_segment(vx, vy, ex, ey, length_km_target)
%EXTRACT_RUPTURE_SEGMENT  Contiguous subset of a polyline, centred on (ex,ey).
%   Walks cumulative length, takes length_km_target/2 on each side, and
%   extends the unclipped side if an end is hit, to keep the target length
%   when the trace is long enough.

    vx = vx(:); vy = vy(:);
    seg = sqrt(diff(vx).^2 + diff(vy).^2);
    cum = [0; cumsum(seg)];
    % nearest location of the epicenter along the line (projected)
    [~, ~, s0] = project_on_line(ex, ey, vx, vy, cum);
    half = length_km_target * 1000 / 2;
    a = max(0, s0 - half);
    b = min(cum(end), s0 + half);
    need = length_km_target * 1000 - (b - a);
    if need > 0
        a = max(0, a - need);
        b = min(cum(end), b + need);
    end
    sx = []; sy = [];
    % include interpolated endpoints and all vertices in (a,b)
    [xA, yA] = point_at_s(vx, vy, cum, a);
    [xB, yB] = point_at_s(vx, vy, cum, b);
    sx = xA; sy = yA;
    for i = 1:numel(cum)
        if cum(i) > a + 1e-6 && cum(i) < b - 1e-6
            sx(end+1,1) = vx(i); %#ok<AGROW>
            sy(end+1,1) = vy(i); %#ok<AGROW>
        end
    end
    sx(end+1,1) = xB; sy(end+1,1) = yB;
    length_km = sum(sqrt(diff(sx).^2 + diff(sy).^2)) / 1000;
end

function [x, y, s] = project_on_line(px, py, vx, vy, cum)
    best = inf; s = 0; x = vx(1); y = vy(1);
    for k = 1:numel(vx)-1
        dx = vx(k+1) - vx(k);
        dy = vy(k+1) - vy(k);
        L2 = dx*dx + dy*dy;
        if L2 == 0
            t = 0;
        else
            t = ((px - vx(k))*dx + (py - vy(k))*dy) / L2;
            t = min(max(t, 0), 1);
        end
        qx = vx(k) + t*dx; qy = vy(k) + t*dy;
        d2 = (px-qx)^2 + (py-qy)^2;
        if d2 < best
            best = d2; x = qx; y = qy; s = cum(k) + t*sqrt(L2);
        end
    end
end

function [x, y] = point_at_s(vx, vy, cum, s)
    s = min(max(s, 0), cum(end));
    k = find(cum >= s, 1, 'first');
    if k == 1
        x = vx(1); y = vy(1); return
    end
    ds = cum(k) - cum(k-1);
    if ds == 0
        x = vx(k); y = vy(k); return
    end
    t = (s - cum(k-1)) / ds;
    x = vx(k-1) + t*(vx(k)-vx(k-1));
    y = vy(k-1) + t*(vy(k)-vy(k-1));
end
