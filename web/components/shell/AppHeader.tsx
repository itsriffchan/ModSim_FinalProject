'use client';

import { useState } from 'react';

import { ProvenanceDialog } from '@/components/shell/ProvenanceDialog';

export function AppHeader() {
  const [provenanceOpen, setProvenanceOpen] = useState(false);

  return (
    <>
      <header className="explorer-header">
        <div className="flex flex-col gap-1">
          <span className="explorer-eyebrow">MODELING &amp; SIMULATION</span>
          <h1 className="explorer-title">NCR scenario explorer</h1>
          <p className="text-sm text-[var(--shell-muted)]">
            Metro Manila (NCR) · Earthquake scenario explorer
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {process.env.NODE_ENV !== 'production' && (
            <a
              href="/dev/components"
              className="explorer-tag hidden sm:inline-flex"
            >
              Dev gallery
            </a>
          )}
          <button
            type="button"
            className="explorer-btn-secondary"
            onClick={() => setProvenanceOpen(true)}
          >
            Provenance
          </button>
        </div>
      </header>
      <ProvenanceDialog open={provenanceOpen} onOpenChange={setProvenanceOpen} />
    </>
  );
}