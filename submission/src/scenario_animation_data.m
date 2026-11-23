function data = scenario_animation_data(cfg, result, G)
%SCENARIO_ANIMATION_DATA Local S-wave onset, with simultaneous timing control.
    T=result.Tc; active=T.is_active;
    arrivals=G.waveArrivals(string(G.waveArrivals.epicenter_id)==string(result.scenario.epicenter),:);
    assert(numel(unique(arrivals.cell_id))==height(arrivals),'Duplicate arrival key');
    [found,index]=ismember(T.cell_id(active),arrivals.cell_id);
    assert(all(found),'Missing S-wave arrival');
    data.cell_id=T.cell_id(active);
    data.onset_s=arrivals.s_arrival_s(index);
    data.duration_s=result.duration_s;
    data.horizon_s=ceil(max(data.onset_s+data.duration_s));
    data.times_s=unique([(0:cfg.animation.sample_spacing_s:data.horizon_s)';data.horizon_s]);
    data.final_heavy=T.p_heavy(active);
    data.final_losses=[T.expected_deaths(active),T.expected_injuries(active)];
    [data.progression,data.damage_display,data.cumulative_casualties]=animation_state( ...
        data.times_s,data.onset_s,data.duration_s,data.final_heavy,data.final_losses);
    data.expected_deaths_by_cell=data.progression.*data.final_losses(:,1)';
    data.expected_injuries_by_cell=data.progression.*data.final_losses(:,2)';
    data.simultaneous_control=casualty_accumulation(data.times_s,zeros(size(data.onset_s)), ...
        data.duration_s,data.final_losses);
    data.inactive_cell_id=T.cell_id(~active);
    data.timing=cfg.wave_arrival;
    data.assumption='ASSUMED timing; not a validated rupture or damage-evolution simulation';
    data.map_label='Assumed progression toward final heavy-damage probability';
    data.animation_settings=cfg.animation;
end
