import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import {
  createSealingRun,
  fetchAllPlantWorksForSealing,
  fetchSealingExtrusionCoils,
} from "@/features/production/sealing/api"
import { SEALING_LABELS } from "@/features/production/sealing/labels"
import { SEALING_SHIFTS, type SealingShift } from "@/features/production/sealing/types"
import type { ProductionOrderRow } from "@/features/programacion/types"
import { ApiError } from "@/shared/api/client"
import { parseKgNumber } from "@/shared/format/numbers"

type BobinaLineDraft = {
  key: string
  extrusion_coil_id: number | null
  coil_code: string
  measure: string
  units: string
  production_kg: string
  waste_kg: string
}

type TimerState = "idle" | "running" | "paused"

let lineKeySeq = 0

function newLineKey(): string {
  lineKeySeq += 1
  return `sline-${lineKeySeq}`
}

function emptyLine(): BobinaLineDraft {
  return {
    key: newLineKey(),
    extrusion_coil_id: null,
    coil_code: "",
    measure: "",
    units: "",
    production_kg: "",
    waste_kg: "",
  }
}

function lineFromExtrusionCoil(coil: {
  id: number
  coil_code: string
  production_kg: string
  measure?: string | null
}): BobinaLineDraft {
  return {
    key: newLineKey(),
    extrusion_coil_id: coil.id,
    coil_code: coil.coil_code,
    measure: coil.measure ?? "",
    units: "",
    production_kg: coil.production_kg,
    waste_kg: "",
  }
}

