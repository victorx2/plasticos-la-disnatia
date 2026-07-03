import { ChevronRight, type LucideIcon } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/shared/ui/sidebar"

export type NavMenuItem = {
  title: string
  url: string
  icon?: LucideIcon
  items?: NavMenuItem[]
}

export function NavMain({
  items,
  groupLabel = "Menú",
}: {
  items: NavMenuItem[]
  groupLabel?: string
}) {
  const location = useLocation()

  const toHref = (url: string) => {
    if (!url || url === "#") return url
    return url.startsWith("/") ? url : `/${url}`
  }

  const isActiveRoute = (url: string) => {
    const u = toHref(url)
    if (!u || u === "#") return false
    return location.pathname === u || location.pathname.startsWith(`${u}/`)
  }

  const renderMenuItems = (menuItems: NavMenuItem[]) =>
    menuItems.map((item, index) => {
      const hasChildren = item.items && item.items.length > 0
      const isParentActive =
        hasChildren &&
        item.items!.some((sub) =>
          isActiveRoute(sub.url) ||
          (sub.items?.some((child) => isActiveRoute(child.url)) ?? false),
        )

      if (!hasChildren) {
        return (
          <SidebarMenuItem key={item.title} style={{ zIndex: index + 1 }}>
            <SidebarMenuButton asChild isActive={isActiveRoute(item.url)}>
              <Link to={toHref(item.url)}>
                {item.icon ? <item.icon className="h-4 w-4" /> : null}
                <span className="min-w-0 truncate">{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      }

      return (
        <Collapsible
          key={item.title}
          asChild
          defaultOpen={isParentActive}
          className="group/collapsible"
        >
          <SidebarMenuItem style={{ zIndex: index + 1 }}>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip={item.title} isActive={isParentActive}>
                {item.icon ? <item.icon className="h-4 w-4" /> : null}
                <span>{item.title}</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {item.items?.map((subItem) => (
                  <SidebarMenuSubItem key={subItem.title}>
                    <SidebarMenuSubButton asChild isActive={isActiveRoute(subItem.url)}>
                      <Link to={toHref(subItem.url)}>
                        {subItem.icon ? <subItem.icon className="h-4 w-4" /> : null}
                        <span className="min-w-0 truncate">{subItem.title}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      )
    })

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>
      <SidebarMenu>{renderMenuItems(items)}</SidebarMenu>
    </SidebarGroup>
  )
}
