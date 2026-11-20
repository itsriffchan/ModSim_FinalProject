'use client';

import type { ReactNode } from 'react';

import { ExplorerProviders } from '@/components/shell/ExplorerProviders';

export function AppProviders({ children }: { children: ReactNode }) {
  return <ExplorerProviders>{children}</ExplorerProviders>;
}