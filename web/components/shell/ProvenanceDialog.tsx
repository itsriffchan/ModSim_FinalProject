'use client';

import { normalizeScenarios } from '@/lib/payload/load';
import { useExplorerStore } from '@/lib/store/explorer-store';

interface ProvenanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProvenanceDialog({ open, onOpenChange }: ProvenanceDialogProps) {
  const payload = useExplorerStore((s) => s.payload);

  if (!open) return null;

  const body = payload
    ? {
        schema_version: payload.schema_version,
        settings: normalizeScenarios(payload).map((s) => s.settings),
        provenance: payload.provenance,
        crs: payload.crs,
      }
    : { error: 'Payload not loaded' };

  return (
    <div
      className="explorer-dialog-backdrop"
      role="presentation"
      onClick={() => onOpenChange(false)}
    >
      <dialog
        open
        className="explorer-dialog"
        aria-labelledby="provenance-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-[var(--shell-line)] pb-3 mb-3">
          <div>
            <h2 id="provenance-title" className="text-lg font-semibold text-[var(--shell-ink)]">
              Settings &amp; provenance
            </h2>
            <p className="text-sm text-[var(--shell-muted)] mt-1">
              Saved export metadata (display only).
            </p>
          </div>
          <button
            type="button"
            className="explorer-btn-secondary"
            onClick={() => onOpenChange(false)}
          >
            Close
          </button>
        </header>
        <pre className="explorer-pre">{JSON.stringify(body, null, 2)}</pre>
      </dialog>
    </div>
  );
}