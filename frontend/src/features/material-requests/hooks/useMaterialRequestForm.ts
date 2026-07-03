import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { createMaterialRequest, fetchMaterialRequestForWork } from "@/features/material-requests/api"
import {
  fetchPrincipalInitialMaterials,
  fetchPrincipalRemainingMaterials,
  mixtureTotalsToRequestLines,
  sumKgFromRequestLines,
} from "@/features/material-requests/domain/sum-mixture-materials"
import {
  materialRequestHasPendingDispatch,
} from "@/features/material-requests/domain/openMaterialRequest"
import {
  MATERIAL_REQUEST_LABELS,
  MATERIAL_REQUEST_UNITS,
} from "@/features/material-requests/labels"
import type { MaterialRequestDetail, MaterialRequestInput } from "@/features/material-requests/types"
import {
  fetchPrincipalBalance,
  type PrincipalBalance,
} from "@/features/tinta-mixtures/api"
import {
  formatPlantWorkLabel,
  usePlantWorkOptions,
} from "@/features/tinta-mixtures/hooks/usePlantWorkOptions"
import { ApiError } from "@/shared/api/client"
import { formatKgDisplay, parseKgNumber } from "@/shared/format/numbers"

export type MaterialRequestLineForm = {
  key: string
  material_id: string
  description: string
  quantity_requested: string
  unit: string
}

let lineKeySeq = 0

function newLineKey(): string {
  lineKeySeq += 1
  return `mline-${lineKeySeq}`
}

export function emptyMaterialRequestLine(): MaterialRequestLineForm {
  return {
    key: newLineKey(),
    material_id: "",
    description: "",
    quantity_requested: "",
    unit: "kg",
  }
}

function linesFromInput(
  inputs: Array<{
    material_id?: number | null
    description?: string | null
    quantity_requested: string | number
    unit?: string | null
  }>,
): MaterialRequestLineForm[] {
  return inputs.map((line) => ({
    key: newLineKey(),
    material_id: line.material_id ? String(line.material_id) : "",
    description: line.description ?? "",
    quantity_requested: String(line.quantity_requested),
    unit: line.unit ?? "kg",
  }))
}

