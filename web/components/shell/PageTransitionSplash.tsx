'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const MIN_HOLD_MS = 700;
const FAILSAFE_MS = 4000;
const FADE_MS = 200;

export function canonicalSplashPath(pathname: string): string {
  const bare = pathname.split('?')[0]?.split('#')[0] ?? pathname;
  const trimmed = bare.length > 1 ? bare.replace(/\/+$/, '') : bare;
  return trimmed === '/' ? '/region' : trimmed;
}

export function routeSplashLabel(pathname: string): string {
  const path = canonicalSplashPath(pathname);
  if (path === '/region') return 'Region';
  if (path === '/compare') return 'Compare';
  if (path.startsWith('/city')) return 'Region';
  const segment = path.split('/').filter(Boolean).pop();
  if (!segment) return 'NCR scenario explorer';
  let decoded = segment;
  try {
    decoded = decodeURIComponent(segment);
  } catch {
    decoded = segment;
  }
  const name = decoded.replace(/[-_]+/g, ' ').trim();
  if (!name) return 'NCR scenario explorer';
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function clearTimer(slot: { current: number | null }) {
  if (slot.current != null) {
    window.clearTimeout(slot.current);
    slot.current = null;
  }
}

export function PageTransitionSplash() {
  const pathname = usePathname();
  const [present, setPresent] = useState(false);
  const [shown, setShown] = useState(false);
  const [label, setLabel] = useState('NCR scenario explorer');

  const generation = useRef(0);
  const targetPath = useRef<string | null>(null);
  const startedAt = useRef(0);
  const acknowledged = useRef<string | null>(null);
  const hideTimer = useRef<number | null>(null);
  const failsafeTimer = useRef<number | null>(null);
  const unmountTimer = useRef<number | null>(null);
  const frame = useRef<number | null>(null);

  const handlers = useRef<{
    show: (nextPath: string) => void;
    scheduleHide: () => void;
  }>({
    show: () => {},
    scheduleHide: () => {},
  });

  useEffect(() => {
    function finish(gen: number) {
      if (generation.current !== gen) return;
      targetPath.current = null;
      clearTimer(hideTimer);
      clearTimer(failsafeTimer);
      if (frame.current != null) {
        cancelAnimationFrame(frame.current);
        frame.current = null;
      }
      if (prefersReducedMotion()) {
        clearTimer(unmountTimer);
        setShown(false);
        setPresent(false);
        return;
      }
      setShown(false);
      clearTimer(unmountTimer);
      unmountTimer.current = window.setTimeout(() => {
        unmountTimer.current = null;
        if (generation.current !== gen) return;
        setPresent(false);
      }, FADE_MS);
    }

    function scheduleHide() {
      const gen = generation.current;
      clearTimer(hideTimer);
      const remain = prefersReducedMotion()
        ? 0
        : Math.max(0, MIN_HOLD_MS - (performance.now() - startedAt.current));
      hideTimer.current = window.setTimeout(() => {
        hideTimer.current = null;
        finish(gen);
      }, remain);
    }

    function show(nextPath: string) {
      const gen = generation.current + 1;
      generation.current = gen;
      targetPath.current = canonicalSplashPath(nextPath);
      startedAt.current = performance.now();
      clearTimer(hideTimer);
      clearTimer(failsafeTimer);
      clearTimer(unmountTimer);
      if (frame.current != null) {
        cancelAnimationFrame(frame.current);
        frame.current = null;
      }

      const reduced = prefersReducedMotion();
      setLabel(routeSplashLabel(nextPath));
      setPresent(true);
      setShown(reduced);
      if (!reduced) {
        frame.current = requestAnimationFrame(() => {
          frame.current = requestAnimationFrame(() => {
            frame.current = null;
            if (generation.current !== gen) return;
            setShown(true);
          });
        });
      }

      failsafeTimer.current = window.setTimeout(() => {
        failsafeTimer.current = null;
        finish(gen);
      }, FAILSAFE_MS);
    }

    handlers.current = { show, scheduleHide };

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest('a');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;
      const rawHref = anchor.getAttribute('href');
      if (!rawHref || rawHref.startsWith('#')) return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (canonicalSplashPath(url.pathname) === canonicalSplashPath(window.location.pathname)) return;
      show(url.pathname);
    }

    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      clearTimer(hideTimer);
      clearTimer(failsafeTimer);
      clearTimer(unmountTimer);
      if (frame.current != null) cancelAnimationFrame(frame.current);
    };
  }, []);

  useEffect(() => {
    if (!present) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [present]);

  useEffect(() => {
    const current = canonicalSplashPath(pathname);
    if (
      acknowledged.current === null ||
      (acknowledged.current === current && targetPath.current == null)
    ) {
      acknowledged.current = current;
      return;
    }
    if (targetPath.current == null) {
      handlers.current.show(pathname);
    }
    if (targetPath.current === current) {
      handlers.current.scheduleHide();
      acknowledged.current = current;
    }
  }, [pathname]);

  if (!present) return null;

  return (
    <div
      className={`page-splash${shown ? ' is-shown' : ''}`}
      data-testid="page-splash"
      role="status"
      aria-live="polite"
      aria-label={`Opening ${label}`}
    >
      <div className="page-splash-accent" aria-hidden="true" />
      <div className="page-splash-copy">
        <p className="explorer-eyebrow">MODELING &amp; SIMULATION</p>
        <h2 className="explorer-title">NCR scenario explorer</h2>
        <p className="page-splash-destination">Opening {label}</p>
      </div>
    </div>
  );
}
