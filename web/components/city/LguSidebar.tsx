'use client';

import Link from 'next/link';

import type { LguRow } from '@/lib/payload/types';

export function LguSidebar({
  lgus,
  activePcode,
}: {
  lgus: LguRow[];
  activePcode: string;
}) {
  const sorted = [...lgus].sort((a, b) => a.lgu_name.localeCompare(b.lgu_name));

  return (
    <aside
      className="flex w-full shrink-0 flex-col gap-1 rounded-md border border-slate-300 bg-white p-2 shadow-sm md:w-52"
      aria-label="LGU list"
    >
      <h2 className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">17 LGUs</h2>
      <ul className="max-h-[420px] overflow-y-auto text-sm">
        {sorted.map((lgu) => {
          const active = lgu.adm3_pcode === activePcode;
          return (
            <li key={lgu.adm3_pcode}>
              <Link
                href={`/city/${encodeURIComponent(lgu.adm3_pcode)}`}
                className={`block rounded px-2 py-1.5 ${
                  active ? 'bg-[#2f4a5e] text-white' : 'text-slate-800 hover:bg-slate-100'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                {lgu.lgu_name}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}