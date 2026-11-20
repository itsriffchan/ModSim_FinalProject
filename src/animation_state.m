function [fraction, damage, cumulative] = animation_state(t, onset, duration, heavy, losses)
%ANIMATION_STATE Reveal final arrays directly; never recalculate PGV or damage.
    validateattributes(duration,{'numeric'},{'scalar','real','finite','positive'});
    assert(all(isfinite(t(:))) && all(isfinite(onset(:))) && all(onset(:)>=0),'Invalid timing input');
    assert(numel(onset)==numel(heavy) && size(losses,1)==numel(onset),'Cell array sizes differ');
    fraction=min(max((t(:)-onset(:)')./duration,0),1);
    damage=fraction.*heavy(:)';
    cumulative=fraction*losses;
end
