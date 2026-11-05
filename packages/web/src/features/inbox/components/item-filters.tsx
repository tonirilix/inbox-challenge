import { itemTypes, priorities } from '@inbox/contracts';
import { itemTypeLabel } from '../item-types';
import { useItemFilters } from '../hooks/use-item-filters';

const control = 'bg-background h-9 rounded-md border px-3 text-sm';

const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

/** Always-visible, individually labelled controls; their state is the URL query. */
export function ItemFilters() {
  const { filters, setFilter } = useItemFilters();

  return (
    <form role="search" aria-label="Filter items" onSubmit={(e) => e.preventDefault()}>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-search" className="text-sm font-medium">
            Search
          </label>
          <input
            id="filter-search"
            type="search"
            value={filters.q ?? ''}
            onChange={(e) => setFilter('q', e.target.value)}
            className={control}
          />
          <span className="text-muted-foreground text-xs">Title or requester</span>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-type" className="text-sm font-medium">
            Type
          </label>
          <select
            id="filter-type"
            value={filters.type ?? ''}
            onChange={(e) => setFilter('type', e.target.value)}
            className={control}
          >
            <option value="">All types</option>
            {itemTypes.map((type) => (
              <option key={type} value={type}>
                {itemTypeLabel(type)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-priority" className="text-sm font-medium">
            Priority
          </label>
          <select
            id="filter-priority"
            value={filters.priority ?? ''}
            onChange={(e) => setFilter('priority', e.target.value)}
            className={control}
          >
            <option value="">All priorities</option>
            {priorities.map((priority) => (
              <option key={priority} value={priority}>
                {capitalize(priority)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </form>
  );
}
