import { login } from "@/features/auth/api"
import { clearAuthSession, isAuthenticated, setAuthSession } from "@/shared/auth/session"

/** Demo cloud (Render): entrar sin pantella de login. */
export function isDemoAutoLoginEnabled(): boolean {
  return import.meta.env.VITE_DEMO_AUTO_LOGIN === "true"
}

const DEMO_LOGIN = "admin"
const DEMO_PASSWORD = "password"

let inflight: Promise<boolean> | null = null

/** Fuerza un login demo nuevo (sirve tras sleep de Render / JWT inválido). */
export async function refreshDemoAuthSession(): Promise<boolean> {
  if (!isDemoAutoLoginEnabled()) return false

  if (!inflight) {
    inflight = (async () => {
      try {
        clearAuthSession()
        const data = await login({ login: DEMO_LOGIN, password: DEMO_PASSWORD })
        setAuthSession(data.token, data.user)
        return true
      } catch {
        return false
      } finally {
        inflight = null
      }
    })()
  }

  return inflight
}

/**
 * Garantiza sesión demo.
 * Con `force`, re-loguea aunque haya token viejo en localStorage.
 */
export async function ensureDemoAuthSession(options?: { force?: boolean }): Promise<boolean> {
  if (!isDemoAutoLoginEnabled()) return isAuthenticated()
  if (!options?.force && isAuthenticated()) return true
  return refreshDemoAuthSession()
}
