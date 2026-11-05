import { Navigate, useParams } from 'react-router';
import { MAIN_CONTENT_ID } from '@/shared/a11y/main-content';
import { DEFAULT_VIEW, findView } from '../views';
import { InboxSidebar } from './inbox-sidebar';
import { ItemList } from './item-list';

export function InboxPage() {
  const view = findView(useParams().view);
  if (!view) return <Navigate to={`/${DEFAULT_VIEW}`} replace />;

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <InboxSidebar />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex-1 p-4 focus:outline-none">
        <h1 className="mb-4 text-xl font-semibold">{view.label}</h1>
        <ItemList status={view.slug} />
      </main>
    </div>
  );
}
