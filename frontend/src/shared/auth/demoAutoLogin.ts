import { login } from "@/features/auth/api"
import { isAuthenticated, setAuthSession } from "@/shared/auth/session"

/** Demo cloud (Render): entrar sin pantella de login. */
export function isDemoAutoLoginEnabled(): boolean {
  return import.meta.env.VITE_DEMO_AUTO_LOGIN === "true"
}

const DEMO_LOGIN = "admin"
const DEMO_PASSWORD = "password"

let inflight: Promise<boolean> | null = null

/** Si no hay sesión y el auto-login está activo, inicia sesión como admin demo. */
export async function ensureDemoAuthSession(): Promise<boolean> {
  if (isAuthenticated()) return true
  if (!isDemoAutoLoginEnabled()) return false

  if (!inflight) {
    inflight = (async () => {
      try {
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
