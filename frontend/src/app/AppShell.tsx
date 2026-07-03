import { useEffect, useState } from "react"
import { Outlet } from "react-router-dom"

import { AppBreadcrumb } from "@/app/shell/AppBreadcrumb"
import { AppSidebar } from "@/app/shell/AppSidebar"
import { Separator } from "@/shared/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/shared/ui/sidebar"
import { cn } from "@/shared/lib/utils"

export function AppShell() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(true)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const handleResize = () => setOpen(window.innerWidth >= 1024)
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <AppSidebar />

      <SidebarInset>
        <header
          className={cn(
            "sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b transition-all duration-200",
            scrolled
              ? "bg-background/80 shadow-md backdrop-blur supports-[backdrop-filter]:bg-background/60"
              : "bg-transparent",
          )}
        >
          <div className="flex items-center gap-2 px-6">
            <SidebarTrigger
              size="icon"
              className="h-9 w-9 rounded-full [&_svg]:size-5"
            />
            <Separator orientation="vertical" className="h-4" />
            <AppBreadcrumb />
          </div>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
