function cleanup = scoped_graphics_defaults()
%SCOPED_GRAPHICS_DEFAULTS Consistent headless figures; restore caller settings.
    names={'DefaultFigureVisible','DefaultAxesColor','DefaultAxesXColor', ...
        'DefaultAxesYColor','DefaultAxesZColor','DefaultAxesGridColor','DefaultTextColor'};
    previous=get(groot,names);
    cleanup=onCleanup(@() set(groot,names,previous));
    values={'off','w','k','k','k',[0.65 0.65 0.65],'k'};
    set(groot,names,values);
end
