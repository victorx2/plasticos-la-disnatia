import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"

import { PageLoading } from "@/app/PageLoading"
import { AuthPageShell } from "@/features/auth/components/AuthPageShell"
import { LoginForm } from "@/features/auth/components/LoginForm"
import { ensureDemoAuthSession, isDemoAutoLoginEnabled } from "@/shared/auth/demoAutoLogin"

/**
 * En demo (Render) NUNCA se renderiza el formulario de login.
 * Solo loading → auto-login → /resumen.
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
        timer = setTimeout(attempt, 1500)
      })
    }

    attempt()

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [demo])

  // En Render / demo: jamás LoginForm
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
