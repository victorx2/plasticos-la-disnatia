import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { fetchTintaMixtures, fetchWorkMixtureBalance, type SubmezclaBalance, type WorkMixtureBalance } from "@/features/tinta-mixtures/api"
import { mixtureTotalKg } from "@/features/tinta-mixtures/domain/mixtureTotals"
import {
  formatPlantWorkLabel,
  usePlantWorkOptions,
} from "@/features/tinta-mixtures/hooks/usePlantWorkOptions"
import { MIXING_LABELS } from "@/features/tinta-mixtures/labels"
import {
  beginMixtureExtrusion,
  completeMixtureProduction,
  fetchMixtureProductionRuns,
  startMixtureProduction,
} from "@/features/tinta-mixtures/production-api"
import type { MixtureProductionRun } from "@/features/tinta-mixtures/production-types"
import type { TintaMixture } from "@/features/tinta-mixtures/types"
import { ApiError } from "@/shared/api/client"
import { formatKgDisplay, parseKgNumber } from "@/shared/format/numbers"
import { extrusionRegisterHref } from "@/features/production/shared/workProductionResume"

export { extrusionRegisterHref } from "@/features/production/shared/workProductionResume"

export function useMixtureProductionWizard(initialWorkOrderId?: number | null) {
  const { works, loading: loadingWorks } = usePlantWorkOptions()
  const [workOrderId, setWorkOrderId] = useState(
    initialWorkOrderId != null && initialWorkOrderId > 0 ? String(initialWorkOrderId) : "",
  )
  const [mixtures, setMixtures] = useState<TintaMixture[]>([])
  const [activeRuns, setActiveRuns] = useState<MixtureProductionRun[]>([])
  const [loadingMixtures, setLoadingMixtures] = useState(false)
  const [loadingRuns, setLoadingRuns] = useState(false)
  const [selectedMixtureId, setSelectedMixtureId] = useState("")
  const [starting, setStarting] = useState(false)
  const [submezclaBalance, setSubmezclaBalance] = useState<SubmezclaBalance | null>(null)
  const [principalBalance, setPrincipalBalance] = useState<WorkMixtureBalance["principal"]>(null)
  const [loadingBalance, setLoadingBalance] = useState(false)

  const workIdNum = Number(workOrderId)
  const validWorkId = Number.isFinite(workIdNum) && workIdNum > 0 ? workIdNum : null

  const selectedWork = useMemo(
    () => works.find((w) => String(w.id) === workOrderId) ?? null,
    [works, workOrderId],
  )

  const selectedMixture = useMemo(
    () => mixtures.find((m) => String(m.id) === selectedMixtureId) ?? null,
    [mixtures, selectedMixtureId],
  )

  const selectedMixtureKgLabel = useMemo(() => {
    if (submezclaBalance) {
      return formatKgDisplay(parseKgNumber(submezclaBalance.kg_available))
    }
    return selectedMixture ? mixtureTotalKg(selectedMixture) : "—"
  }, [selectedMixture, submezclaBalance])

  const selectedMixtureDispatchedLabel = submezclaBalance
    ? formatKgDisplay(parseKgNumber(submezclaBalance.kg_dispatched))
    : null

  const selectedMixturePendingLabel =
    submezclaBalance && parseKgNumber(submezclaBalance.kg_pending_warehouse) > 0
      ? formatKgDisplay(parseKgNumber(submezclaBalance.kg_pending_warehouse))
      : null

  const selectedMixtureProjectedLabel =
    submezclaBalance && parseKgNumber(submezclaBalance.kg_pending_warehouse) > 0
      ? formatKgDisplay(parseKgNumber(submezclaBalance.kg_after_pending_dispatch))
      : null

  const loadSubmezclaBalance = useCallback(async () => {
    if (!validWorkId) {
      setSubmezclaBalance(null)
      setPrincipalBalance(null)
      return
    }
    setLoadingBalance(true)
    try {
      const balance = await fetchWorkMixtureBalance(validWorkId)
      setSubmezclaBalance(balance?.submezcla ?? null)
      setPrincipalBalance(balance?.principal ?? null)
    } catch {
      setSubmezclaBalance(null)
      setPrincipalBalance(null)
    } finally {
      setLoadingBalance(false)
    }
  }, [validWorkId])

  const loadMixtures = useCallback(async () => {
    if (!validWorkId) {
      setMixtures([])
      return
    }
    setLoadingMixtures(true)
    try {
      const res = await fetchTintaMixtures({ work_order_id: validWorkId, per_page: 200, page: 1 })
      setMixtures(
        res.data.filter(
          (m) => m.mixture_kind === "submezcla" || m.mixture_kind === "manual" || !m.mixture_kind,
        ),
      )
    } catch (error) {
      setMixtures([])
      const message = error instanceof ApiError ? error.message : MIXING_LABELS.loadError
      toast.error(message)
    } finally {
      setLoadingMixtures(false)
    }
  }, [validWorkId])

  const loadRuns = useCallback(async () => {
    if (!validWorkId) {
      setActiveRuns([])
      return
    }
    setLoadingRuns(true)
    try {
      const res = await fetchMixtureProductionRuns({
        work_order_id: validWorkId,
        status: "in_progress",
        per_page: 100,
      })
      setActiveRuns(res.data)
    } catch (error) {
      setActiveRuns([])
      const message = error instanceof ApiError ? error.message : MIXING_LABELS.loadRunsError
      toast.error(message)
    } finally {
      setLoadingRuns(false)
    }
  }, [validWorkId])

  useEffect(() => {
    void loadMixtures()
    void loadRuns()
    void loadSubmezclaBalance()
  }, [loadMixtures, loadRuns, loadSubmezclaBalance])

  async function startProduction(): Promise<string | null> {
    const mixtureId = Number(selectedMixtureId)
    if (!validWorkId || !Number.isFinite(mixtureId) || mixtureId <= 0) {
      toast.error(MIXING_LABELS.selectMixture)
      return null
    }
    setStarting(true)
    try {
      const run = await startMixtureProduction({
        tinta_mixture_id: mixtureId,
        work_order_id: validWorkId,
      })
      await beginMixtureExtrusion(run.id)
      toast.success(MIXING_LABELS.startSuccess)
      await loadRuns()
      return extrusionRegisterHref(validWorkId, run.id)
    } catch (error) {
      const message = error instanceof ApiError ? error.message : MIXING_LABELS.startError
      toast.error(message)
      return null
    } finally {
      setStarting(false)
    }
  }

  async function continueExtrusion(run: MixtureProductionRun): Promise<string | null> {
    setStarting(true)
    try {
      await beginMixtureExtrusion(run.id)
      return extrusionRegisterHref(run.work_order_id, run.id)
    } catch (error) {
      const message = error instanceof ApiError ? error.message : MIXING_LABELS.startError
      toast.error(message)
      return null
    } finally {
      setStarting(false)
    }
  }

  async function saveRemainingMixture(
    runId: number,
    remainingKg: string,
    reason?: string,
  ): Promise<boolean> {
    try {
      await completeMixtureProduction(runId, {
        fully_used: false,
        remaining_kg: remainingKg,
        reason: reason?.trim() || null,
      })
      toast.success(MIXING_LABELS.completeSuccess)
      return true
    } catch (error) {
      const message = error instanceof ApiError ? error.message : MIXING_LABELS.completeError
      toast.error(message)
      return false
    }
  }

  return {
    works,
    loadingWorks,
    workOrderId,
    setWorkOrderId,
    validWorkId,
    selectedWork,
    formatWorkLabel: formatPlantWorkLabel,
    mixtures,
    loadingMixtures,
    activeRuns,
    loadingRuns,
    selectedMixtureId,
    setSelectedMixtureId,
    selectedMixture,
    selectedMixtureKgLabel,
    selectedMixtureDispatchedLabel,
    selectedMixturePendingLabel,
    selectedMixtureProjectedLabel,
    loadingBalance,
    submezclaBalance,
    principalBalance,
    starting,
    startProduction,
    continueExtrusion,
    saveRemainingMixture,
    reloadRuns: loadRuns,
    reloadBalance: loadSubmezclaBalance,
  }
}
