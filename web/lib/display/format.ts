const numberFmt = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** viewer.js `fmt` */
export function fmt(n: number): string {
  return numberFmt.format(n);
}

export function percent(p: number, digits = 4): string {
  return `${(100 * p).toFixed(digits)}%`;
}

export function percentFromFraction(p: number, digits = 2): string {
  return `${(p * 100).toFixed(digits)}%`;
}