export function useMaterialRequestForm(initialWorkOrderId?: number | null) {
  const { works, loading: loadingWorks } = usePlantWorkOptions()
  const [workOrderId, setWorkOrderId] = useState(
    initialWorkOrderId != null && initialWorkOrderId > 0 ? String(initialWorkOrderId) : "",
  )
  const [notes, setNotes] = useState("")
  const [originatingArea, setOriginatingArea] = useState("mezcla")
  const [lines, setLines] = useState<MaterialRequestLineForm[]>([emptyMaterialRequestLine()])
  const [saving, setSaving] = useState(false)
  const [loadingMixtures, setLoadingMixtures] = useState(false)
  const [loadingPrincipal, setLoadingPrincipal] = useState(false)
  const [openRequest, setOpenRequest] = useState<MaterialRequestDetail | null>(null)
  const [loadingOpenRequest, setLoadingOpenRequest] = useState(false)
  const [principalBalance, setPrincipalBalance] = useState<PrincipalBalance | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [replenishmentMode, setReplenishmentMode] = useState(false)

  const selectedWork = useMemo(
    () => works.find((w) => String(w.id) === workOrderId) ?? null,
    [works, workOrderId],
  )

  const previewTotalKg = useMemo(() => sumKgFromRequestLines(lines), [lines])

  const loadPrincipalBalance = useCallback(async (workId: number) => {
    setLoadingPrincipal(true)
    try {
      const balance = await fetchPrincipalBalance(workId)
      setPrincipalBalance(balance)
    } catch {
      setPrincipalBalance(null)
    } finally {
      setLoadingPrincipal(false)
    }
  }, [])

  useEffect(() => {
    const workId = Number(workOrderId)
    if (!Number.isFinite(workId) || workId <= 0) {
      setPrincipalBalance(null)
      return
    }
    void loadPrincipalBalance(workId)
  }, [workOrderId, loadPrincipalBalance])

  useEffect(() => {
    const workId = Number(workOrderId)
    if (!Number.isFinite(workId) || workId <= 0) {
      setOpenRequest(null)
      return
    }
    let cancelled = false
    setLoadingOpenRequest(true)
    void fetchMaterialRequestForWork(workId)
      .then((request) => {
        if (cancelled) return
        setOpenRequest(request && materialRequestHasPendingDispatch(request) ? request : null)
      })
      .catch(() => {
        if (!cancelled) setOpenRequest(null)
      })
      .finally(() => {
        if (!cancelled) setLoadingOpenRequest(false)
      })
    return () => {
      cancelled = true
    }
  }, [workOrderId])

  const principalRemainingKg = useMemo(() => {
    if (!principalBalance) return null
    return parseKgNumber(principalBalance.kg_remaining)
  }, [principalBalance])

  const principalExhausted = useMemo(() => {
    if (principalBalance?.principal_exhausted != null) {
      return principalBalance.principal_exhausted
    }
    return principalRemainingKg != null && principalRemainingKg <= 0.001
  }, [principalBalance, principalRemainingKg])

  useEffect(() => {
    if (principalExhausted) {
      setReplenishmentMode(true)
    } else {
      setReplenishmentMode(false)
    }
  }, [workOrderId, principalExhausted])

  const principalRemainingByMaterial = useMemo(() => {
    const map = new Map<number, number>()
    if (!principalBalance?.components) return map
    for (const row of principalBalance.components) {
      const qty = parseKgNumber(row.quantity)
      if (qty > 0) map.set(row.material_id, qty)
    }
    return map
  }, [principalBalance])

  const getMaterialMaxKg = useCallback(
    (materialId: string): number | null => {
      if (!materialId) return null
      const id = Number(materialId)
      if (!Number.isFinite(id) || id <= 0) return null
      const max = principalRemainingByMaterial.get(id)
      return max != null ? max : null
    },
    [principalRemainingByMaterial],
  )

  const patchLine = useCallback((key: string, partial: Partial<MaterialRequestLineForm>) => {
    setLines((prev) =>
      prev.map((line) => (line.key === key ? { ...line, ...partial } : line)),
    )
  }, [])

  const addLine = useCallback(() => {
    setLines((prev) => [...prev, emptyMaterialRequestLine()])
  }, [])

  const removeLine = useCallback((key: string) => {
    setLines((prev) => {
      const next = prev.filter((line) => line.key !== key)
      return next.length ? next : [emptyMaterialRequestLine()]
    })
  }, [])

  async function loadFromInitialRecipe(): Promise<void> {
    const workId = Number(workOrderId)
    if (!Number.isFinite(workId) || workId <= 0) {
      toast.error(MATERIAL_REQUEST_LABELS.workRequired)
      return
    }
    setLoadingMixtures(true)
    try {
      const totals = await fetchPrincipalInitialMaterials(workId)
      if (!totals.length) {
        toast.error(MATERIAL_REQUEST_LABELS.loadInitialRecipeEmpty)
        return
      }
      setLines(linesFromInput(mixtureTotalsToRequestLines(totals)))
      toast.success(MATERIAL_REQUEST_LABELS.loadInitialRecipeSuccess)
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : MATERIAL_REQUEST_LABELS.loadMixturesError
      toast.error(message)
    } finally {
      setLoadingMixtures(false)
    }
  }

  async function loadFromMixtures(): Promise<void> {
    const workId = Number(workOrderId)
    if (!Number.isFinite(workId) || workId <= 0) {
      toast.error(MATERIAL_REQUEST_LABELS.workRequired)
      return
    }
    setLoadingMixtures(true)
    try {
      const totals = await fetchPrincipalRemainingMaterials(workId)
      if (!totals.length) {
        if (principalExhausted) {
          setReplenishmentMode(true)
        }
        toast.error(MATERIAL_REQUEST_LABELS.loadMixturesEmpty)
        return
      }
      setLines(linesFromInput(mixtureTotalsToRequestLines(totals)))
      toast.success(MATERIAL_REQUEST_LABELS.loadMixturesSuccess)
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : MATERIAL_REQUEST_LABELS.loadMixturesError
      toast.error(message)
    } finally {
      setLoadingMixtures(false)
    }
  }

  function toPayload(): MaterialRequestInput | null {
    const workId = Number(workOrderId)
    if (!Number.isFinite(workId) || workId <= 0) return null
    return {
      notes: notes.trim(),
      originating_area: originatingArea,
      destination_areas: ["almacen"],
      document_date: new Date().toISOString().slice(0, 10),
      work_order_id: workId,
      allow_replenishment: replenishmentMode,
      lines: lines
        .filter((line) => line.description.trim() && line.quantity_requested.trim())
        .map((line) => ({
          material_id: line.material_id ? Number(line.material_id) : null,
          description: line.description.trim(),
          quantity_requested: line.quantity_requested.trim(),
          unit: line.unit.trim() || "kg",
        })),
    }
  }

  async function submit(): Promise<{ ok: true; workOrderId: number; principalRemaining?: string } | { ok: false }> {
    if (openRequest) {
      toast.error(MATERIAL_REQUEST_LABELS.openRequestHint(openRequest.id))
      return { ok: false }
    }

    if (!notes.trim()) {
      setFieldErrors({ notes: MATERIAL_REQUEST_LABELS.notesRequired })
      toast.error(MATERIAL_REQUEST_LABELS.notesRequired)
      return { ok: false }
    }

    const payload = toPayload()
    if (!payload) {
      setFieldErrors({ work_order_id: MATERIAL_REQUEST_LABELS.workRequired })
      toast.error(MATERIAL_REQUEST_LABELS.workRequired)
      return { ok: false }
    }

    if (!payload.lines.length) {
      toast.error(MATERIAL_REQUEST_LABELS.linesMinError)
      return { ok: false }
    }

    if (
      !replenishmentMode &&
      principalRemainingKg != null &&
      principalRemainingKg > 0 &&
      previewTotalKg > principalRemainingKg + 0.0001
    ) {
      toast.error(
        `La solicitud (${previewTotalKg} kg) supera el saldo total de la mezcla principal (${principalRemainingKg} kg).`,
      )
      return { ok: false }
    }

    if (!replenishmentMode && principalRemainingByMaterial.size > 0) {
      for (const line of payload.lines) {
        if (!line.material_id) continue
        const unit = (line.unit ?? "kg").toLowerCase()
        if (unit !== "kg") continue
        const requested = parseKgNumber(String(line.quantity_requested))
        const max = principalRemainingByMaterial.get(line.material_id)
        if (max == null) continue
        if (requested > max + 0.0001) {
          const label = (line.description ?? "").trim() || `Material #${line.material_id}`
          toast.error(
            MATERIAL_REQUEST_LABELS.lineExceedsMaterial(
              label,
              formatKgDisplay(max),
              formatKgDisplay(requested),
            ),
          )
          return { ok: false }
        }
      }
    }

    const workId = Number(workOrderId)
    setSaving(true)
    setFieldErrors({})
    try {
      const created = await createMaterialRequest(payload)
      const principalRemaining = created.principal_kg_remaining ?? undefined
      if (replenishmentMode) {
        toast.success(MATERIAL_REQUEST_LABELS.replenishmentSaveSuccess)
      } else if (principalRemaining != null) {
        toast.success(
          `${MATERIAL_REQUEST_LABELS.saveSuccess} Quedan ${principalRemaining} kg en la principal.`,
        )
        void loadPrincipalBalance(workId)
      } else {
        toast.success(MATERIAL_REQUEST_LABELS.saveSuccess)
      }
      return { ok: true, workOrderId: workId, principalRemaining }
    } catch (error) {
      if (error instanceof ApiError && error.body.errors) {
        const next: Record<string, string> = {}
        for (const [key, messages] of Object.entries(error.body.errors)) {
          if (messages[0]) next[key] = messages[0]
        }
        setFieldErrors(next)
      }
      const message = error instanceof ApiError ? error.message : MATERIAL_REQUEST_LABELS.saveError
      toast.error(message)
      return { ok: false }
    } finally {
      setSaving(false)
    }
  }

  return {
    works,
    loadingWorks,
    workOrderId,
    setWorkOrderId,
    selectedWork,
    formatWorkLabel: formatPlantWorkLabel,
    notes,
    setNotes,
    originatingArea,
    setOriginatingArea,
    lines,
    patchLine,
    addLine,
    removeLine,
    saving,
    loadingMixtures,
    loadFromMixtures,
    loadFromInitialRecipe,
    previewTotalKg,
    principalBalance,
    loadingPrincipal,
    principalExhausted,
    replenishmentMode,
    setReplenishmentMode,
    openRequest,
    loadingOpenRequest,
    principalRemainingKg,
    principalRemainingByMaterial,
    getMaterialMaxKg,
    fieldErrors,
    submit,
    unitOptions: MATERIAL_REQUEST_UNITS,
  }
}
