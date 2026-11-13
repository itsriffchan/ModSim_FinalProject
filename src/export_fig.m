function export_fig(fig, stem)
%EXPORT_FIG  PNG (and PDF if possible) without requiring a display.
    png = [stem, '.png'];
    pdf = [stem, '.pdf'];
    try
        exportgraphics(fig, png, 'Resolution', 200);
    catch
        print(fig, png, '-dpng', '-r200');
    end
    try
        exportgraphics(fig, pdf, 'ContentType', 'vector');
    catch
        % PDF is optional
    end
end
