import { Navigate, useParams } from 'react-router';
import { MAIN_CONTENT_ID } from '@/shared/a11y/main-content';
import { DEFAULT_VIEW, findView } from '../views';
import { LIST_HEADING_ID } from '../utils/focus';
import { InboxSidebar } from './inbox-sidebar';
import { ItemDetail } from './item-detail';
import { ItemFilters } from './item-filters';
import { ItemList } from './item-list';

/**
 * Split view from `md` up. Below that, list and detail are separate pages:
 * the list is hidden while an item is open, and the detail is hidden otherwise.
 */
export function InboxPage() {
  const { view: viewSlug, itemId } = useParams();
  const view = findView(viewSlug);
  if (!view) return <Navigate to={`/${DEFAULT_VIEW}`} replace />;

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <InboxSidebar />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex-1 p-4 focus:outline-none">
        <h1
          id={LIST_HEADING_ID}
          tabIndex={-1}
          className="mb-4 text-xl font-semibold focus:outline-none"
        >
          {view.label}
        </h1>
        <ItemFilters />
        <div className="grid gap-4 md:grid-cols-[minmax(16rem,24rem)_1fr]">
          <div className={itemId ? 'hidden md:block' : undefined}>
            <ItemList status={view.slug} />
          </div>
          <div className={itemId ? undefined : 'hidden md:block'}>
            {itemId ? (
              <ItemDetail key={itemId} itemId={itemId} />
            ) : (
              <p>Select an item to see its details.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
