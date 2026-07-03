// 1. Librerías Externas
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

// 2. Client de APIs y Endpoints del Dominio
import {
  addExtrusionSegment,
  closeExtrusionSession,
  createExtrusionSession,
  fetchActiveExtrusionSession,
  fetchAllPlantWorks,
  fetchExtrusionReassignWorks,
  fetchExtrusionStageWorks,
  reassignExtrusionRun,
} from "@/features/production/extrusion/api"
import { fetchWorkMixtureBalance } from "@/features/tinta-mixtures/api"
import { returnMixtureToWarehouse } from "@/features/tinta-mixtures/production-api"

// 3. Labels y Constantes de Extrusión
import { EXTRUSION_REGISTER_LABELS } from "@/features/production/extrusion/labels"
import {
  dumpExtrusionTimerStorage,
  logExtrusionTimer,
} from "@/features/production/extrusion/lib/extrusionTimerDebug"

// 4. Tipos del Feature y otros Módulos
import {
  EXTRUSION_FORMATS,
  EXTRUSION_MACHINE_LINES,
  EXTRUSION_MAX_COILS_PER_SEGMENT,
  EXTRUSION_MICRON_COUNT,
  EXTRUSION_MICRON_GRID_ROWS,
  EXTRUSION_SHIFTS,
  type ExtrusionFormat,
  type ExtrusionSegmentInput,
  type ExtrusionSegmentRead,
  type ExtrusionShift,
  type TimerState,
} from "@/features/production/extrusion/types"
import type { ProductionOrderRow } from "@/features/programacion/types"

// 5. Utilidades Generales y Core Compartido (@/shared)
import { getStoredUser } from "@/shared/auth/session"
import { ApiError } from "@/shared/api/client"
import { formatKgDisplay, parseKgNumber } from "@/shared/format/numbers"


// import { useCallback, useEffect, useMemo, useRef, useState } from "react"
// import { toast } from "sonner"
// 
// import {
//   addExtrusionSegment,
//   closeExtrusionSession,
//   createExtrusionSession,
//   fetchActiveExtrusionSession,
//   fetchAllPlantWorks,
//   fetchExtrusionStageWorks,
// } from "@/features/production/extrusion/api"
// import { EXTRUSION_REGISTER_LABELS } from "@/features/production/extrusion/labels"
// import { fetchWorkMixtureBalance } from "@/features/tinta-mixtures/api"
// import {
//   EXTRUSION_FORMATS,
//   EXTRUSION_MACHINE_LINES,
//   EXTRUSION_MAX_COILS_PER_SEGMENT,
//   EXTRUSION_MICRON_COUNT,
//   EXTRUSION_MICRON_GRID_ROWS,
//   EXTRUSION_SHIFTS,
//   type ExtrusionFormat,
//   type ExtrusionSegmentInput,
//   type ExtrusionSegmentRead,
//   type ExtrusionShift,
//   type TimerState,
// } from "@/features/production/extrusion/types"
// import type { ProductionOrderRow } from "@/features/programacion/types"
// import { getStoredUser } from "@/shared/auth/session"
// import { ApiError } from "@/shared/api/client"
// import { parseKgNumber } from "@/shared/format/numbers"

export type CoilDraft = {
  key: string
  microns: string[]
  kg: string
}

export type RemainingMixtureModal = {
  remainingKg: number
  context: "register" | "dispatch" | "sealing"
  navigateHref?: string
}

const DRAFT_PREFIX = "extrusion-register-draft:"
const MICRONS_OPEN_PREFIX = "extrusion-microns-open:"
const TIMER_PREFIX = "extrusion-timer:"
const TIMER_WO_PREFIX = "extrusion-timer-wo:"

type TimerStorage = {
  state: TimerState
  elapsedMs: number
  startedAt: string | null
  baseTime: number
  sessionId: number | null
  machine?: string | null
  /** Epoch ms del tramo en curso; permite recuperar tiempo real tras recargar. */
  runStartedAtMs?: number | null
  /** Inicio del tramo (reloj de pared); base para recuperar tiempo tras recarga o pestaña en segundo plano. */
  anchorWallMs?: number | null
  /** Milisegundos acumulados en pausas del tramo. */
  pausedTotalMs?: number
  /** true si el operador pulsó Pausar; false si la pausa vino de recarga/migración. */
  pausedByUser?: boolean
  /** Epoch ms cuando empezó la pausa actual (solo si state === paused). */
  pauseStartedWallMs?: number | null
}

function resolveTimerElapsedMs(saved: TimerStorage, now = Date.now()): number {
  const anchor = saved.anchorWallMs
  if (anchor != null && anchor > 0) {
    const pausedTotal = saved.pausedTotalMs ?? 0
    if (saved.state === "paused") {
      const pauseStart = saved.pauseStartedWallMs ?? now
      return Math.max(0, pauseStart - anchor - pausedTotal)
    }
    if (saved.state === "running") {
      return Math.max(0, now - anchor - pausedTotal)
    }
  }

  const base = Math.max(saved.elapsedMs, saved.baseTime)
  if (
    saved.state === "running" &&
    saved.runStartedAtMs != null &&
    saved.runStartedAtMs > 0
  ) {
    return base + Math.max(0, now - saved.runStartedAtMs)
  }
  return base
}

function ensureAnchorWallMs(saved: TimerStorage, now = Date.now()): TimerStorage {
  if (saved.anchorWallMs != null && saved.anchorWallMs > 0) return saved
  const elapsed = Math.max(saved.elapsedMs, saved.baseTime)
  if (elapsed <= 0) return saved
  if (saved.startedAt) {
    const parsed = Date.parse(saved.startedAt)
    if (Number.isFinite(parsed) && parsed > 0) {
      return { ...saved, anchorWallMs: parsed }
    }
  }
  return { ...saved, anchorWallMs: now - elapsed }
}

function timerMachineSuffix(machine: string): string {
  const m = machine.trim()
  return m ? `:m${m}` : ""
}

function isValidMachineLine(machine: string): boolean {
  return EXTRUSION_MACHINE_LINES.includes(machine as (typeof EXTRUSION_MACHINE_LINES)[number])
}

function readTimerStorage(key: string): TimerStorage | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as TimerStorage
  } catch {
    return null
  }
}

function writeTimerStorage(key: string, state: TimerStorage): void {
  try {
    localStorage.setItem(key, JSON.stringify(state))
  } catch {
    // ignore
  }
}

