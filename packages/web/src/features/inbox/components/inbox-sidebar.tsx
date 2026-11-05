import { NavLink } from 'react-router';
import { cn } from '@/shared/lib/cn';
import { useCounts } from '../hooks/use-items';
import { views } from '../views';

/** NavLink sets aria-current="page" on the active view; the count is part of each link's name. */
export function InboxSidebar() {
  const { data: counts } = useCounts();

  return (
    <nav aria-label="Views" className="w-48 shrink-0 border-r p-4">
      <ul className="flex flex-col gap-1">
        {views.map(({ slug, label }) => {
          const count = counts?.[slug];
          const alert = slug === 'failed' && count !== undefined && count > 0;
          return (
            <li key={slug}>
              <NavLink
                to={`/${slug}`}
                className={({ isActive }) =>
                  cn(
                    'hover:bg-muted flex items-center justify-between rounded-md px-3 py-2',
                    isActive && 'bg-muted font-semibold',
                  )
                }
              >
                {label}
                {count !== undefined && (
                  <>
                    <span className="sr-only">
                      , {count} {count === 1 ? 'item' : 'items'}
                    </span>
                    <span
                      aria-hidden="true"
                      className={cn(
                        'rounded-full px-2 text-sm',
                        alert
                          ? 'bg-destructive text-primary-foreground font-bold'
                          : 'text-muted-foreground',
                      )}
                    >
                      {count}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
