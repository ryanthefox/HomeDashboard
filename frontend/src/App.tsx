import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { MotionConfig } from 'motion/react'
import { queryClient } from '@/lib/queryClient'
import { Dashboard } from '@/components/Dashboard'
import { ThemeProvider } from '@/lib/ThemeContext'

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        {/* Honour the OS "reduce motion" setting for all animations */}
        <MotionConfig reducedMotion="user">
          <Dashboard />
        </MotionConfig>
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />}
      </QueryClientProvider>
    </ThemeProvider>
  )
}
