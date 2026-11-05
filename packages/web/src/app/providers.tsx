import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

/** Data is refetched when the window regains focus (TanStack Query's default, kept explicit). */
const createQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: true } } });

export function Providers({
  queryClient,
  children,
}: {
  queryClient?: QueryClient;
  children: ReactNode;
}) {
  const [defaultClient] = useState(createQueryClient);
  return <QueryClientProvider client={queryClient ?? defaultClient}>{children}</QueryClientProvider>;
}
