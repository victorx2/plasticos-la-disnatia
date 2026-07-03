import { ArrowRight, Package, Recycle, Truck } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/shared/ui/button"

type Kind = "bolsones" | "desperdicio" | "both"

const COPY: Record<Kind, { title: string; body: string }> = {
  bolsones: {
    title: "¿Enviar bolsones a despacho?",
    body: "Este reporte es solo consulta. Para registrar el envío (kg + motivo), use Inventario bolsones en Producción.",
  },
  desperdicio: {
    title: "¿Enviar desperdicio a despacho?",
    body: "Este reporte es solo consulta. Para registrar el envío (kg + motivo), use Inventario desperdicio en Producción — los kg vienen de extrusión.",
  },
  both: {
    title: "Bolsones y desperdicio van aparte de bobinas",
    body: "Despacho arma paletas con bobinas (cantidad + peso manual). Bolsones y desperdicio se envían desde sus inventarios en Producción.",
  },
}

export function SubproductDispatchBanner({ kind }: { kind: Kind }) {
  const copy = COPY[kind]
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3.5 text-sm text-amber-950 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-semibold">{copy.title}</p>
        <p className="mt-1 text-amber-900/85">{copy.body}</p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {(kind === "bolsones" || kind === "both") && (
          <Button asChild size="sm" variant="default">
            <Link to="/inventario-bolsones">
              <Package className="h-3.5 w-3.5" aria-hidden />
              Inventario bolsones
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </Button>
        )}
        {(kind === "desperdicio" || kind === "both") && (
          <Button asChild size="sm" variant="default">
            <Link to="/inventario-desperdicio">
              <Recycle className="h-3.5 w-3.5" aria-hidden />
              Inventario desperdicio
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </Button>
        )}
        {kind === "both" && (
          <Button asChild size="sm" variant="outline">
            <Link to="/despacho">
              <Truck className="h-3.5 w-3.5" aria-hidden />
              Despacho bobinas
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}
