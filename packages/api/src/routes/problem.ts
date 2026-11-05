import type { Context } from 'hono';
import type { ProblemDetails } from '@inbox/contracts';

/** Responds with an RFC 9457 Problem Details body. */
export function problem(c: Context, status: 400 | 404 | 409, title: string, detail?: string,
  extra: Pick<ProblemDetails, 'itemStatus'> = {},
) {
  const body: ProblemDetails = { type: 'about:blank', title, status, detail, ...extra };
  return c.body(JSON.stringify(body), status, { 'content-type': 'application/problem+json' });
}
