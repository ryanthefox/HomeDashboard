import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { authApi, onAuthRequired, type AuthStatus } from '@/lib/auth'
import { queryClient } from '@/lib/queryClient'
import { stopConnection } from '@/lib/signalrClient'

const KEY = ['auth', 'me'] as const

export function useAuth() {
  const query = useQuery({
    queryKey: KEY,
    queryFn: authApi.me,
    staleTime: Infinity,
    retry: 3,
  })

  // Any API call answering 401 → re-check (cookie expired, password changed…)
  useEffect(() => onAuthRequired(() => { void queryClient.invalidateQueries({ queryKey: KEY }) }), [])

  return query
}

export async function login(password: string) {
  await authApi.login(password)
  queryClient.setQueryData<AuthStatus>(KEY, { required: true, authenticated: true })
}

export async function logout() {
  await stopConnection()
  await authApi.logout()
  // Drop all cached dashboard data, keep only the (now logged-out) auth state
  queryClient.removeQueries({ predicate: q => q.queryKey[0] !== 'auth' })
  queryClient.setQueryData<AuthStatus>(KEY, { required: true, authenticated: false })
}
