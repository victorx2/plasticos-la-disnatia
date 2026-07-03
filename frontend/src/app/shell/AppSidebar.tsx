import * as React from "react"
import { useLocation } from "react-router-dom"

import { NavMain, type NavMenuItem } from "@/app/shell/NavMain"
import { NavUser } from "@/app/shell/NavUser"
import { TeamSwitcher } from "@/app/shell/TeamSwitcher"
import { ACARIGUA_MENU_TREE } from "@/config/menu"
import { BRANDING } from "@/config/branding"
import { filterMenuTree, getSessionAppRole } from "@/config/permissions"
import { getStoredUser } from "@/shared/auth/session"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/shared/ui/sidebar"

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  useLocation()
  const session = getStoredUser()
  const role = getSessionAppRole(session)

  const navMain = React.useMemo(
    () => filterMenuTree(ACARIGUA_MENU_TREE, role) as NavMenuItem[],
    [role],
  )

  const navUser = session
    ? {
        name: session.name,
        email: session.email,
        avatar: "",
        role: session.role,
      }
    : { name: "Usuario", email: `usuario@${BRANDING.emailDomain}`, avatar: "", role: null }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} groupLabel="Menú principal" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={navUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
