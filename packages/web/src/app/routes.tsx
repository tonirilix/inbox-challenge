import { Navigate, type RouteObject } from 'react-router';
import { DEFAULT_VIEW, InboxPage } from '@/features/inbox';
import { AppShell } from './app-shell';

const inbox = (
  <AppShell>
    <InboxPage />
  </AppShell>
);

/** The view and the item are in the path: `/:view` and `/:view/:itemId`. */
export const appRoutes: RouteObject[] = [
  { path: '/', element: <Navigate to={`/${DEFAULT_VIEW}`} replace /> },
  { path: '/:view', element: inbox },
  { path: '/:view/:itemId', element: inbox },
];
