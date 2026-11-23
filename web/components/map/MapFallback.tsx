interface MapFallbackProps {
  message: string;
}

export function MapFallback({ message }: MapFallbackProps) {
  return (
    <div className="explorer-map-fallback" role="alert">
      <h3 className="text-base font-semibold text-[var(--danger-ink)]">
        Map unavailable
      </h3>
      <p className="text-sm mt-2 leading-relaxed">{message}</p>
      <p className="text-xs mt-3 text-[var(--shell-muted)]">
        Enable WebGL / hardware acceleration or open the static PNG and CSV exports from the
        saved run folder.
      </p>
    </div>
  );
}