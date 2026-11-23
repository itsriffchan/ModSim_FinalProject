function cfg = presentation_mode(cfg, mode)
%PRESENTATION_MODE Resolve a runner override, including legacy saved configs.
    if nargin<2 || strlength(string(mode))==0
        mode='viewer';
        if isfield(cfg,'presentation'), mode=cfg.presentation.mode; end
    end
    mode=validatestring(mode,{'viewer','video'});
    cfg.presentation.mode=mode;
end
