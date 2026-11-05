import type { z } from 'zod';

export class ApiError extends Error {
  constructor(readonly status: number) {
    super(`Request failed with status ${status}`);
  }
}

/** GETs a path and validates the response against its contract schema. */
export async function getJson<S extends z.ZodType>(path: string, schema: S): Promise<z.infer<S>> {
  const response = await fetch(path);
  if (!response.ok) throw new ApiError(response.status);
  return schema.parse(await response.json());
}
