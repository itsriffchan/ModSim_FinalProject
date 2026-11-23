'use client';

import { useState } from 'react';

import { lguMonogram, lguSealSrc } from '@/lib/lgu/seals';

export function LguSealMark({ pcode, name }: { pcode: string; name: string }) {
  const src = lguSealSrc(pcode);
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span className="explorer-lgu-monogram" aria-hidden="true">
        {lguMonogram(name)}
      </span>
    );
  }

  return (
    <img
      className="explorer-lgu-seal"
      src={src}
      alt=""
      width={72}
      height={72}
      onError={() => setFailed(true)}
    />
  );
}
