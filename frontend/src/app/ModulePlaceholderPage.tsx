import { useLocation } from "react-router-dom"

import { BRANDING } from "@/config/branding"
import { menuTitleForPath } from "@/config/menu"
import { PageShell } from "@/shared/catalog/PageShell"

export function ModulePlaceholderPage() {
  const { pathname } = useLocation()
  const title = menuTitleForPath(pathname) ?? "Módulo"

  return (
    <PageShell
      title={title}
      subtitle={`Este módulo se implementará en las siguientes iteraciones de ${BRANDING.siteName}.`}
    >
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-600">
        Próximamente — la navegación y permisos ya están configurados.
      </div>
    </PageShell>
  )
}
