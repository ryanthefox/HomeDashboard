import { useState, type FormEvent } from 'react'
import { motion } from 'motion/react'
import { Lock, LogIn, Loader2 } from 'lucide-react'
import { login } from '@/hooks/useAuth'
import { useTheme } from '@/lib/ThemeContext'
import { easeOutExpo } from '@/components/ui/motion'
import { AmbientBackground } from './Dashboard'

export function LoginScreen() {
  const { theme } = useTheme()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!password || busy) return
    setBusy(true)
    setError(null)
    try {
      await login(password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Inloggen mislukt')
      setPassword('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <AmbientBackground />
      <div
        className="relative z-10 flex h-[100dvh] items-center justify-center p-4"
        style={{ colorScheme: theme }}
      >
        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.6, ease: easeOutExpo }}
          className="panel w-full max-w-sm rounded-3xl p-6 sm:p-8"
        >
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent">
              <Lock className="h-5 w-5 text-zinc-950" />
            </div>
            <h1 className="text-xl font-semibold text-fg">Home Dashboard</h1>
            <p className="mt-1 text-sm text-fg3">Voer het wachtwoord in om verder te gaan</p>
          </div>

          <label htmlFor="password" className="sr-only">Wachtwoord</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            autoFocus
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Wachtwoord"
            className="w-full rounded-xl bg-card3 px-4 py-3 text-fg placeholder:text-fg3 outline-none ring-1 ring-transparent focus:ring-[color:var(--accent-1)] transition"
          />

          {error && <p className="mt-3 text-sm text-red-400" role="alert">{error}</p>}

          <motion.button
            type="submit"
            whileTap={{ scale: 0.97 }}
            disabled={busy || !password}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-semibold text-zinc-950 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            Inloggen
          </motion.button>

          <p className="mt-4 text-center text-xs text-fg3">Je blijft op dit apparaat een jaar ingelogd</p>
        </motion.form>
      </div>
    </>
  )
}
