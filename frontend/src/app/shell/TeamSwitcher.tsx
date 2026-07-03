import * as React from "react"

import { BRANDING, brandAssetUrl } from "@/config/branding"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/ui/sidebar"

export function TeamSwitcher() {
  const [logoSrc] = React.useState(brandAssetUrl())

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg">
          <div className="flex size-9 shrink-0 items-center justify-center bg-transparent">
            <img
              src={logoSrc}
              alt={BRANDING.siteName}
              className="h-full w-full max-h-9 object-contain object-center"
              loading="eager"
            />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{BRANDING.siteName}</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
