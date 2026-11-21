'use client';

/** North arrow + pan/zoom/reset note (no distance scale on locked low camera). */

export function LockedMapChrome({
  onResetView,
  className = '',
}: {
  onResetView?: () => void;
  className?: string;
}) {
  return (
    <div className={`explorer-locked-map-chrome ${className}`}>
      <div className="explorer-north-arrow" aria-hidden title="North">
        <span className="explorer-north-arrow-label">N</span>
      </div>
      <aside className="explorer-locked-map-nav" aria-label="How to navigate the map">
        <p className="explorer-map-nav-title">Navigate</p>
        <ul>
          <li>Drag — pan</li>
          <li>Scroll — zoom</li>
          {onResetView ? (
            <li>
              <button type="button" className="explorer-map-reset-link" onClick={onResetView}>
                Reset view
              </button>
              {' '}
              — default frame at locked low angle
            </li>
          ) : (
            <li>Reset view restores the default frame at the locked low angle</li>
          )}
        </ul>
        <p className="explorer-locked-map-note">
          Locked low angle (62°), north-up. This view does not preserve equal screen scale.
        </p>
      </aside>
    </div>
  );
}