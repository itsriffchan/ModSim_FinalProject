function owner = assign_wp_owner(px, py, LGU)
%ASSIGN_WP_OWNER  Vectorised inpolygon assignment of points to LGU polygons.
    owner = zeros(numel(px), 1);
    for i = 1:numel(LGU)
        [lx, ly] = boundingbox(LGU(i).pg);
        inb = px >= lx(1) & px <= lx(2) & py >= ly(1) & py <= ly(2);
        if ~any(inb), continue; end
        [xv, yv] = boundary(LGU(i).pg);
        inside = false(size(px));
        inside(inb) = inpolygon(px(inb), py(inb), xv, yv);
        % Do not overwrite a previous owner (should not overlap).
        fresh = inside & (owner == 0);
        owner(fresh) = i;
    end
end
