import type { RouteObject } from 'react-router';
import { InboxPage } from '@/features/inbox';
import { AppShell } from './app-shell';

export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: (
      <AppShell>
        <InboxPage />
      </AppShell>
    ),
  },
];