function removeTimerStorage(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

function loadMicronsOpen(workOrderId: string): boolean {
  if (!workOrderId) return false
  try {
    return sessionStorage.getItem(`${MICRONS_OPEN_PREFIX}${workOrderId}`) === "1"
  } catch {
    return false
  }
}

function saveMicronsOpen(workOrderId: string, open: boolean): void {
  if (!workOrderId) return
  try {
    sessionStorage.setItem(`${MICRONS_OPEN_PREFIX}${workOrderId}`, open ? "1" : "0")
  } catch {
    // ignore
  }
}

function loadTimerState(sessionId: number | null, machine = ""): TimerStorage | null {
  if (!sessionId || sessionId <= 0) return null
  const suffix = timerMachineSuffix(machine)
  if (suffix) {
    const scoped = readTimerStorage(`${TIMER_PREFIX}${sessionId}${suffix}`)
    if (scoped) return scoped
  }
  return readTimerStorage(`${TIMER_PREFIX}${sessionId}`)
}

function loadTimerStateForWork(workOrderId: string, machine = ""): TimerStorage | null {
  if (!workOrderId) return null
  const suffix = timerMachineSuffix(machine)
  if (suffix) {
    const scoped = readTimerStorage(`${TIMER_WO_PREFIX}${workOrderId}${suffix}`)
    if (scoped) return scoped
    return null
  }
  return readTimerStorage(`${TIMER_WO_PREFIX}${workOrderId}`)
}

function loadTimerForContext(
  sessionId: number | null,
  workOrderId: string,
  machine: string,
): TimerStorage | null {
  if (machine && isValidMachineLine(machine)) {
    const scoped =
      loadTimerState(sessionId, machine) ?? loadTimerStateForWork(workOrderId, machine)
    if (scoped) {
      logExtrusionTimer("loadTimerForContext", {
        workOrderId,
        sessionId,
        machine,
        source: "scoped",
        elapsedMs: scoped.elapsedMs,
        state: scoped.state,
      })
      return scoped
    }

    const legacySession = sessionId ? loadTimerState(sessionId) : null
    const legacyWork = loadTimerStateForWork(workOrderId)
    const legacy = legacySession ?? legacyWork
    if (legacy && (legacy.state !== "idle" || legacy.elapsedMs > 0)) {
      const migrated = ensureAnchorWallMs({
        ...legacy,
        machine,
        pausedByUser: false,
        pauseStartedWallMs: legacy.state === "paused" ? Date.now() : null,
      })
      persistTimerSnapshot(sessionId, workOrderId, machine, migrated)
      clearTimerState(sessionId, workOrderId)
      logExtrusionTimer("loadTimerForContext LEGACY_MIGRATED", {
        workOrderId,
        sessionId,
        machine,
        elapsedMs: migrated.elapsedMs,
      })
      return migrated
    }

    logExtrusionTimer("loadTimerForContext", {
      workOrderId,
      sessionId,
      machine,
      source: "none",
      elapsedMs: 0,
      state: "none",
    })
    return null
  }

  const legacySession = sessionId ? loadTimerState(sessionId) : null
  const legacyWork = loadTimerStateForWork(workOrderId)
  if (legacySession || legacyWork) {
    logExtrusionTimer("loadTimerForContext LEGACY_SKIP", {
      workOrderId,
      sessionId,
      machine: machine || "(vacío)",
      legacySessionMs: legacySession?.elapsedMs ?? 0,
      legacyWorkMs: legacyWork?.elapsedMs ?? 0,
      hint: "Seleccione línea para cargar timer por máquina; claves viejas ignoradas",
    })
  }
  return null
}

function saveTimerState(sessionId: number | null, state: TimerStorage, machine = ""): void {
  if (!sessionId || sessionId <= 0) return
  const suffix = timerMachineSuffix(machine)
  writeTimerStorage(`${TIMER_PREFIX}${sessionId}${suffix}`, state)
}

function saveTimerStateForWork(workOrderId: string, state: TimerStorage, machine = ""): void {
  if (!workOrderId) return
  const suffix = timerMachineSuffix(machine)
  writeTimerStorage(`${TIMER_WO_PREFIX}${workOrderId}${suffix}`, state)
}

function persistTimerSnapshot(
  sessionId: number | null,
  workOrderId: string,
  machine: string,
  snapshot: TimerStorage,
): void {
  const withMachine = { ...snapshot, machine: machine || snapshot.machine || null }
  if (machine && isValidMachineLine(machine)) {
    if (sessionId && sessionId > 0) saveTimerState(sessionId, withMachine, machine)
    saveTimerStateForWork(workOrderId, withMachine, machine)
    logExtrusionTimer("persistTimerSnapshot", {
      workOrderId,
      sessionId,
      machine,
      state: withMachine.state,
      elapsedMs: withMachine.elapsedMs,
      keys: [
        `${TIMER_WO_PREFIX}${workOrderId}:m${machine}`,
        sessionId ? `${TIMER_PREFIX}${sessionId}:m${machine}` : null,
      ].filter(Boolean),
    })
    return
  }
  if (sessionId && sessionId > 0) saveTimerState(sessionId, withMachine)
  saveTimerStateForWork(workOrderId, withMachine)
  logExtrusionTimer("persistTimerSnapshot LEGACY", { workOrderId, sessionId, machine })
}

function clearTimerState(sessionId: number | null, workOrderId?: string, machine = ""): void {
  const suffix = timerMachineSuffix(machine)
  if (sessionId && sessionId > 0) {
    removeTimerStorage(`${TIMER_PREFIX}${sessionId}${suffix}`)
    if (!suffix) removeTimerStorage(`${TIMER_PREFIX}${sessionId}`)
  }
  if (workOrderId) {
    removeTimerStorage(`${TIMER_WO_PREFIX}${workOrderId}${suffix}`)
    if (!suffix) removeTimerStorage(`${TIMER_WO_PREFIX}${workOrderId}`)
  }
}

let coilKeySeq = 0

function newCoilKey(): string {
  coilKeySeq += 1
  return `coil-${coilKeySeq}`
}

function emptyMicrons(): string[] {
  return Array.from({ length: EXTRUSION_MICRON_COUNT }, () => "")
}

function fixedCoils(): CoilDraft[] {
  return Array.from({ length: EXTRUSION_MICRON_GRID_ROWS }, () => ({
    key: newCoilKey(),
    microns: emptyMicrons(),
    kg: "",
  }))
}

function defaultRecordedTime(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

function parseOptionalMicron(raw: string): number | null {
  const trimmed = raw.trim().replace(",", ".")
  if (!trimmed) return null
  const n = Number(trimmed)
  if (!Number.isFinite(n) || n < 0) return null
  return n
}

function parsePositiveKg(raw: string): number | null {
  const n = parseKgNumber(raw)
  if (n <= 0) return null
  return n
}

function resolveProductMeasure(work: ProductionOrderRow | null): string {
  if (!work) return "—"
  const product = work.product?.name ?? "—"
  if (work.order_quantity) {
    const unit = work.order_unit ? ` ${work.order_unit}` : ""
    return `${product} · ${work.order_quantity}${unit}`
  }
  return product
}

type DraftSnapshot = {
  workOrderId: string
  shift: ExtrusionShift
  recordedAt: string
  machine: string
  productionFormat: ExtrusionFormat | ""
  reassignWorkOrderId: string
  wasteRefilKg: string
  wasteTransparenteKg: string
  bolsonesKg: string
  fallasKg: string
  coreKg: string
  producedKg: string
  coilsCount: string
  coils: CoilDraft[]
  /** @deprecated Timer ya no se guarda en sessionStorage draft */
  timerElapsedMs?: number
  timerState?: TimerState
  timerStartedAt?: string | null
}

function loadDraft(workOrderId: string): Partial<DraftSnapshot> | null {
  try {
    const raw = sessionStorage.getItem(`${DRAFT_PREFIX}${workOrderId}`)
    if (!raw) return null
    return JSON.parse(raw) as Partial<DraftSnapshot>
  } catch {
    return null
  }
}

function saveDraft(workOrderId: string, snapshot: DraftSnapshot): void {
  try {
    sessionStorage.setItem(`${DRAFT_PREFIX}${workOrderId}`, JSON.stringify(snapshot))
  } catch {
    // ignore
  }
}

function clearDraft(workOrderId: string): void {
  try {
    sessionStorage.removeItem(`${DRAFT_PREFIX}${workOrderId}`)
  } catch {
    // ignore
  }
}

export function useExtrusionRegisterForm(
  initialWorkOrderId?: number | null,
  initialMixtureRunId?: number | null,
) {
  const [works, setWorks] = useState<ProductionOrderRow[]>([])
  const [allWorks, setAllWorks] = useState<ProductionOrderRow[]>([])
  const [reassignWorks, setReassignWorks] = useState<ProductionOrderRow[]>([])
  const [loadingWorks, setLoadingWorks] = useState(true)
  const [worksError, setWorksError] = useState<string | null>(null)
  const [workOrderId, setWorkOrderId] = useState(
    initialWorkOrderId != null && initialWorkOrderId > 0 ? String(initialWorkOrderId) : "",
  )
  const [mixtureRunId, setMixtureRunId] = useState<number | null>(
    initialMixtureRunId != null && initialMixtureRunId > 0 ? initialMixtureRunId : null,
  )
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [segments, setSegments] = useState<ExtrusionSegmentRead[]>([])
  const [sessionTotalKg, setSessionTotalKg] = useState(0)
  const [sessionTotalMinutes, setSessionTotalMinutes] = useState(0)
  const [mixtureInitialKg, setMixtureInitialKg] = useState(0)
  const [mixtureDispatchedKg, setMixtureDispatchedKg] = useState(0)
  const [loadingSession, setLoadingSession] = useState(false)

  const [shift, setShift] = useState<ExtrusionShift>(EXTRUSION_SHIFTS[0])
  const [recordedAt, setRecordedAt] = useState(defaultRecordedTime)
  const [machine, setMachine] = useState("")
  const [productionFormat, setProductionFormat] = useState<ExtrusionFormat | "">("")
  const [reassignWorkOrderId, setReassignWorkOrderId] = useState("")
  const [mixtureSourceWorkOrderId, setMixtureSourceWorkOrderId] = useState("")
  const [wasteRefilKg, setWasteRefilKg] = useState("")
  const [wasteTransparenteKg, setWasteTransparenteKg] = useState("")
  const [bolsonesKg, setBolsonesKg] = useState("")
  const [fallasKg, setFallasKg] = useState("")
  const [coreKg, setCoreKg] = useState("")
  const [producedKg, setProducedKg] = useState("")
  const [coilsCount, setCoilsCount] = useState("")
  const [coils, setCoils] = useState<CoilDraft[]>(fixedCoils)
  const [micronsOpen, setMicronsOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [remainingModal, setRemainingModal] = useState<RemainingMixtureModal | null>(null)
  const [returnMixtureKg, setReturnMixtureKg] = useState("")
  const [returningMixture, setReturningMixture] = useState(false)

  const [timerState, setTimerState] = useState<TimerState>("idle")
  const [timerElapsedMs, setTimerElapsedMs] = useState(0)
  const [timerStartedAt, setTimerStartedAt] = useState<string | null>(null)
  const timerTickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerBaseRef = useRef(0)
  const timerRunStartRef = useRef<number | null>(null)
  const timerStartedAtRef = useRef<string | null>(null)
  const anchorWallMsRef = useRef<number | null>(null)
  const pausedTotalMsRef = useRef(0)
  const pausedByUserRef = useRef(false)
  const pauseStartedWallMsRef = useRef<number | null>(null)
  const autoTimerStartedRef = useRef(false)
  const blockTimerAutoStartRef = useRef(false)
  const timerPersistReadyRef = useRef(false)
  const prevWorkOrderIdRef = useRef(workOrderId)
  const prevMachineRef = useRef(machine)
  const timerStateRef = useRef(timerState)
  const timerElapsedMsRef = useRef(timerElapsedMs)
  const sessionIdRef = useRef(sessionId)
  const workOrderIdRef = useRef(workOrderId)
  const machineRef = useRef(machine)

  timerStateRef.current = timerState
  timerElapsedMsRef.current = timerElapsedMs
  sessionIdRef.current = sessionId
  workOrderIdRef.current = workOrderId
  machineRef.current = machine
  timerStartedAtRef.current = timerStartedAt

  const operatorName = getStoredUser()?.name ?? "Operador"

  const workLocked = Boolean(
    mixtureRunId != null && mixtureRunId > 0,
  )

  const workSelectOptions = useMemo(() => {
    if (!workOrderId) return works
    const id = Number(workOrderId)
    if (!Number.isFinite(id) || id <= 0) return works
    if (works.some((w) => w.id === id)) return works
    const current = allWorks.find((w) => w.id === id)
    if (current) return [current, ...works]
    return works
  }, [works, allWorks, workOrderId])

  const selectedWork = useMemo(() => {
    const fromList =
      workSelectOptions.find((w) => String(w.id) === workOrderId) ??
      allWorks.find((w) => String(w.id) === workOrderId)
    return fromList ?? null
  }, [workSelectOptions, allWorks, workOrderId])

  const productMeasure = useMemo(() => resolveProductMeasure(selectedWork), [selectedWork])

  const segmentTotalKg = useMemo(() => {
    const simple = parseKgNumber(producedKg)
    if (simple > 0) return simple
    return coils.reduce((sum, row) => sum + parseKgNumber(row.kg), 0)
  }, [producedKg, coils])

  const segmentTotalCoils = useMemo(() => {
    const count = Number(coilsCount.trim())
    if (Number.isFinite(count) && count > 0) return count
    return coils.filter((row) => parseKgNumber(row.kg) > 0).length
  }, [coilsCount, coils])

  const mixtureBudgetKg = useMemo(() => {
    if (mixtureDispatchedKg > 0) return mixtureDispatchedKg
    if (mixtureInitialKg > 0) return mixtureInitialKg
    return 0
  }, [mixtureDispatchedKg, mixtureInitialKg])

  const mixtureRemainingKg = useMemo(() => {
    if (mixtureDispatchedKg > 0) {
      const available = mixtureInitialKg >= 0 ? mixtureInitialKg : mixtureDispatchedKg
      return Math.max(0, available - segmentTotalKg)
    }
    if (mixtureBudgetKg <= 0) return 0
    return Math.max(0, mixtureBudgetKg - sessionTotalKg - segmentTotalKg)
  }, [mixtureDispatchedKg, mixtureInitialKg, mixtureBudgetKg, sessionTotalKg, segmentTotalKg])

  const mixtureOverProductionKg = useMemo(() => {
    if (mixtureDispatchedKg <= 0 || segmentTotalKg <= 0) return 0
    const available =
      mixtureInitialKg > 0 ? mixtureInitialKg : Math.max(0, mixtureDispatchedKg - sessionTotalKg)
    const over = segmentTotalKg - available
    return over > 0.001 ? over : 0
  }, [mixtureDispatchedKg, mixtureInitialKg, sessionTotalKg, segmentTotalKg])

  const syncSubmezclaBalance = useCallback(async (workId: number) => {
    const balance = await fetchWorkMixtureBalance(workId)
    const sub = balance?.submezcla
    if (sub) {
      const available = parseKgNumber(sub.kg_available)
      const dispatched = parseKgNumber(sub.kg_dispatched)
      setMixtureInitialKg(available)
      setMixtureDispatchedKg(dispatched)
      return available
    }
    return null
  }, [])

  const timerDisplaySeconds = Math.floor(timerElapsedMs / 1000)

  const stopTimerTick = useCallback(() => {
    if (timerTickRef.current) {
      clearInterval(timerTickRef.current)
      timerTickRef.current = null
    }
  }, [])

  const resumeTimerTick = useCallback(() => {
    stopTimerTick()
    timerTickRef.current = setInterval(() => {
      if (timerRunStartRef.current == null) return
      const anchor = anchorWallMsRef.current
      if (anchor != null && anchor > 0) {
        setTimerElapsedMs(
          resolveTimerElapsedMs({
            state: "running",
            elapsedMs: 0,
            baseTime: 0,
            startedAt: null,
            sessionId: null,
            anchorWallMs: anchor,
            pausedTotalMs: pausedTotalMsRef.current,
          }),
        )
        return
      }
      setTimerElapsedMs(timerBaseRef.current + (Date.now() - timerRunStartRef.current))
    }, 200)
  }, [stopTimerTick])

  const buildTimerSnapshot = useCallback((forcePaused = false): TimerStorage => {
    const now = Date.now()
    let state = timerStateRef.current
    if (forcePaused && state === "running") state = "paused"

    const anchorWallMs = anchorWallMsRef.current
    const pausedTotalMs = pausedTotalMsRef.current
    const pausedByUser = pausedByUserRef.current
    const pauseStartedWallMs =
      state === "paused" ? (pauseStartedWallMsRef.current ?? now) : null

    const partial: TimerStorage = {
      state,
      elapsedMs: 0,
      startedAt: forcePaused && state === "paused" ? null : timerStartedAtRef.current,
      baseTime: 0,
      sessionId: sessionIdRef.current,
      machine: machineRef.current || null,
      runStartedAtMs: state === "running" && !forcePaused ? now : null,
      anchorWallMs,
      pausedTotalMs,
      pausedByUser,
      pauseStartedWallMs,
    }
    const elapsed = resolveTimerElapsedMs(partial, now)
    if (state === "running" && timerRunStartRef.current != null && anchorWallMs == null) {
      const tickElapsed = timerBaseRef.current + (now - timerRunStartRef.current)
      return {
        ...partial,
        elapsedMs: tickElapsed,
        baseTime: tickElapsed,
      }
    }
    return {
      ...partial,
      elapsedMs: elapsed,
      baseTime: elapsed,
    }
  }, [])

  const flushTimerToStorage = useCallback(
    (targetMachine: string, forcePaused = false) => {
      const wo = workOrderIdRef.current
      if (!wo) return
      const machineLine = targetMachine.trim()
      if (!machineLine || !isValidMachineLine(machineLine)) return
      const snapshot = buildTimerSnapshot(forcePaused)
      persistTimerSnapshot(sessionIdRef.current, wo, machineLine, snapshot)
    },
    [buildTimerSnapshot],
  )

  const freezeRunningTimer = useCallback((): number | null => {
    if (timerStateRef.current !== "running" || timerRunStartRef.current == null) return null
    const now = Date.now()
    const elapsed = resolveTimerElapsedMs(
      {
        state: "running",
        elapsedMs: timerElapsedMsRef.current,
        baseTime: timerBaseRef.current,
        startedAt: timerStartedAtRef.current,
        sessionId: sessionIdRef.current,
        anchorWallMs: anchorWallMsRef.current,
        pausedTotalMs: pausedTotalMsRef.current,
        runStartedAtMs: timerRunStartRef.current,
      },
      now,
    )
    timerBaseRef.current = elapsed
    timerRunStartRef.current = null
    pauseStartedWallMsRef.current = now
    pausedByUserRef.current = false
    setTimerElapsedMs(elapsed)
    setTimerStartedAt(null)
    setTimerState("paused")
    stopTimerTick()
    return elapsed
  }, [stopTimerTick])

  const applyTimerFromStorage = useCallback(
    (saved: TimerStorage) => {
      autoTimerStartedRef.current = true
      stopTimerTick()

      const normalized = ensureAnchorWallMs(saved)
      const elapsed = resolveTimerElapsedMs(normalized)
      anchorWallMsRef.current = normalized.anchorWallMs ?? null
      pausedTotalMsRef.current = normalized.pausedTotalMs ?? 0
      pausedByUserRef.current = normalized.pausedByUser ?? false
      pauseStartedWallMsRef.current = normalized.pauseStartedWallMs ?? null

      if (normalized.state === "running") {
        timerBaseRef.current = elapsed
        setTimerElapsedMs(elapsed)
        timerRunStartRef.current = Date.now()
        setTimerStartedAt(normalized.startedAt)
        setTimerState("running")
        resumeTimerTick()
        return
      }

      timerBaseRef.current = elapsed
      setTimerElapsedMs(elapsed)
      timerRunStartRef.current = null
      setTimerState(normalized.state)
      setTimerStartedAt(normalized.startedAt)
    },
    [stopTimerTick, resumeTimerTick],
  )

  const hydrateTimer = useCallback(
    (
      sessionNum: number | null,
      workId: number,
      machineLine: string,
      draft?: Partial<DraftSnapshot> | null,
    ): boolean => {
      logExtrusionTimer("hydrateTimer", {
        workId,
        sessionNum,
        machineLine: machineLine || "(vacío)",
        draftMachine: draft?.machine ?? null,
        draftTimerMs: draft?.timerElapsedMs ?? null,
        draftTimerState: draft?.timerState ?? null,
      })

      if (draft?.timerElapsedMs != null || draft?.timerState) {
        logExtrusionTimer("hydrateTimer DRAFT_TIMER_IGNORED", {
          workId,
          draftTimerMs: draft?.timerElapsedMs ?? 0,
          draftTimerState: draft?.timerState ?? "none",
          hint: "Timer solo en localStorage por máquina; limpie draft viejo si choca",
        })
      }

      const saved = loadTimerForContext(sessionNum, String(workId), machineLine)
      if (saved && (saved.state !== "idle" || saved.elapsedMs > 0)) {
        logExtrusionTimer("hydrateTimer APPLY_STORAGE", {
          workId,
          machineLine,
          elapsedMs: saved.elapsedMs,
          state: saved.state,
          savedMachine: saved.machine ?? null,
        })
        applyTimerFromStorage(saved)
        return true
      }

      logExtrusionTimer("hydrateTimer EMPTY", { workId, machineLine })
      return false
    },
    [applyTimerFromStorage],
  )

  const resetTimerUi = useCallback(() => {
    stopTimerTick()
    timerBaseRef.current = 0
    timerRunStartRef.current = null
    timerStartedAtRef.current = null
    anchorWallMsRef.current = null
    pausedTotalMsRef.current = 0
    pausedByUserRef.current = false
    pauseStartedWallMsRef.current = null
    setTimerElapsedMs(0)
    setTimerStartedAt(null)
    setTimerState("idle")
    autoTimerStartedRef.current = false
  }, [stopTimerTick])

  const resetTimer = useCallback(() => {
    resetTimerUi()
    clearTimerState(sessionId, workOrderId, machine)
  }, [resetTimerUi, sessionId, workOrderId, machine])

  const startTimer = useCallback(() => {
    const line = machine.trim()
    if (!line || !isValidMachineLine(line)) {
      logExtrusionTimer("startTimer BLOCKED", { machine: line || "(vacío)", timerState, timerElapsedMs })
      return
    }
    logExtrusionTimer("startTimer", { machine: line, timerState, timerElapsedMs })
    const now = Date.now()
    const nowIso = new Date(now).toISOString()
    if (timerState === "idle") {
      timerStartedAtRef.current = nowIso
      setTimerStartedAt(nowIso)
      timerBaseRef.current = 0
      anchorWallMsRef.current = now
      pausedTotalMsRef.current = 0
      pausedByUserRef.current = false
      pauseStartedWallMsRef.current = null
      setRecordedAt(defaultRecordedTime())
    } else if (timerState === "paused") {
      timerStartedAtRef.current = nowIso
      setTimerStartedAt(nowIso)
      const pauseStart = pauseStartedWallMsRef.current
      if (pauseStart != null) {
        pausedTotalMsRef.current += now - pauseStart
      }
      pauseStartedWallMsRef.current = null
      pausedByUserRef.current = false
      timerBaseRef.current = timerElapsedMsRef.current
    }
    timerRunStartRef.current = now
    const elapsed =
      anchorWallMsRef.current != null
        ? resolveTimerElapsedMs({
            state: "running",
            elapsedMs: timerBaseRef.current,
            baseTime: timerBaseRef.current,
            startedAt: nowIso,
            sessionId: sessionIdRef.current,
            anchorWallMs: anchorWallMsRef.current,
            pausedTotalMs: pausedTotalMsRef.current,
          })
        : timerBaseRef.current
    setTimerElapsedMs(elapsed)
    setTimerState("running")
    resumeTimerTick()
  }, [machine, timerState, timerElapsedMs, resumeTimerTick])

  const pauseTimer = useCallback(() => {
    if (timerState !== "running" || timerRunStartRef.current == null) return
    const now = Date.now()
    const elapsed = resolveTimerElapsedMs(
      {
        state: "running",
        elapsedMs: timerElapsedMsRef.current,
        baseTime: timerBaseRef.current,
        startedAt: timerStartedAtRef.current,
        sessionId: sessionIdRef.current,
        anchorWallMs: anchorWallMsRef.current,
        pausedTotalMs: pausedTotalMsRef.current,
        runStartedAtMs: timerRunStartRef.current,
      },
      now,
    )
    timerBaseRef.current = elapsed
    setTimerElapsedMs(elapsed)
    pauseStartedWallMsRef.current = now
    pausedByUserRef.current = true
    setTimerStartedAt(null)
    setTimerState("paused")
    timerRunStartRef.current = null
    stopTimerTick()
    logExtrusionTimer("pauseTimer", { machine, elapsedMs: elapsed })
    flushTimerToStorage(machine, true)
  }, [timerState, stopTimerTick, machine, flushTimerToStorage])

  const persistTimerOnBackground = useCallback(() => {
    const line = machineRef.current.trim()
    if (!line || !isValidMachineLine(line)) return
    if (timerStateRef.current === "running" && timerRunStartRef.current != null) {
      const now = Date.now()
      const elapsed = resolveTimerElapsedMs(
        {
          state: "running",
          elapsedMs: timerElapsedMsRef.current,
          baseTime: timerBaseRef.current,
          startedAt: timerStartedAtRef.current,
          sessionId: sessionIdRef.current,
          anchorWallMs: anchorWallMsRef.current,
          pausedTotalMs: pausedTotalMsRef.current,
          runStartedAtMs: timerRunStartRef.current,
        },
        now,
      )
      timerBaseRef.current = elapsed
      timerRunStartRef.current = now
      setTimerElapsedMs(elapsed)
    }
    flushTimerToStorage(line, false)
    logExtrusionTimer("persistTimerOnBackground", {
      machine: line,
      timerState: timerStateRef.current,
      elapsedMs: timerElapsedMsRef.current,
    })
  }, [flushTimerToStorage])

  const reconcileTimerFromStorage = useCallback(() => {
    const wo = workOrderIdRef.current
    const line = machineRef.current.trim()
    if (!wo || !line || !isValidMachineLine(line)) return

    const saved = loadTimerForContext(sessionIdRef.current, wo, line)
    if (!saved || (saved.state === "idle" && saved.elapsedMs <= 0)) return

    const normalized = ensureAnchorWallMs(saved)
    const storedElapsed = resolveTimerElapsedMs(normalized)
    const currentElapsed = timerElapsedMsRef.current
    const shouldResumeStored =
      normalized.state === "running" &&
      timerStateRef.current === "paused" &&
      !normalized.pausedByUser
    const driftMs = storedElapsed - currentElapsed

    if (shouldResumeStored || driftMs > 1000) {
      logExtrusionTimer("reconcileTimerFromStorage", {
        workOrderId: wo,
        machine: line,
        storedElapsed,
        currentElapsed,
        storedState: normalized.state,
        shouldResumeStored,
      })
      applyTimerFromStorage(normalized)
    }
  }, [applyTimerFromStorage])

  const syncTimerOnForeground = useCallback(() => {
    if (timerStateRef.current === "running" && timerRunStartRef.current != null) {
      const elapsed = resolveTimerElapsedMs(
        {
          state: "running",
          elapsedMs: timerElapsedMsRef.current,
          baseTime: timerBaseRef.current,
          startedAt: timerStartedAtRef.current,
          sessionId: sessionIdRef.current,
          anchorWallMs: anchorWallMsRef.current,
          pausedTotalMs: pausedTotalMsRef.current,
          runStartedAtMs: timerRunStartRef.current,
        },
      )
      setTimerElapsedMs(elapsed)
      resumeTimerTick()
      logExtrusionTimer("syncTimerOnForeground", { machine: machineRef.current, elapsedMs: elapsed })
      return
    }
    reconcileTimerFromStorage()
  }, [resumeTimerTick, reconcileTimerFromStorage])

  const persistTimerOnBackgroundRef = useRef(persistTimerOnBackground)
  persistTimerOnBackgroundRef.current = persistTimerOnBackground
  const syncTimerOnForegroundRef = useRef(syncTimerOnForeground)
  syncTimerOnForegroundRef.current = syncTimerOnForeground

  const stopTimer = useCallback(() => {
    if (timerState === "running" && timerRunStartRef.current != null) {
      const now = Date.now()
      const elapsed = resolveTimerElapsedMs(
        {
          state: "running",
          elapsedMs: timerElapsedMsRef.current,
          baseTime: timerBaseRef.current,
          startedAt: timerStartedAtRef.current,
          sessionId: sessionIdRef.current,
          anchorWallMs: anchorWallMsRef.current,
          pausedTotalMs: pausedTotalMsRef.current,
          runStartedAtMs: timerRunStartRef.current,
        },
        now,
      )
      timerBaseRef.current = elapsed
      pauseStartedWallMsRef.current = now
      pausedByUserRef.current = true
      setTimerElapsedMs(elapsed)
    }
    timerRunStartRef.current = null
    setTimerState("paused")
    stopTimerTick()
    flushTimerToStorage(machine, true)
  }, [timerState, stopTimerTick, machine, flushTimerToStorage])

  const reconcileTimerFromStorageRef = useRef(reconcileTimerFromStorage)
  reconcileTimerFromStorageRef.current = reconcileTimerFromStorage

  useEffect(() => {
    return () => {
      stopTimerTick()
      persistTimerOnBackgroundRef.current()
    }
  }, [stopTimerTick])

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        persistTimerOnBackgroundRef.current()
        return
      }
      syncTimerOnForegroundRef.current()
    }
    const onPageHide = () => persistTimerOnBackgroundRef.current()
    const onPageShow = () => reconcileTimerFromStorageRef.current()
    document.addEventListener("visibilitychange", onVisibilityChange)
    window.addEventListener("pagehide", onPageHide)
    window.addEventListener("pageshow", onPageShow)
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange)
      window.removeEventListener("pagehide", onPageHide)
      window.removeEventListener("pageshow", onPageShow)
    }
  }, [])

  const loadWorks = useCallback(async () => {
    setLoadingWorks(true)
    setWorksError(null)
    try {
      const [extrusionWorks, plantWorks, reassignOptions] = await Promise.all([
        fetchExtrusionStageWorks(),
        fetchAllPlantWorks(),
        fetchExtrusionReassignWorks(),
      ])
      setWorks(extrusionWorks)
      setAllWorks(plantWorks)
      setReassignWorks(reassignOptions)
    } catch (error) {
      setWorks([])
      setAllWorks([])
      setReassignWorks([])
      const message =
        error instanceof ApiError ? error.message : EXTRUSION_REGISTER_LABELS.loadWorksError
      setWorksError(message)
    } finally {
      setLoadingWorks(false)
    }
  }, [])

  const loadSession = useCallback(async (workId: number, draft?: Partial<DraftSnapshot> | null) => {
    setLoadingSession(true)
    timerPersistReadyRef.current = false
    try {
      const active = await fetchActiveExtrusionSession(workId)
      if (active?.session) {
        const sessionNum = active.session.id
        setSessionId(sessionNum)
        setSegments(active.segments ?? [])
        setSessionTotalKg(parseKgNumber(active.session.total_kg))
        setSessionTotalMinutes(parseKgNumber(active.session.total_effective_minutes ?? "0"))
        if (active.session.reassigned_work_order_id) {
          setReassignWorkOrderId(String(active.session.reassigned_work_order_id))
        }

        hydrateTimer(
          sessionNum,
          workId,
          draft?.machine?.trim() || machineRef.current.trim(),
          draft,
        )

        const synced = await syncSubmezclaBalance(active.session.work_order_id)
        const target = parseKgNumber(active.session.target_kg ?? "0")
        const used = parseKgNumber(active.session.total_kg ?? "0")
        if (target > 0) {
          setMixtureDispatchedKg(target)
          if (synced == null) {
            setMixtureInitialKg(Math.max(0, target - used))
          }
        }
      } else {
        setSessionId(null)
        setSegments([])
        setSessionTotalKg(0)
        setSessionTotalMinutes(0)
        setMixtureInitialKg(0)
        setMixtureDispatchedKg(0)
        hydrateTimer(null, workId, draft?.machine?.trim() || machineRef.current.trim(), draft)
      }
    } catch {
      setSessionId(null)
      setSegments([])
      hydrateTimer(null, workId, draft?.machine?.trim() || machineRef.current.trim(), draft)
    } finally {
      setLoadingSession(false)
      timerPersistReadyRef.current = true
    }
  }, [hydrateTimer, syncSubmezclaBalance])


  useEffect(() => {
    void loadWorks()
  }, [loadWorks])

  useEffect(() => {
    if (initialMixtureRunId != null && initialMixtureRunId > 0) {
      setMixtureRunId(initialMixtureRunId)
    }
  }, [initialMixtureRunId])

  useEffect(() => {
    const workId = Number(workOrderId)
    if (!Number.isFinite(workId) || workId <= 0) {
      setSessionId(null)
      setSegments([])
      return
    }

    if (prevWorkOrderIdRef.current !== workOrderId) {
      stopTimerTick()
      blockTimerAutoStartRef.current = false
      timerBaseRef.current = 0
      timerRunStartRef.current = null
      anchorWallMsRef.current = null
      pausedTotalMsRef.current = 0
      pausedByUserRef.current = false
      pauseStartedWallMsRef.current = null
      setTimerElapsedMs(0)
      setTimerStartedAt(null)
      setTimerState("idle")
      autoTimerStartedRef.current = false
      timerPersistReadyRef.current = false
      prevWorkOrderIdRef.current = workOrderId
      prevMachineRef.current = ""
    }

    const draft = loadDraft(workOrderId)
    void loadSession(workId, draft)
    setMicronsOpen(loadMicronsOpen(workOrderId))
    if (draft?.shift && EXTRUSION_SHIFTS.includes(draft.shift)) setShift(draft.shift)
    if (draft?.recordedAt) setRecordedAt(draft.recordedAt)
    if (draft?.machine != null) setMachine(draft.machine)
    if (draft?.productionFormat && EXTRUSION_FORMATS.includes(draft.productionFormat)) {
      setProductionFormat(draft.productionFormat)
    }
    if (draft?.reassignWorkOrderId != null) setReassignWorkOrderId(draft.reassignWorkOrderId)
    if (draft?.wasteRefilKg != null) setWasteRefilKg(draft.wasteRefilKg)
    if (draft?.wasteTransparenteKg != null) setWasteTransparenteKg(draft.wasteTransparenteKg)
    if (draft?.bolsonesKg != null) setBolsonesKg(draft.bolsonesKg)
    if (draft?.fallasKg != null) setFallasKg(draft.fallasKg)
    if (draft?.coreKg != null) setCoreKg(draft.coreKg)
    if (draft?.producedKg != null) setProducedKg(draft.producedKg)
    if (draft?.coilsCount != null) setCoilsCount(draft.coilsCount)
    if (draft?.coils?.length === EXTRUSION_MICRON_GRID_ROWS) {
      setCoils(
        draft.coils.map((row) => ({
          key: row.key || newCoilKey(),
          microns:
            row.microns?.length === EXTRUSION_MICRON_COUNT ? [...row.microns] : emptyMicrons(),
          kg: row.kg ?? "",
        })),
      )
    } else {
      setCoils(fixedCoils())
    }
  }, [workOrderId, loadSession, stopTimerTick])

  useEffect(() => {
    if (!workOrderId || !timerPersistReadyRef.current) return

    const prev = prevMachineRef.current
    if (prev === machine) return

    logExtrusionTimer("machineChange", {
      workOrderId,
      sessionId,
      from: prev || "(vacío)",
      to: machine || "(vacío)",
      timerState: timerStateRef.current,
      timerElapsedMs: timerElapsedMsRef.current,
    })

    if (prev && isValidMachineLine(prev)) {
      flushTimerToStorage(prev, timerStateRef.current === "running")
      if (timerStateRef.current === "running") freezeRunningTimer()
    }

    prevMachineRef.current = machine

    if (!machine || !isValidMachineLine(machine)) {
      resetTimerUi()
      dumpExtrusionTimerStorage(workOrderId, sessionId)
      return
    }

    timerPersistReadyRef.current = false
    const saved = loadTimerForContext(sessionId, workOrderId, machine)
    if (saved && (saved.state !== "idle" || saved.elapsedMs > 0)) {
      logExtrusionTimer("machineChange LOAD", {
        machine,
        elapsedMs: saved.elapsedMs,
        state: saved.state,
      })
      applyTimerFromStorage(saved)
    } else {
      logExtrusionTimer("machineChange RESET", { machine })
      if (timerElapsedMsRef.current <= 0 && timerStateRef.current === "idle") {
        resetTimerUi()
      }
    }
    timerPersistReadyRef.current = true
  }, [
    machine,
    workOrderId,
    sessionId,
    flushTimerToStorage,
    freezeRunningTimer,
    resetTimerUi,
    applyTimerFromStorage,
  ])

  useEffect(() => {
    if (!timerPersistReadyRef.current || !workOrderId) return
    if (!machine.trim() || !isValidMachineLine(machine)) return
    if (timerElapsedMs > 0 || timerState !== "idle") return

    const saved = loadTimerForContext(sessionId, workOrderId, machine)
    if (saved && (saved.state !== "idle" || saved.elapsedMs > 0)) {
      logExtrusionTimer("sessionHydrate APPLY", {
        sessionId,
        workOrderId,
        machine,
        elapsedMs: saved.elapsedMs,
        state: saved.state,
      })
      applyTimerFromStorage(saved)
    }
  }, [sessionId, workOrderId, machine, timerElapsedMs, timerState, applyTimerFromStorage])

  useEffect(() => {
    if (!workOrderId) return
    saveDraft(workOrderId, {
      workOrderId,
      shift,
      recordedAt,
      machine,
      productionFormat,
      reassignWorkOrderId,
      wasteRefilKg,
      wasteTransparenteKg,
      bolsonesKg,
      fallasKg,
      coreKg,
      producedKg,
      coilsCount,
      coils,
    })
  }, [
    workOrderId,
    shift,
    recordedAt,
    machine,
    productionFormat,
    reassignWorkOrderId,
    wasteRefilKg,
    wasteTransparenteKg,
    bolsonesKg,
    fallasKg,
    coreKg,
    producedKg,
    coilsCount,
    coils,
  ])

  useEffect(() => {
    if (blockTimerAutoStartRef.current) return
    if (!timerPersistReadyRef.current) return
    if (!mixtureRunId || autoTimerStartedRef.current) return
    if (!machine.trim() || !isValidMachineLine(machine)) return
    if (timerState === "idle" && timerElapsedMs === 0) {
      autoTimerStartedRef.current = true
      startTimer()
      logExtrusionTimer("autoStart", { workOrderId, machine, mixtureRunId, sessionId })
    }
  }, [mixtureRunId, machine, timerState, timerElapsedMs, startTimer, workOrderId, sessionId])

  // Reanudar automáticamente si la pausa no fue del operador (recarga / migración).
  useEffect(() => {
    if (!timerPersistReadyRef.current) return
    if (!mixtureRunId) return
    if (timerState !== "paused" || timerElapsedMs <= 0) return
    if (pausedByUserRef.current) return
    logExtrusionTimer("autoResumeAfterReload", { workOrderId, machine, mixtureRunId, timerElapsedMs })
    startTimer()
  }, [mixtureRunId, timerState, timerElapsedMs, startTimer, workOrderId, machine])

  // Guardar estado del temporizador en localStorage cuando cambia
  useEffect(() => {
    if (!timerPersistReadyRef.current) return
    if (!workOrderId) return
    if (!machine.trim() || !isValidMachineLine(machine)) return
    const snapshot = buildTimerSnapshot(false)
    persistTimerSnapshot(sessionId, workOrderId, machine, snapshot)
    logExtrusionTimer("timerPersistEffect", {
      workOrderId,
      sessionId,
      machine,
      state: snapshot.state,
      elapsedMs: snapshot.elapsedMs,
    })
  }, [sessionId, workOrderId, machine, timerState, timerElapsedMs, timerStartedAt, buildTimerSnapshot])

  useEffect(() => {
    if (typeof window === "undefined") return
    const dump = () => dumpExtrusionTimerStorage(workOrderIdRef.current, sessionIdRef.current)
    ;(window as Window & { __extrusionTimerDump?: () => Record<string, unknown> }).__extrusionTimerDump =
      dump
    logExtrusionTimer("debugReady", {
      hint: "window.__extrusionTimerDump() en consola; localStorage.setItem('extrusion-timer-debug','1') en prod",
    })
    return () => {
      delete (window as Window & { __extrusionTimerDump?: () => Record<string, unknown> })
        .__extrusionTimerDump
    }
  }, [])

  const setMicronsOpenPersisted = useCallback(
    (open: boolean) => {
      setMicronsOpen(open)
      if (workOrderId) saveMicronsOpen(workOrderId, open)
    },
    [workOrderId],
  )

  const patchCoil = useCallback((key: string, partial: Partial<CoilDraft>) => {
    setCoils((prev) => prev.map((row) => (row.key === key ? { ...row, ...partial } : row)))
  }, [])

  const patchCoilMicron = useCallback((key: string, index: number, value: string) => {
    setCoils((prev) =>
      prev.map((row) => {
        if (row.key !== key) return row
        const microns = [...row.microns]
        microns[index] = value
        return { ...row, microns }
      }),
    )
  }, [])

  function clearFormAfterSegment(): void {
    setCoils(fixedCoils())
    setProducedKg("")
    setCoilsCount("")
    setWasteRefilKg("")
    setWasteTransparenteKg("")
    setBolsonesKg("")
    setCoreKg("")
    setProductionFormat("")
    resetTimer()
  }

  function computeEffectiveMinutes(elapsedMs: number): number {
    if (elapsedMs <= 0) return 0
    return Math.max(0.01, Math.round((elapsedMs / 60000) * 100) / 100)
  }

  function liveTimerElapsedMs(): number {
    if (timerStateRef.current === "running" && timerRunStartRef.current != null) {
      const anchor = anchorWallMsRef.current
      if (anchor != null && anchor > 0) {
        return resolveTimerElapsedMs({
          state: "running",
          elapsedMs: timerElapsedMsRef.current,
          baseTime: timerBaseRef.current,
          startedAt: timerStartedAtRef.current,
          sessionId: sessionIdRef.current,
          anchorWallMs: anchor,
          pausedTotalMs: pausedTotalMsRef.current,
          runStartedAtMs: timerRunStartRef.current,
        })
      }
      return timerBaseRef.current + (Date.now() - timerRunStartRef.current)
    }
    return timerElapsedMsRef.current
  }

  function buildSegmentPayload(): {
    payload: ExtrusionSegmentInput | null
    errors: Record<string, string>
  } {
    const errors: Record<string, string> = {}
    const workId = Number(workOrderId)
    if (!Number.isFinite(workId) || workId <= 0) {
      errors.work_order_id = EXTRUSION_REGISTER_LABELS.validation.workRequired
    }

    if (timerState === "running") stopTimer()

    const elapsedForSegment = liveTimerElapsedMs()
    const hasTimerDuration = elapsedForSegment >= 1000
    const effectiveMinutes = computeEffectiveMinutes(elapsedForSegment)

    if (
      !machine.trim() ||
      !EXTRUSION_MACHINE_LINES.includes(machine as (typeof EXTRUSION_MACHINE_LINES)[number])
    ) {
      errors.machine = EXTRUSION_REGISTER_LABELS.validation.machineRequired
    }

    const wasteLines: ExtrusionSegmentInput["waste_lines"] = []
    const refil = parseKgNumber(wasteRefilKg)
    if (refil > 0) wasteLines.push({ waste_type: "refil", waste_kg: refil })
    const transparente = parseKgNumber(wasteTransparenteKg)
    if (transparente > 0) wasteLines.push({ waste_type: "transparente", waste_kg: transparente })

    const activeCoils = coils.filter((row) => row.kg.trim() || row.microns.some((m) => m.trim()))
    const hasAdvancedCoils = activeCoils.length > 0
    const useSimple = !hasAdvancedCoils

    let payloadCoils: ExtrusionSegmentInput["coils"] | undefined
    let producedKgValue: number | undefined
    let coilsCountValue: number | undefined

    if (useSimple) {
      const countRaw = coilsCount.trim()
      const count = countRaw ? Number(countRaw) : NaN
      const kg = producedKg.trim() ? parsePositiveKg(producedKg) : null
      if (Number.isFinite(count) && count >= 1) {
        if (count > EXTRUSION_MAX_COILS_PER_SEGMENT) {
          errors.coils_count = EXTRUSION_REGISTER_LABELS.validation.coilsCountInvalid
        } else {
          coilsCountValue = count
          if (kg != null) {
            producedKgValue = kg
          }
        }
      } else if (!kg && wasteLines.length === 0 && !hasTimerDuration) {
        errors.coils_count = EXTRUSION_REGISTER_LABELS.validation.coilsCountRequired
      }
    } else {
      const parsedCoils: NonNullable<ExtrusionSegmentInput["coils"]> = []
      for (const row of activeCoils) {
        const kg = parsePositiveKg(row.kg)
        if (kg == null) {
          errors.coils = EXTRUSION_REGISTER_LABELS.validation.kgRequired
          break
        }
        const microns: number[] = []
        for (let i = 0; i < EXTRUSION_MICRON_COUNT; i += 1) {
          const raw = row.microns[i] ?? ""
          if (!raw.trim()) continue
          const parsed = parseOptionalMicron(raw)
          if (parsed == null) {
            errors[`micron-${row.key}-${i}`] = EXTRUSION_REGISTER_LABELS.validation.micronInvalid
            break
          }
          microns.push(parsed)
        }
        if (errors.coils || Object.keys(errors).some((k) => k.startsWith("micron-"))) break
        parsedCoils.push({
          kg,
          microns: microns.length ? microns : Array(EXTRUSION_MICRON_COUNT).fill(0),
        })
      }
      payloadCoils = parsedCoils
    }

    if (
      !hasTimerDuration &&
      !producedKgValue &&
      !(payloadCoils?.length ?? 0) &&
      wasteLines.length === 0
    ) {
      errors.segment = EXTRUSION_REGISTER_LABELS.validation.segmentEmpty
    }

    setFieldErrors(errors)
    if (Object.keys(errors).length) {
      return { payload: null, errors }
    }

    return {
      payload: {
        shift,
        operator_name: operatorName,
        started_at: timerStartedAt ?? undefined,
        ended_at: new Date().toISOString(),
        effective_minutes: effectiveMinutes,
        machine: machine.trim(),
        production_format: productionFormat || null,
        coils: payloadCoils,
        produced_kg: producedKgValue ?? null,
        coils_count: coilsCountValue ?? null,
        waste_lines: wasteLines.length ? wasteLines : undefined,
        bolsones_kg: parseKgNumber(bolsonesKg) || null,
        fallas_kg: parseKgNumber(fallasKg) || null,
        core_kg: parseKgNumber(coreKg) || null,
      },
      errors,
    }
  }

  function notifyValidationErrors(errors: Record<string, string>): void {
    const messages = Object.values(errors).filter(Boolean)
    if (!messages.length) return
    toast.error(
      messages.length === 1
        ? messages[0]!
        : `${EXTRUSION_REGISTER_LABELS.validation.validationBlocked} ${messages.join(" · ")}`,
    )
  }

  async function ensureSession(workId: number): Promise<number> {
    if (sessionId) return sessionId
    const created = await createExtrusionSession(workId, {
      mixture_production_run_id: mixtureRunId ?? undefined,
    })
    setSessionId(created.session.id)
    setSegments(created.segments ?? [])
    setSessionTotalKg(parseKgNumber(created.session.total_kg))
    setSessionTotalMinutes(parseKgNumber(created.session.total_effective_minutes ?? "0"))
    await syncSubmezclaBalance(workId)
    return created.session.id
  }

  function maybeShowRemainingModal(
    remaining: number,
    context: RemainingMixtureModal["context"],
    navigateHref?: string,
  ): void {
    if (remaining <= 0 || !mixtureRunId) return
    setReturnMixtureKg(String(remaining))
    setRemainingModal({ remainingKg: remaining, context, navigateHref })
  }

  async function sendMixtureToWarehouse(): Promise<boolean> {
    if (!mixtureRunId) return false
    const kg = parseKgNumber(returnMixtureKg)
    if (kg <= 0) {
      toast.error(EXTRUSION_REGISTER_LABELS.returnMixtureKgPlaceholder)
      return false
    }
    setReturningMixture(true)
    try {
      const result = await returnMixtureToWarehouse(mixtureRunId, { kg })
      const workId = Number(workOrderId)
      if (Number.isFinite(workId) && workId > 0) {
        await syncSubmezclaBalance(workId)
      }
      const newRemaining = parseKgNumber(result.kg_remaining)
      if (newRemaining <= 0.001) {
        setRemainingModal(null)
      } else if (remainingModal) {
        setRemainingModal({ ...remainingModal, remainingKg: newRemaining })
        setReturnMixtureKg(String(newRemaining))
      }
      toast.success(EXTRUSION_REGISTER_LABELS.sendMixtureToWarehouseSuccess)
      return true
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : EXTRUSION_REGISTER_LABELS.sendMixtureToWarehouseError
      toast.error(message)
      return false
    } finally {
      setReturningMixture(false)
    }
  }

  async function persistMixtureAttributionIfNeeded(sid: number, workId: number): Promise<void> {
    const reassignId = reassignWorkOrderId.trim() ? Number(reassignWorkOrderId) : NaN
    const sourceId = mixtureSourceWorkOrderId.trim() ? Number(mixtureSourceWorkOrderId) : NaN
    const hasReassign = Number.isFinite(reassignId) && reassignId > 0
    const hasSource = Number.isFinite(sourceId) && sourceId > 0
    const hasOver = mixtureOverProductionKg > 0.001

    if (!hasReassign && !hasSource && !hasOver) return

    await reassignExtrusionRun(sid, {
      reassigned_work_order_id: hasReassign ? reassignId : undefined,
      mixture_source_work_order_id: hasSource
        ? sourceId
        : hasOver
          ? workId
          : undefined,
    })
  }

  function notifyOverProductionObservation(overKg: number): void {
    if (overKg <= 0.001) return
    toast.error(EXTRUSION_REGISTER_LABELS.mixtureOverProductionToast(formatKgDisplay(overKg)), {
      duration: 10000,
    })
  }

  async function registerProduction(): Promise<boolean> {
    const workId = Number(workOrderId)
    if (!Number.isFinite(workId) || workId <= 0) return false

    setRecordedAt(defaultRecordedTime())

    const { payload, errors } = buildSegmentPayload()
    if (!payload) {
      logExtrusionTimer("registerProduction VALIDATION_FAIL", {
        workOrderId,
        machine,
        timerElapsedMs,
        timerState,
        errors,
      })
      notifyValidationErrors(errors)
      return false
    }

    logExtrusionTimer("registerProduction OK", {
      workOrderId,
      machine,
      timerElapsedMs,
      effectiveMinutes: payload.effective_minutes,
    })

    const overBeforeSave = mixtureOverProductionKg

    setSaving(true)
    try {
      const sid = await ensureSession(workId)
      await persistMixtureAttributionIfNeeded(sid, workId)
      await addExtrusionSegment(sid, payload)
      toast.success(EXTRUSION_REGISTER_LABELS.registerProductionSuccess, { duration: 10000 })
      notifyOverProductionObservation(overBeforeSave)
      clearFormAfterSegment()
      await loadSession(workId, null)
      const remaining = (await syncSubmezclaBalance(workId)) ?? mixtureRemainingKg
      maybeShowRemainingModal(remaining, "register")
      return true
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : EXTRUSION_REGISTER_LABELS.registerProductionError
      toast.error(message)
      return false
    } finally {
      setSaving(false)
    }
  }

  async function closeSessionForRoute(
    route: "dispatch" | "sealing",
  ): Promise<{ href: string; showRemainingModal: boolean } | null> {
    const workId = Number(workOrderId)
    if (!Number.isFinite(workId) || workId <= 0) return null

    const hasPendingData =
      timerElapsedMs > 0 ||
      producedKg.trim() ||
      coilsCount.trim() ||
      coils.some((r) => r.kg.trim()) ||
      wasteRefilKg.trim() ||
      wasteTransparenteKg.trim()

    let lastSegment: ExtrusionSegmentInput | undefined
    if (hasPendingData) {
      if (timerState === "running") stopTimer()
      const { payload, errors } = buildSegmentPayload()
      if (!payload) {
        const discardable =
          Boolean(errors.timer || errors.segment) &&
          !errors.machine &&
          !errors.work_order_id &&
          !errors.coils &&
          !errors.coils_count &&
          !Object.keys(errors).some((k) => k.startsWith("micron-"))
        if (discardable) {
          logExtrusionTimer(`closeSessionForRoute(${route}) DISCARD_PENDING`, {
            workOrderId,
            machine,
            timerElapsedMs,
            errors,
          })
          toast.message(
            route === "dispatch"
              ? EXTRUSION_REGISTER_LABELS.sendToDispatchDiscardPending
              : EXTRUSION_REGISTER_LABELS.sendToSealingDiscardPending,
          )
        } else {
          notifyValidationErrors(errors)
          return null
        }
      } else {
        lastSegment = payload
      }
    }

    if (!sessionId && !lastSegment && segments.length === 0) {
      toast.error(EXTRUSION_REGISTER_LABELS.validation.noSegmentsToClose)
      return null
    }

    const overBeforeClose =
      mixtureOverProductionKg > 0
        ? mixtureOverProductionKg
        : mixtureBudgetKg > 0 && sessionTotalKg > mixtureBudgetKg
          ? sessionTotalKg - mixtureBudgetKg
          : 0

    setSaving(true)
    try {
      const sid = sessionId ?? (await ensureSession(workId))
      await persistMixtureAttributionIfNeeded(sid, workId)
      const reassignId = reassignWorkOrderId.trim() ? Number(reassignWorkOrderId) : null
      const remainingBeforeClose = mixtureRemainingKg
      const targetWorkId =
        reassignId != null && Number.isFinite(reassignId) && reassignId > 0 ? reassignId : workId
      const result = await closeExtrusionSession(sid, {
        reassigned_work_order_id:
          reassignId != null && Number.isFinite(reassignId) && reassignId > 0 ? reassignId : null,
        last_segment: lastSegment ?? null,
        complete_mixture: Boolean(mixtureRunId),
        mark_work_completed:
          route === "dispatch" && (!mixtureRunId || remainingBeforeClose <= 0.001),
        production_route: route,
      })
      toast.success(
        route === "dispatch"
          ? EXTRUSION_REGISTER_LABELS.sendToDispatchSuccess
          : EXTRUSION_REGISTER_LABELS.sendToSealingSuccess,
      )
      notifyOverProductionObservation(overBeforeClose)
      blockTimerAutoStartRef.current = true
      autoTimerStartedRef.current = true
      clearDraft(workOrderId)
      setSessionId(null)
      setSegments([])
      clearFormAfterSegment()
      clearTimerState(null, workOrderId, machine)

      const href =
        route === "dispatch"
          ? `/despacho?work_order_id=${targetWorkId}`
          : `/sellado/registro?work_order_id=${targetWorkId}`
      const remaining = parseKgNumber(result.mixture_remaining_kg ?? "0")
      const showRemainingModal = remaining > 0 && Boolean(mixtureRunId)
      if (showRemainingModal) {
        maybeShowRemainingModal(remaining, route, href)
      }

      return { href, showRemainingModal }
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : route === "dispatch"
            ? EXTRUSION_REGISTER_LABELS.sendToDispatchError
            : EXTRUSION_REGISTER_LABELS.sendToSealingError
      toast.error(message)
      return null
    } finally {
      setSaving(false)
    }
  }

  async function sendToDispatch(): Promise<{ dispatchHref: string; showRemainingModal: boolean } | null> {
    const result = await closeSessionForRoute("dispatch")
    if (!result) return null
    return { dispatchHref: result.href, showRemainingModal: result.showRemainingModal }
  }

  async function sendToSealing(): Promise<{ sealingHref: string; showRemainingModal: boolean } | null> {
    const result = await closeSessionForRoute("sealing")
    if (!result) return null
    return { sealingHref: result.href, showRemainingModal: result.showRemainingModal }
  }

  function dismissRemainingModal(): void {
    const ctx = remainingModal?.context
    setRemainingModal(null)
    if (ctx === "register" && machine.trim() && isValidMachineLine(machine) && timerStateRef.current !== "running") {
      blockTimerAutoStartRef.current = false
      autoTimerStartedRef.current = false
      startTimer()
      logExtrusionTimer("continueExtrusion", { workOrderId, machine })
    }
  }

  return {
    works,
    workSelectOptions,
    workLocked,
    allWorks,
    reassignWorks,
    loadingWorks,
    loadingSession,
    worksError,
    workOrderId,
    setWorkOrderId,
    selectedWork,
    sessionId,
    segments,
    sessionTotalKg,
    sessionTotalMinutes,
    mixtureRunId,
    mixtureInitialKg,
    mixtureDispatchedKg,
    mixtureBudgetKg,
    mixtureRemainingKg,
    mixtureOverProductionKg,
    productMeasure,
    shift,
    setShift,
    recordedAt,
    setRecordedAt,
    machine,
    setMachine,
    productionFormat,
    setProductionFormat,
    reassignWorkOrderId,
    setReassignWorkOrderId,
    mixtureSourceWorkOrderId,
    setMixtureSourceWorkOrderId,
    wasteRefilKg,
    setWasteRefilKg,
    wasteTransparenteKg,
    setWasteTransparenteKg,
    bolsonesKg,
    setBolsonesKg,
    fallasKg,
    setFallasKg,
    coreKg,
    setCoreKg,
    producedKg,
    setProducedKg,
    coilsCount,
    setCoilsCount,
    coils,
    patchCoil,
    patchCoilMicron,
    micronsOpen,
    setMicronsOpen: setMicronsOpenPersisted,
    segmentTotalKg,
    segmentTotalCoils,
    saving,
    fieldErrors,
    reloadWorks: loadWorks,
    reloadSession: () => {
      const workId = Number(workOrderId)
      if (Number.isFinite(workId) && workId > 0) {
        void loadSession(workId, loadDraft(workOrderId))
      }
    },
    timerState,
    timerNeedsMachine: !machine.trim() || !isValidMachineLine(machine),
    timerCanStart: Boolean(machine.trim() && isValidMachineLine(machine)),
    timerCanResume:
      timerState === "paused" &&
      timerElapsedMs > 0 &&
      Boolean(machine.trim() && isValidMachineLine(machine)),
    timerDisplaySeconds,
    startTimer,
    pauseTimer,
    stopTimer,
    registerProduction,
    sendToDispatch,
    sendToSealing,
    remainingModal,
    dismissRemainingModal,
    returnMixtureKg,
    setReturnMixtureKg,
    sendMixtureToWarehouse,
    returningMixture,
    operatorName,
  }
}
