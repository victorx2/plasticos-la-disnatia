import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { fetchMaterialRequestForWork } from "@/features/material-requests/api"
import { createTintaMixture } from "@/features/tinta-mixtures/api"
import {
  componentsFromMaterialRequestLines,
  emptyMixtureComponents,
  parseKgFromObservations,
  scaleComponentsToTargetKg,
} from "@/features/tinta-mixtures/domain/mixturePrefill"
import { sumComponentQuantities } from "@/features/tinta-mixtures/domain/mixtureTotals"
import { MIXING_LABELS } from "@/features/tinta-mixtures/labels"
import type { TintaMixtureInput } from "@/features/tinta-mixtures/types"
import type { ProductionOrderRow } from "@/features/programacion/types"
import { ApiError } from "@/shared/api/client"

export type MixtureComponentForm = {
  key: string
  material_id: string
  quantity: string
}

export function useTintaMixtureForm(initialWorkOrderId?: number | null) {
  const [workOrderId, setWorkOrderId] = useState(
    initialWorkOrderId != null && initialWorkOrderId > 0 ? String(initialWorkOrderId) : "",
  )
  const [outputSku, setOutputSku] = useState("")
  const [outputName, setOutputName] = useState("")
  const [subarea, setSubarea] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [components, setComponents] = useState<MixtureComponentForm[]>(() =>
    emptyMixtureComponents(),
  )
  const [loadingPrefill, setLoadingPrefill] = useState(false)
  const [prefillSource, setPrefillSource] = useState<"request" | "empty" | null>(null)
  const [requestedKgFromNotes, setRequestedKgFromNotes] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const syncWorkDefaults = useCallback((work: ProductionOrderRow | null | undefined) => {
    if (!work) return
    setOutputSku(work.code)
    setOutputName(work.product?.name ?? work.code)
  }, [])

  const loadWorkPrefill = useCallback(async (workId: number) => {
    setLoadingPrefill(true)
    setPrefillSource(null)
    setRequestedKgFromNotes(null)
    try {
      const request = await fetchMaterialRequestForWork(workId)
      const notesKg = parseKgFromObservations(request?.notes)
      if (notesKg != null) {
        setRequestedKgFromNotes(notesKg)
      }

      if (request?.lines?.length) {
        let components = componentsFromMaterialRequestLines(request.lines)
        if (notesKg != null && components.length >= 2) {
          components = scaleComponentsToTargetKg(components, notesKg)
        }
        setComponents(components)
        setPrefillSource("request")
        if (request.notes?.trim()) {
          setNotes(request.notes.trim())
        }
      } else if (notesKg != null) {
        setComponents(emptyMixtureComponents())
        setPrefillSource("request")
        if (request?.notes?.trim()) {
          setNotes(request.notes.trim())
        }
      } else {
        setComponents(emptyMixtureComponents())
        setPrefillSource("empty")
      }
    } catch {
      setComponents(emptyMixtureComponents())
      setPrefillSource("empty")
      setRequestedKgFromNotes(null)
    } finally {
      setLoadingPrefill(false)
    }
  }, [])

  useEffect(() => {
    const workId = Number(workOrderId)
    if (!Number.isFinite(workId) || workId <= 0) {
      setComponents(emptyMixtureComponents())
      setPrefillSource(null)
      return
    }
    void loadWorkPrefill(workId)
  }, [workOrderId, loadWorkPrefill])

  const patchComponent = useCallback((key: string, partial: Partial<MixtureComponentForm>) => {
    setComponents((prev) =>
      prev.map((row) => (row.key === key ? { ...row, ...partial } : row)),
    )
  }, [])

  const addComponent = useCallback(() => {
    setComponents((prev) => [
      ...prev,
      { key: `comp-${crypto.randomUUID()}`, material_id: "", quantity: "" },
    ])
  }, [])

  const removeComponent = useCallback((key: string) => {
    setComponents((prev) => {
      if (prev.length <= 2) return prev
      return prev.filter((row) => row.key !== key)
    })
  }, [])

  function validComponents() {
    return components.filter((row) => row.material_id && row.quantity.trim())
  }

  function toPayload(): TintaMixtureInput | null {
    const workId = Number(workOrderId)
    if (!Number.isFinite(workId) || workId <= 0) {
      return null
    }
    const sku = outputSku.trim() || String(workId)
    const name = outputName.trim() || sku
    return {
      output_sku: sku,
      output_name: name,
      output_inventory_area: "resina",
      output_tinta_subarea: subarea,
      unit: "kg",
      notes: notes.trim() || null,
      work_order_id: workId,
      components: validComponents().map((row) => ({
        material_id: Number(row.material_id),
        quantity: row.quantity.trim(),
      })),
    }
  }

  async function submit(): Promise<boolean> {
    const payload = toPayload()
    if (!payload) {
      setFieldErrors({ work_order_id: MIXING_LABELS.validation.workRequired })
      toast.error(MIXING_LABELS.validation.workRequired)
      return false
    }
    if (payload.components.length < 2) {
      toast.error(MIXING_LABELS.componentsMinError)
      return false
    }

    const materialIds = payload.components.map((row) => row.material_id)
    if (new Set(materialIds).size !== materialIds.length) {
      toast.error(MIXING_LABELS.duplicateMaterialError)
      return false
    }

    setSaving(true)
    setFieldErrors({})
    try {
      await createTintaMixture(payload)
      toast.success(MIXING_LABELS.saveSuccess)
      return true
    } catch (error) {
      if (error instanceof ApiError && error.body.errors) {
        const next: Record<string, string> = {}
        for (const [key, messages] of Object.entries(error.body.errors)) {
          if (messages[0]) next[key] = messages[0]
        }
        setFieldErrors(next)
      }
      const message = error instanceof ApiError ? error.message : MIXING_LABELS.saveError
      toast.error(message)
      return false
    } finally {
      setSaving(false)
    }
  }

  const componentsTotal = sumComponentQuantities(components)

  return {
    workOrderId,
    setWorkOrderId,
    outputSku,
    setOutputSku,
    outputName,
    setOutputName,
    subarea,
    setSubarea,
    notes,
    setNotes,
    components,
    patchComponent,
    addComponent,
    removeComponent,
    saving,
    loadingPrefill,
    prefillSource,
    requestedKgFromNotes,
    fieldErrors,
    submit,
    syncWorkDefaults,
    componentsTotal,
  }
}
