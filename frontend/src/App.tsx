import { useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { MotionConfig } from 'motion/react'
import { queryClient } from '@/lib/queryClient'
import { Dashboard } from '@/components/Dashboard'
import { LoginScreen } from '@/components/LoginScreen'
import { ThemeProvider } from '@/lib/ThemeContext'
import { useAuth } from '@/hooks/useAuth'
import { stopConnection } from '@/lib/signalrClient'

/** Shows the login screen when the server requires a password and we have no valid cookie. */
function AuthGate() {
  const { data } = useAuth()
  const loggedOut = data?.required === true && !data.authenticated

  // Cookie expired while the dashboard was open → stop the live connection
  useEffect(() => { if (loggedOut) void stopConnection() }, [loggedOut])

  if (!data) return null // status unknown yet (or server unreachable; useAuth keeps retrying)
  return loggedOut ? <LoginScreen /> : <Dashboard />
}

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        {/* Honour the OS "reduce motion" setting for all animations */}
        <MotionConfig reducedMotion="user">
          <AuthGate />
        </MotionConfig>
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />}
      </QueryClientProvider>
    </ThemeProvider>
  )
}
