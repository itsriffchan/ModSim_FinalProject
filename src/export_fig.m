function export_fig(fig, stem)
%EXPORT_FIG  PNG (and PDF if possible) without requiring a display.
    png = [stem, '.png'];
    pdf = [stem, '.pdf'];
    try
        exportgraphics(fig, png, 'Resolution', 300);
    catch
        print(fig, png, '-dpng', '-r300');
    end
    try
        exportgraphics(fig, pdf, 'ContentType', 'vector');
    catch
        % PDF is optional
    end
end
