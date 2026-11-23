'use client';

/** North arrow and the locked-camera note. Zoom gestures are disabled. */

export function LockedMapChrome({
  onResetView,
  mode = 'region',
  className = '',
}: {
  onResetView?: () => void;
  mode?: 'region' | 'city' | 'compare';
  className?: string;
}) {
  if (mode === 'compare') {
    return (
      <div className={`explorer-locked-map-chrome ${className}`}>
        <div className="explorer-north-arrow" aria-hidden title="North">
          <span className="explorer-north-arrow-label">N</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`explorer-locked-map-chrome ${className}`}>
      <div className="explorer-north-arrow" aria-hidden title="North">
        <span className="explorer-north-arrow-label">N</span>
      </div>
      <aside className="explorer-locked-map-nav" aria-label="How to navigate the map">
        <p className="explorer-map-nav-title">Navigate</p>
        <ul>
          <li>Drag — pan inside this frame</li>
          <li>
            {mode === 'region'
              ? 'LGU seals — the only zoom, into that city'
              : 'City list — frame the selected LGU'}
          </li>
          {onResetView ? (
            <li>
              <button type="button" className="explorer-map-reset-link" onClick={onResetView}>
                Reset view
              </button>
              {mode === 'region' ? ' — whole National Capital Region' : ' — fit this city again'}
            </li>
          ) : null}
        </ul>
        <p className="explorer-locked-map-note">
          Locked low angle (62°), north-up. Scroll and pinch zoom are off. Playback keeps this
          frame and spreads the probability fill. This view does not preserve equal screen scale.
        </p>
      </aside>
    </div>
  );
}
