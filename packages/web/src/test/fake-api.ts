import { vi } from 'vitest';

type Handler = () => unknown;

/** Handlers may return a `Response` (e.g. an error) instead of a JSON body. */

/**
 * Fakes the network at the fetch boundary. Keys are request paths
 * (e.g. `/api/items`); handlers return the JSON body.
 */
export function fakeApi(handlers: Record<string, Handler>) {
  const fetchSpy = vi.fn(async (input: RequestInfo | URL) => {
    const handler = handlers[String(input)];
    if (!handler) return new Response(null, { status: 404 });
    const result = handler();
    return result instanceof Response ? result : Response.json(result);
  });
  vi.stubGlobal('fetch', fetchSpy);
  return fetchSpy;
}
