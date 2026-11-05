import { vi } from 'vitest';

type Handler = () => unknown;

/**
 * Fakes the network at the fetch boundary. Keys are request paths
 * (e.g. `/api/items`); handlers return the JSON body.
 */
export function fakeApi(handlers: Record<string, Handler>) {
  const fetchSpy = vi.fn(async (input: RequestInfo | URL) => {
    const handler = handlers[String(input)];
    if (!handler) return new Response(null, { status: 404 });
    return Response.json(handler());
  });
  vi.stubGlobal('fetch', fetchSpy);
  return fetchSpy;
}
