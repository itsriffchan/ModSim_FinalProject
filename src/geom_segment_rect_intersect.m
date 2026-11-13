function tf = geom_segment_rect_intersect(x1, y1, x2, y2, xmin, ymin, xmax, ymax)
%GEOM_SEGMENT_RECT_INTERSECT  True if any polyline segment meets the closed rectangle.
%   Liang-Barsky / endpoint-inside + edge tests, vectorised over segments.

    n = numel(x1);
    tf = false;
    for k = 1:n
        if segment_hits(x1(k), y1(k), x2(k), y2(k), xmin, ymin, xmax, ymax)
            tf = true;
            return
        end
    end
end

function hit = segment_hits(ax, ay, bx, by, xmin, ymin, xmax, ymax)
    % Endpoint inside (inclusive)
    if (ax >= xmin && ax <= xmax && ay >= ymin && ay <= ymax) || ...
       (bx >= xmin && bx <= xmax && by >= ymin && by <= ymax)
        hit = true; return
    end
    % Liang-Barsky
    dx = bx - ax; dy = by - ay;
    p = [-dx, dx, -dy, dy];
    q = [ax - xmin, xmax - ax, ay - ymin, ymax - ay];
    u1 = 0; u2 = 1;
    for i = 1:4
        if p(i) == 0
            if q(i) < 0
                hit = false; return
            end
        else
            r = q(i) / p(i);
            if p(i) < 0
                u1 = max(u1, r);
            else
                u2 = min(u2, r);
            end
            if u1 > u2
                hit = false; return
            end
        end
    end
    hit = true;
end