export function useSealingRegisterForm(initialWorkOrderId: number | null) {
  const [works, setWorks] = useState<ProductionOrderRow[]>([])
  const [loadingWorks, setLoadingWorks] = useState(true)
  const [workOrderId, setWorkOrderId] = useState(
    initialWorkOrderId != null && initialWorkOrderId > 0 ? String(initialWorkOrderId) : "",
  )
  const [shift, setShift] = useState<SealingShift>(SEALING_SHIFTS[0])
  const [notes, setNotes] = useState("")
  const [lines, setLines] = useState<BobinaLineDraft[]>([emptyLine()])
  const [loadingCoils, setLoadingCoils] = useState(false)
  const [extrusionCoilCount, setExtrusionCoilCount] = useState(0)
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [timerState, setTimerState] = useState<TimerState>("idle")
  const [timerElapsedMs, setTimerElapsedMs] = useState(0)
  const [timerStartedAt, setTimerStartedAt] = useState<string | null>(null)
  const timerTickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerBaseRef = useRef(0)
  const timerRunStartRef = useRef<number | null>(null)

  const timerDisplaySeconds = Math.floor(timerElapsedMs / 1000)

  const stopTimerTick = useCallback(() => {
    if (timerTickRef.current) {
      clearInterval(timerTickRef.current)
      timerTickRef.current = null
    }
  }, [])

  const loadExtrusionCoils = useCallback(async (workId: number) => {
    setLoadingCoils(true)
    try {
      const coils = await fetchSealingExtrusionCoils(workId)
      setExtrusionCoilCount(coils.length)
      if (coils.length) {
        setLines(coils.map((coil) => lineFromExtrusionCoil(coil)))
      } else {
        setLines([emptyLine()])
      }
    } catch {
      setExtrusionCoilCount(0)
      setLines([emptyLine()])
      toast.error(SEALING_LABELS.loadError)
    } finally {
      setLoadingCoils(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoadingWorks(true)
      try {
        const data = await fetchAllPlantWorksForSealing()
        if (!cancelled) setWorks(data)
      } catch {
        if (!cancelled) toast.error(SEALING_LABELS.loadError)
      } finally {
        if (!cancelled) setLoadingWorks(false)
      }
    })()
    return () => {
      cancelled = true
      stopTimerTick()
    }
  }, [stopTimerTick])

  useEffect(() => {
    const workId = Number(workOrderId)
    if (!Number.isFinite(workId) || workId <= 0) {
      setExtrusionCoilCount(0)
      setLines([emptyLine()])
      return
    }
    void loadExtrusionCoils(workId)
  }, [workOrderId, loadExtrusionCoils])

  function startTimer() {
    if (timerState === "running") return
    timerRunStartRef.current = Date.now()
    if (!timerStartedAt) setTimerStartedAt(new Date().toISOString())
    setTimerState("running")
    stopTimerTick()
    timerTickRef.current = setInterval(() => {
      const runStart = timerRunStartRef.current
      if (runStart == null) return
      setTimerElapsedMs(timerBaseRef.current + (Date.now() - runStart))
    }, 500)
  }

  function pauseTimer() {
    if (timerState !== "running") return
    stopTimerTick()
    timerBaseRef.current = timerElapsedMs
    timerRunStartRef.current = null
    setTimerState("paused")
  }

  function stopTimer() {
    stopTimerTick()
    if (timerState === "running" && timerRunStartRef.current != null) {
      timerBaseRef.current = timerElapsedMs
    }
    timerRunStartRef.current = null
    setTimerState("idle")
  }

  function patchLine(key: string, partial: Partial<BobinaLineDraft>) {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...partial } : line)))
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine()])
  }

  function removeLine(key: string) {
    setLines((prev) => {
      const next = prev.filter((line) => line.key !== key)
      return next.length ? next : [emptyLine()]
    })
  }

  const selectedWork = useMemo(
    () => works.find((w) => String(w.id) === workOrderId) ?? null,
    [works, workOrderId],
  )

  const extrusionSummary = useMemo(() => {
    const withKg = lines.filter((line) => parseKgNumber(line.production_kg) > 0)
    const totalKg = withKg.reduce((sum, line) => sum + parseKgNumber(line.production_kg), 0)
    return {
      bobinaCount: withKg.length,
      totalKg,
    }
  }, [lines])

  async function submit(): Promise<boolean> {
    const workId = Number(workOrderId)
    const errors: Record<string, string> = {}
    if (!Number.isFinite(workId) || workId <= 0) {
      errors.work = SEALING_LABELS.validation.workRequired
    }

    const bobinaLines = lines
      .filter((line) => line.units.trim() || line.production_kg.trim())
      .map((line) => ({
        extrusion_coil_id: line.extrusion_coil_id ?? undefined,
        coil_code: line.coil_code.trim() || null,
        measure: line.measure.trim() || null,
        units: parseKgNumber(line.units),
        production_kg: parseKgNumber(line.production_kg) || undefined,
        waste_kg: parseKgNumber(line.waste_kg) || undefined,
      }))
      .filter((line) => line.units > 0)

    if (!bobinaLines.length) {
      errors.lines = SEALING_LABELS.validation.linesRequired
    }

    setFieldErrors(errors)
    if (Object.keys(errors).length) return false

    setSaving(true)
    try {
      const totalLineWaste = bobinaLines.reduce((sum, line) => sum + (line.waste_kg ?? 0), 0)
      await createSealingRun({
        work_order_id: workId,
        shift,
        started_at: timerStartedAt ?? undefined,
        ended_at: new Date().toISOString(),
        effective_minutes: Math.round(timerElapsedMs / 60000),
        waste_kg: totalLineWaste || undefined,
        notes: notes.trim() || null,
        bobina_lines: bobinaLines,
      })
      toast.success(SEALING_LABELS.saveSuccess)
      return true
    } catch (error) {
      const message = error instanceof ApiError ? error.message : SEALING_LABELS.saveError
      toast.error(message)
      return false
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
    shift,
    setShift,
    notes,
    setNotes,
    lines,
    patchLine,
    addLine,
    removeLine,
    loadingCoils,
    extrusionCoilCount,
    extrusionSummary,
    saving,
    fieldErrors,
    timerState,
    timerDisplaySeconds,
    startTimer,
    pauseTimer,
    stopTimer,
    submit,
  }
}
