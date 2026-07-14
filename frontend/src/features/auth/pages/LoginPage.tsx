import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"

import { AuthPageShell } from "@/features/auth/components/AuthPageShell"
import { LoginForm } from "@/features/auth/components/LoginForm"
import { PageLoading } from "@/app/PageLoading"
import { ensureDemoAuthSession, isDemoAutoLoginEnabled } from "@/shared/auth/demoAutoLogin"
import { isAuthenticated } from "@/shared/auth/session"

export function LoginPage() {
  const demo = isDemoAutoLoginEnabled()
  const [demoReady, setDemoReady] = useState(() => isAuthenticated())
  const [demoFailed, setDemoFailed] = useState(false)

  useEffect(() => {
    if (!demo) return
    if (isAuthenticated()) {
      setDemoReady(true)
      return
    }

    let cancelled = false
    void ensureDemoAuthSession().then((ok) => {
      if (cancelled) return
      if (ok) setDemoReady(true)
      else setDemoFailed(true)
    })

    return () => {
      cancelled = true
    }
  }, [demo])

  if (demo && demoReady) {
    return <Navigate to="/resumen" replace />
  }

  if (demo && !demoFailed) {
    return <PageLoading />
  }

  return (
    <AuthPageShell>
      <LoginForm />
    </AuthPageShell>
  )
}
