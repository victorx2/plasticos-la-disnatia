import { useState } from "react"

import { SubproductReleaseTable } from "@/features/dispatch/components/DispatchSubproductsPanel"
import { DISPATCH_LABELS } from "@/features/dispatch/labels"
import { useDispatchSubproducts } from "@/features/dispatch/hooks/useDispatchSubproducts"
import {
  buildInDispatchExport,
  SubproductExportBar,
} from "@/features/production-subproducts/components/SubproductExportBar"
import { FormSectionCard } from "@/features/production/shared/FormSectionCard"

export function DispatchSubproductsSection({ filterWorkOrderId }: { filterWorkOrderId: number | null }) {
  const {
    bolsones,
    desperdicio,
    loading,
    releasingKey,
    releaseBolsones,
    releaseDesperdicio,
  } = useDispatchSubproducts(filterWorkOrderId)

  const [kgByKey, setKgByKey] = useState<Record<string, string>>({})
  const [reasonByKey, setReasonByKey] = useState<Record<string, string>>({})

  function clearFields(key: string) {
    setKgByKey((prev) => ({ ...prev, [key]: "" }))
    setReasonByKey((prev) => ({ ...prev, [key]: "" }))
  }

  const bolsonesExport = buildInDispatchExport(bolsones, { stockByMeasure: true })
  const desperdicioExport = buildInDispatchExport(desperdicio)

  return (
    <>
      <FormSectionCard
        title={DISPATCH_LABELS.sections.bolsonesInDispatch}
        description={DISPATCH_LABELS.sections.bolsonesInDispatchHint}
      >
        {loading ? (
          <p className="text-sm text-slate-500">Cargando…</p>
        ) : (
          <>
            <SubproductExportBar
              title={DISPATCH_LABELS.sections.bolsonesInDispatch}
              slug="despacho-bolsones"
              headers={bolsonesExport.headers}
              rows={bolsonesExport.rows}
              disabled={bolsones.length === 0}
            />
            <SubproductReleaseTable
              stockByMeasure
              rows={bolsones}
              kgByKey={kgByKey}
              reasonByKey={reasonByKey}
              releasingKey={releasingKey}
              onKgChange={(key, value) => setKgByKey((prev) => ({ ...prev, [key]: value }))}
              onReasonChange={(key, value) => setReasonByKey((prev) => ({ ...prev, [key]: value }))}
              onRelease={(row, key) =>
                void releaseBolsones(
                  {
                    key,
                    measure: row.measure,
                  },
                  kgByKey[key] ?? "",
                  reasonByKey[key],
                ).then((ok) => {
                  if (ok) clearFields(key)
                })
              }
            />
          </>
        )}
      </FormSectionCard>

      <FormSectionCard
        title={DISPATCH_LABELS.sections.desperdicioInDispatch}
        description={DISPATCH_LABELS.sections.desperdicioInDispatchHint}
      >
        {loading ? (
          <p className="text-sm text-slate-500">Cargando…</p>
        ) : (
          <>
            <SubproductExportBar
              title={DISPATCH_LABELS.sections.desperdicioInDispatch}
              slug="despacho-desperdicio"
              headers={desperdicioExport.headers}
              rows={desperdicioExport.rows}
              disabled={desperdicio.length === 0}
            />
            <SubproductReleaseTable
              rows={desperdicio}
              kgByKey={kgByKey}
              reasonByKey={reasonByKey}
              releasingKey={releasingKey}
              onKgChange={(key, value) => setKgByKey((prev) => ({ ...prev, [key]: value }))}
              onReasonChange={(key, value) => setReasonByKey((prev) => ({ ...prev, [key]: value }))}
              onRelease={(row, key) =>
                void releaseDesperdicio(
                  {
                    key,
                    workOrderId: row.work_order_id,
                    manualEntryId: row.manual_entry_id,
                  },
                  kgByKey[key] ?? "",
                  reasonByKey[key],
                ).then((ok) => {
                  if (ok) clearFields(key)
                })
              }
            />
          </>
        )}
      </FormSectionCard>
    </>
  )
}
