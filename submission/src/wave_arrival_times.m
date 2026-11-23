function [distance_km, p_arrival_s, s_arrival_s] = wave_arrival_times(epicentral_km, depth_km, p_speed_km_s, s_speed_km_s)
%WAVE_ARRIVAL_TIMES  Straight-line travel from a point hypocenter to the surface.
%   Distances are in km. Arrivals are seconds after the earthquake starts.

    validateattributes(epicentral_km, {'numeric'}, {'real','finite','vector','nonnegative'});
    validateattributes(depth_km, {'numeric'}, {'real','finite','scalar','positive'});
    validateattributes(p_speed_km_s, {'numeric'}, {'real','finite','scalar','positive'});
    validateattributes(s_speed_km_s, {'numeric'}, {'real','finite','scalar','positive','<',p_speed_km_s});

    distance_km = hypot(epicentral_km, depth_km);
    p_arrival_s = distance_km ./ p_speed_km_s;
    s_arrival_s = distance_km ./ s_speed_km_s;
end
