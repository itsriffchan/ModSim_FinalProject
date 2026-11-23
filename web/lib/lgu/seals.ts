/**
 * Local seal files under `public/lgu-seals/`. Provenance is in
 * `public/lgu-seals/SOURCES.md`. Pcodes absent from this set use a monogram.
 */
const SEAL_PCODES = new Set([
  'PH1303901',
  'PH1307401',
  'PH1307402',
  'PH1307403',
  'PH1307404',
  'PH1307405',
  'PH1307501',
  'PH1307502',
  'PH1307503',
  'PH1307504',
  'PH1307601',
  'PH1307602',
  'PH1307603',
  'PH1307606',
  'PH1307607',
]);

export function lguSealSrc(pcode: string): string | null {
  if (!SEAL_PCODES.has(pcode)) return null;
  return `/lgu-seals/${pcode}.png`;
}

const SKIPPED_MONOGRAM_WORDS = new Set(['of', 'the', 'ng']);

/** Up to three initials from the saved LGU name. */
export function lguMonogram(name: string): string {
  const words = name
    .replace(/ñ/gi, 'n')
    .split(/[^A-Za-z0-9]+/)
    .filter((word) => word.length > 0);
  const kept = words.filter((word) => !SKIPPED_MONOGRAM_WORDS.has(word.toLowerCase()));
  const source = kept.length > 0 ? kept : words;
  return source
    .slice(0, 3)
    .map((word) => word[0]!.toUpperCase())
    .join('');
}
