import { problemDetailsSchema, type ProblemDetails } from '@inbox/contracts';
import type { z } from 'zod';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly problem?: ProblemDetails,
  ) {
    super(problem?.title ?? `Request failed with status ${status}`);
  }
}

async function readProblem(response: Response): Promise<ProblemDetails | undefined> {
  try {
    return problemDetailsSchema.parse(await response.json());
  } catch {
    return undefined;
  }
}

/** GETs a path and validates the response against its contract schema. */
export async function getJson<S extends z.ZodType>(path: string, schema: S): Promise<z.infer<S>> {
  const response = await fetch(path);
  if (!response.ok) throw new ApiError(response.status, await readProblem(response));
  return schema.parse(await response.json());
}

/** POSTs a JSON body and validates the response against its contract schema. */
export async function postJson<S extends z.ZodType>(
  path: string,
  body: unknown,
  schema: S,
): Promise<z.infer<S>> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new ApiError(response.status, await readProblem(response));
  return schema.parse(await response.json());
}
