import { Link, useLocation } from "react-router-dom"

import { REPORTS_LABELS } from "@/features/reports/labels"
import { reportTitleForPath } from "@/features/reports/routes"
import { menuTitleForPath } from "@/config/menu"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/ui/breadcrumb"

export function AppBreadcrumb() {
  const { pathname } = useLocation()
  const title = menuTitleForPath(pathname)
  const isReportSubRoute = pathname.startsWith("/reportes/") && pathname.split("/").length > 2

  if (!title) return null

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink asChild>
            <Link to="/resumen">Inicio</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        {isReportSubRoute ? (
          <>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink asChild>
                <Link to="/reportes/tiempos">{REPORTS_LABELS.title}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{reportTitleForPath(pathname)}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : (
          <BreadcrumbItem>
            <BreadcrumbPage>{title}</BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
