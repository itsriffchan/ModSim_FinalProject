'use client';

export function CompareInterpretation() {
  return (
    <div className="grid gap-2 rounded-md border border-slate-300 bg-white p-3 text-sm text-slate-800 shadow-sm md:grid-cols-2">
      <div>
        <h3 className="font-semibold">A vs B (duration)</h3>
        <p className="text-xs text-slate-600">
          Scenario A: Pasig epicenter, 20 s assumed shaking. Scenario B: same epicenter, 40 s. This is an assumed
          duration sensitivity experiment — not a verified historical effect of doubling duration.
        </p>
      </div>
      <div>
        <h3 className="font-semibold">B vs C (location)</h3>
        <p className="text-xs text-slate-600">
          Scenario B: Pasig, 40 s. Scenario C: Muntinlupa alternative epicenter, 40 s. Compares location at equal
          duration using saved model outputs; differences are not forced equal.
        </p>
      </div>
    </div>
  );
}