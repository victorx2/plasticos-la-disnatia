import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"

import { AppShell } from "@/app/AppShell"
import { PageLoading } from "@/app/PageLoading"
import { ensureDemoAuthSession, isDemoAutoLoginEnabled } from "@/shared/auth/demoAutoLogin"
import { isAuthenticated } from "@/shared/auth/session"
import { TooltipProvider } from "@/shared/ui/tooltip"

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(() => isAuthenticated())
  const [goLogin, setGoLogin] = useState(false)

  useEffect(() => {
    if (isAuthenticated()) {
      setReady(true)
      return
    }

    if (!isDemoAutoLoginEnabled()) {
      setGoLogin(true)
      return
    }

    let cancelled = false
    void ensureDemoAuthSession().then((ok) => {
      if (cancelled) return
      if (ok) setReady(true)
      else setGoLogin(true)
    })

    return () => {
      cancelled = true
    }
  }, [])

  if (ready) return children
  if (goLogin) return <Navigate to="/auth/basic/login" replace />
  return <PageLoading />
}

export function AppLayout() {
  return (
    <RequireAuth>
      <TooltipProvider delayDuration={300}>
        <AppShell />
      </TooltipProvider>
    </RequireAuth>
  )
}
