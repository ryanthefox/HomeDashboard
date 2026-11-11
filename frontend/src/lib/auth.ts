/** Thrown by the API helpers on a 401 so React Query doesn't keep retrying. */
export class UnauthorizedError extends Error {
  constructor() { super('401 Unauthorized') }
}

const AUTH_REQUIRED = 'auth:required'

/** Signal that the login cookie is missing/expired → the app shows the login screen. */
export function notifyAuthRequired() {
  window.dispatchEvent(new Event(AUTH_REQUIRED))
}

export function onAuthRequired(cb: () => void) {
  window.addEventListener(AUTH_REQUIRED, cb)
  return () => window.removeEventListener(AUTH_REQUIRED, cb)
}

export interface AuthStatus {
  required: boolean
  authenticated: boolean
}

export const authApi = {
  me: async (): Promise<AuthStatus> => {
    const res = await fetch('/api/auth/me')
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    return res.json() as Promise<AuthStatus>
  },
  /** Resolves on success; throws with a Dutch message otherwise. */
  login: async (password: string): Promise<void> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) return
    if (res.status === 429) throw new Error('Te veel pogingen — wacht een minuut')
    if (res.status === 401) throw new Error('Onjuist wachtwoord')
    throw new Error(`Inloggen mislukt (${res.status})`)
  },
  logout: async (): Promise<void> => {
    await fetch('/api/auth/logout', { method: 'POST' })
  },
}
