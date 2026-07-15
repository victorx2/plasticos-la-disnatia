import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"

import { PageLoading } from "@/app/PageLoading"
import { AuthPageShell } from "@/features/auth/components/AuthPageShell"
import { LoginForm } from "@/features/auth/components/LoginForm"
import { ensureDemoAuthSession, isDemoAutoLoginEnabled } from "@/shared/auth/demoAutoLogin"

/**
 * En demo (Render) nunca se muestra el formulario:
 * reintenta auto-login hasta entrar al Resumen.
 */
export function LoginPage() {
  const demo = isDemoAutoLoginEnabled()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!demo) return

    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const attempt = () => {
      void ensureDemoAuthSession({ force: true }).then((ok) => {
        if (cancelled) return
        if (ok) {
          setReady(true)
          return
        }
        timer = setTimeout(attempt, 2000)
      })
    }

    attempt()

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [demo])

  if (demo) {
    if (ready) return <Navigate to="/resumen" replace />
    return <PageLoading />
  }

  return (
    <AuthPageShell>
      <LoginForm />
    </AuthPageShell>
  )
}
