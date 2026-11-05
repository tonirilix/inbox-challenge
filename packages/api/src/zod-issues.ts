/** One line per request problem, e.g. "payload.amount: Too small". */
export const formatIssues = (error: { issues: { path: PropertyKey[]; message: string }[] }) =>
  error.issues.map((i) => `${i.path.map(String).join('.') || 'body'}: ${i.message}`).join('; ');
