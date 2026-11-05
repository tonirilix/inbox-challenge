import { vi } from 'vitest';

type Handler = (init?: RequestInit) => unknown;

/** Handlers may return a `Response` (e.g. an error) instead of a JSON body. */

/**
 * Fakes the network at the fetch boundary. Keys are request paths
 * incl. any query string (e.g. `/api/items?status=pending`); handlers return the JSON body.
 */
export function fakeApi(handlers: Record<string, Handler>) {
  const fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const handler = handlers[String(input)];
    if (!handler) return new Response(null, { status: 404 });
    const result = handler(init);
    return result instanceof Response ? result : Response.json(result);
  });
  vi.stubGlobal('fetch', fetchSpy);
  return fetchSpy;
}
