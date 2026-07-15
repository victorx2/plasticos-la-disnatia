import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"

import { AppShell } from "@/app/AppShell"
import { PageLoading } from "@/app/PageLoading"
import { ensureDemoAuthSession, isDemoAutoLoginEnabled } from "@/shared/auth/demoAutoLogin"
import { isAuthenticated } from "@/shared/auth/session"
import { TooltipProvider } from "@/shared/ui/tooltip"

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const demo = isDemoAutoLoginEnabled()
  const [ready, setReady] = useState(() => !demo && isAuthenticated())
  const [goLogin, setGoLogin] = useState(false)

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    if (demo) {
      const attempt = () => {
        void ensureDemoAuthSession({ force: true }).then((ok) => {
          if (cancelled) return
          if (ok) {
            setReady(true)
            return
          }
          // No mandar a /login: reintentar mientras despierta el free tier
          timer = setTimeout(attempt, 2000)
        })
      }
      attempt()
      return () => {
        cancelled = true
        if (timer) clearTimeout(timer)
      }
    }

    if (isAuthenticated()) {
      setReady(true)
      return
    }

    setGoLogin(true)
    return () => {
      cancelled = true
    }
  }, [demo])

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
