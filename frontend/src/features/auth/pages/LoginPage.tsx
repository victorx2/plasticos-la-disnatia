import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"

import { PageLoading } from "@/app/PageLoading"
import { AuthPageShell } from "@/features/auth/components/AuthPageShell"
import { LoginForm } from "@/features/auth/components/LoginForm"
import { ensureDemoAuthSession, isDemoAutoLoginEnabled } from "@/shared/auth/demoAutoLogin"

export function LoginPage() {
  const demo = isDemoAutoLoginEnabled()
  const [demoReady, setDemoReady] = useState(false)
  const [demoFailed, setDemoFailed] = useState(false)

  useEffect(() => {
    if (!demo) return

    let cancelled = false
    void ensureDemoAuthSession({ force: true }).then((ok) => {
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
