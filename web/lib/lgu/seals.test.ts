import { describe, expect, it } from 'vitest';

import { lguMonogram, lguSealSrc } from './seals';

describe('lgu seals', () => {
  it('maps a saved pcode to a local file and leaves gaps empty', () => {
    expect(lguSealSrc('PH1307403')).toBe('/lgu-seals/PH1307403.png');
    expect(lguSealSrc('PH1307606')).toBe('/lgu-seals/PH1307606.png');
    expect(lguSealSrc('PH1307604')).toBeNull();
    expect(lguSealSrc('PH1307605')).toBeNull();
    expect(lguSealSrc('not-an-lgu')).toBeNull();
  });

  it('builds a short monogram from the saved name', () => {
    expect(lguMonogram('City of Parañaque')).toBe('CP');
    expect(lguMonogram('Pasay City')).toBe('PC');
    expect(lguMonogram('Pateros')).toBe('P');
  });
});
