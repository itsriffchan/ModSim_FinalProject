'use client';

export function AppHeader() {
  return (
    <header className="explorer-header">
      <div className="flex flex-col gap-1">
        <span className="explorer-eyebrow">MODELING &amp; SIMULATION</span>
        <h1 className="explorer-title">NCR scenario explorer</h1>
        <p className="text-sm text-[var(--shell-muted)]">
          Metro Manila (NCR) · Earthquake scenario explorer
        </p>
      </div>
    </header>
  );
}