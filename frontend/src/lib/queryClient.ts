import { QueryClient } from '@tanstack/react-query'
import { UnauthorizedError } from './auth'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Retrying a 401 is pointless: the login screen takes over
      retry: (count, err) => !(err instanceof UnauthorizedError) && count < 2,
      refetchOnWindowFocus: false,
    },
  },
})
