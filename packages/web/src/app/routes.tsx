import { Navigate, type RouteObject } from 'react-router';
import { DEFAULT_VIEW, InboxPage } from '@/features/inbox';
import { AppShell } from './app-shell';

export const appRoutes: RouteObject[] = [
  { path: '/', element: <Navigate to={`/${DEFAULT_VIEW}`} replace /> },
  {
    path: '/:view',
    element: (
      <AppShell>
        <InboxPage />
      </AppShell>
    ),
  },
];
