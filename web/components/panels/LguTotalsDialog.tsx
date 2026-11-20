'use client';

import { fmt } from '@/lib/display/format';
import { normalizeScenarios } from '@/lib/payload/load';
import { useExplorerStore } from '@/lib/store/explorer-store';

interface LguTotalsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LguTotalsDialog({ open, onOpenChange }: LguTotalsDialogProps) {
  const payload = useExplorerStore((s) => s.payload);
  const scenarioId = useExplorerStore((s) => s.scenarioId);

  if (!open || !payload) return null;

  const scenarios =
    scenarioId === 'all'
      ? normalizeScenarios(payload)
      : normalizeScenarios(payload).filter((s) => s.id === scenarioId);

  const rows = scenarios[0]?.lgu ?? [];

  return (
    <div
      className="explorer-dialog-backdrop"
      role="presentation"
      onClick={() => onOpenChange(false)}
    >
      <dialog
        open
        className="explorer-dialog explorer-dialog-wide"
        aria-labelledby="lgu-totals-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-[var(--shell-line)] pb-3 mb-3">
          <div>
            <h2 id="lgu-totals-title" className="text-lg font-semibold text-[var(--shell-ink)]">
              Final LGU totals
            </h2>
            <p className="text-sm text-[var(--shell-muted)] mt-1">
              Fixed saved expectations — not time-interpolated.
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
        <div className="explorer-table-wrap">
          <table className="explorer-table">
            <thead>
              <tr>
                <th scope="col">LGU</th>
                {scenarios.map((s) => (
                  <th key={`${s.id}-d`} scope="col">
                    {s.id} deaths
                  </th>
                ))}
                {scenarios.map((s) => (
                  <th key={`${s.id}-i`} scope="col">
                    {s.id} injuries
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.adm3_pcode}>
                  <th scope="row">{l.lgu_name}</th>
                  {scenarios.map((s) => {
                    const v = s.lgu.find((a) => a.adm3_pcode === l.adm3_pcode);
                    return <td key={`${s.id}-${l.adm3_pcode}-d`}>{fmt(v?.expected_deaths ?? 0)}</td>;
                  })}
                  {scenarios.map((s) => {
                    const v = s.lgu.find((a) => a.adm3_pcode === l.adm3_pcode);
                    return (
                      <td key={`${s.id}-${l.adm3_pcode}-i`}>{fmt(v?.expected_injuries ?? 0)}</td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">NCR total</th>
                {scenarios.map((s) => (
                  <td key={`${s.id}-total-d`}>{fmt(s.totals[0])}</td>
                ))}
                {scenarios.map((s) => (
                  <td key={`${s.id}-total-i`}>{fmt(s.totals[1])}</td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </dialog>
    </div>
  );
}