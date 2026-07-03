import { Navigate } from "react-router-dom"

import { AppShell } from "@/app/AppShell"
import { isAuthenticated } from "@/shared/auth/session"
import { TooltipProvider } from "@/shared/ui/tooltip"

export function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/auth/basic/login" replace />
  }
  return children
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
