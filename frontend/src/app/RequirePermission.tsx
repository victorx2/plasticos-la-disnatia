import { Navigate, useLocation } from "react-router-dom"
import type { ReactNode } from "react"

import {
  canAccessPath,
  getSessionAppRole,
  permissionIdForPath,
} from "@/config/permissions"
import { getStoredUser } from "@/shared/auth/session"

type RequirePermissionProps = {
  children: ReactNode
  /** Id de permiso; si se omite se infiere del pathname. */
  permissionId?: string
}

export function RequirePermission({ children, permissionId }: RequirePermissionProps) {
  const location = useLocation()
  const user = getStoredUser()
  const role = getSessionAppRole(user)
  const resolvedId = permissionId ?? permissionIdForPath(location.pathname)

  if (resolvedId && !canAccessPath(location.pathname, role)) {
    return <Navigate to="/resumen" replace state={{ denied: resolvedId }} />
  }

  return children
}
