import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, ShieldCheck } from 'lucide-react'
import { ringApi } from '@/lib/api'

const input = 'w-full rounded-xl border border-subtle2 bg-card3 px-3 py-2.5 text-sm text-fg outline-none transition-colors placeholder:text-fg3 focus:border-orange-400/60'

/** Ring login: e-mail + password, then the verification code Ring sends. */
export function RingLogin({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'credentials' | 'code'>('credentials')
  const [prompt, setPrompt] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      const r = await ringApi.login({ email, password, code: step === 'code' ? code : undefined })
      if (r.ok) {
        setPassword(''); setCode('')
        await qc.invalidateQueries({ queryKey: ['ring'] })
        onDone()
      } else if (r.needs2fa) {
        setStep('code'); setPrompt(r.prompt ?? '')
        if (r.wrongCode) setError('Die code klopt niet, probeer het opnieuw')
      } else {
        setError(r.error ?? 'Inloggen mislukt')
      }
    } catch {
      setError('Inloggen mislukt')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 p-5">
      {step === 'credentials' ? (
        <>
          <p className="text-sm text-fg2">Log in met je Ring-account. Je wachtwoord wordt niet opgeslagen: het dashboard bewaart alleen de sleutel die Ring teruggeeft.</p>
          <input className={input} type="email" autoComplete="username" placeholder="E-mailadres" value={email} onChange={e => setEmail(e.target.value)} required />
          <input className={input} type="password" autoComplete="current-password" placeholder="Wachtwoord" value={password} onChange={e => setPassword(e.target.value)} required />
        </>
      ) : (
        <>
          <div className="flex items-start gap-2.5 rounded-2xl bg-card3 p-3 text-sm text-fg2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <p>{prompt || 'Ring heeft je een verificatiecode gestuurd.'} Vul die hieronder in.</p>
          </div>
          <input className={`${input} text-center text-lg tracking-[0.4em] tabular`} inputMode="numeric" autoComplete="one-time-code"
            placeholder="123456" value={code} onChange={e => setCode(e.target.value)} autoFocus required />
        </>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center justify-between gap-2 pt-1">
        {step === 'code'
          ? <button type="button" onClick={() => { setStep('credentials'); setCode(''); setError(null) }} className="text-xs text-fg3 hover:text-fg2">Terug</button>
          : <span />}
        <button type="submit" disabled={busy} className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold disabled:opacity-60">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {step === 'code' ? 'Bevestigen' : 'Inloggen'}
        </button>
      </div>
    </form>
  )
}
