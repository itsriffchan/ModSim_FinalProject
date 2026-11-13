function d_m = geom_point_polyline_distance(px, py, vx, vy)
%GEOM_POINT_POLYLINE_DISTANCE  Min distance (m) from points to polyline segments.
%   vx, vy are vertex coordinates (open or closed). Vectorised over points.

    px = px(:); py = py(:);
    n = numel(px);
    d2 = inf(n, 1);
    for k = 1:numel(vx)-1
        x1 = vx(k);  y1 = vy(k);
        x2 = vx(k+1); y2 = vy(k+1);
        dx = x2 - x1;
        dy = y2 - y1;
        L2 = dx*dx + dy*dy;
        if L2 == 0
            t = zeros(n, 1);
        else
            t = ((px - x1) .* dx + (py - y1) .* dy) ./ L2;
            t = min(max(t, 0), 1);
        end
        qx = x1 + t .* dx;
        qy = y1 + t .* dy;
        d2 = min(d2, (px - qx).^2 + (py - qy).^2);
    end
    d_m = sqrt(d2);
end
