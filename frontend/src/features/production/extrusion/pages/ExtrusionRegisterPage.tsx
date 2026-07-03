// 1. Librerías de React y React Router (Externas)
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"

// 2. Iconos y Componentes de Terceros (Externos)
import { ChevronDown, Factory, Info } from "lucide-react"

// 3. Hooks, Componentes y Tipos propios del Feature (Específicos de Extrusión)
import { useExtrusionRegisterForm } from "@/features/production/extrusion/hooks/useExtrusionRegisterForm"
import {
  EXTRUSION_FORMATS,
  EXTRUSION_MACHINE_LINES,
  EXTRUSION_MICRON_COUNT,
  EXTRUSION_SHIFTS,
} from "@/features/production/extrusion/types"
import {
  EXTRUSION_REGISTER_LABELS,
  extrusionFormatLabel,
  extrusionMachineLabel,
  extrusionMicronColumnLabel,
  extrusionShiftLabel,
  formatTimerDisplay,
} from "@/features/production/extrusion/labels"

// 4. Componentes de UI Compartidos de Producción (Shared Features)
import { FormSectionCard } from "@/features/production/shared/FormSectionCard"
import {
  FormStickyFooter,
  productionSelectClassName,
} from "@/features/production/shared/formUi"
import { ProductionFlowStrip } from "@/features/production/shared/ProductionFlowStrip"

// 5. Componentes de Arquitectura General y UI del Sistema (@/shared)
import { PageShell } from "@/shared/catalog/PageShell"
import { LabeledField } from "@/shared/catalog/LabeledField"
import { formatKgDisplay } from "@/shared/format/numbers"
import { Button } from "@/shared/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/shared/ui/collapsible"
import { Input } from "@/shared/ui/input"
import { cn } from "@/shared/lib/utils"

// import { Link, useNavigate, useSearchParams } from "react-router-dom"
// import { ChevronDown, Factory } from "lucide-react"
// 
// import { useExtrusionRegisterForm } from "@/features/production/extrusion/hooks/useExtrusionRegisterForm"
// import { FormSectionCard } from "@/features/production/shared/FormSectionCard"
// import {
//   FormStickyFooter,
//   productionSelectClassName,
// } from "@/features/production/shared/formUi"
// import { ProductionFlowStrip } from "@/features/production/shared/ProductionFlowStrip"
// import {
//   EXTRUSION_FORMATS,
//   EXTRUSION_MACHINE_LINES,
//   EXTRUSION_MICRON_COUNT,
//   EXTRUSION_SHIFTS,
// } from "@/features/production/extrusion/types"
// import {
//   EXTRUSION_REGISTER_LABELS,
//   extrusionFormatLabel,
//   extrusionMachineLabel,
//   extrusionMicronColumnLabel,
//   extrusionShiftLabel,
//   formatTimerDisplay,
// } from "@/features/production/extrusion/labels"
// import { PageShell } from "@/shared/catalog/PageShell"
// import { LabeledField } from "@/shared/catalog/LabeledField"
// import { formatKgDisplay } from "@/shared/format/numbers"
// import { Button } from "@/shared/ui/button"
// import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/shared/ui/collapsible"
// import { Input } from "@/shared/ui/input"
// import { cn } from "@/shared/lib/utils"

function workOptionLabel(work: {
  code: string
  client?: { name?: string } | null
  product?: { name?: string } | null
}): string {
  const client = work.client?.name ?? "—"
  const product = work.product?.name
  return product ? `${work.code} · ${client} · ${product}` : `${work.code} · ${client}`
}

function formatMinutesDisplay(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return h > 0 ? `${h}h ${m}m` : `${m} min`
}

export function ExtrusionRegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const workOrderIdRaw = searchParams.get("work_order_id")
  const mixtureRunIdRaw = searchParams.get("mixture_run_id")
  const initialWorkOrderId = workOrderIdRaw ? Number(workOrderIdRaw) : null
  const initialMixtureRunId = mixtureRunIdRaw ? Number(mixtureRunIdRaw) : null

  const {
    workSelectOptions,
    workLocked,
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
    reassignWorks,
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
    setMicronsOpen,
    segmentTotalKg,
    saving,
    fieldErrors,
    reloadWorks,
    timerState,
    timerNeedsMachine,
    timerCanStart,
    timerCanResume,
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
  } = useExtrusionRegisterForm(
    initialWorkOrderId != null && Number.isFinite(initialWorkOrderId) ? initialWorkOrderId : null,
    initialMixtureRunId != null && Number.isFinite(initialMixtureRunId) ? initialMixtureRunId : null,
  )

  const gridDisabled = !workOrderId
  const otherReassignWorks = reassignWorks.filter((w) => String(w.id) !== workOrderId)
  const workIdNum = Number(workOrderId)
  const requestMpHref = Number.isFinite(workIdNum)
    ? `/solicitudes-material/nueva?work_order_id=${workIdNum}`
    : "/solicitudes-material/nueva"
  const mezclaPrincipalHref = Number.isFinite(workIdNum)
    ? `/mezcla?work_order_id=${workIdNum}`
    : "/mezcla"

  async function handleSendToDispatch(): Promise<void> {
    const result = await sendToDispatch()
    if (result && !result.showRemainingModal) {
      void navigate(result.dispatchHref)
    }
  }

  async function handleSendToSealing(): Promise<void> {
    const result = await sendToSealing()
    if (result && !result.showRemainingModal) {
      void navigate(result.sealingHref)
    }
  }

  return (
    <PageShell
      title={EXTRUSION_REGISTER_LABELS.title}
      subtitle={EXTRUSION_REGISTER_LABELS.subtitle}
      icon={Factory}
      action={
        <Button type="button" variant="outline" asChild>
          <Link to="/extrusion">{EXTRUSION_REGISTER_LABELS.back}</Link>
        </Button>
      }
    >
      {remainingModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
            aria-label={EXTRUSION_REGISTER_LABELS.continueExtrusion}
            onClick={dismissRemainingModal}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-md rounded-xl border border-amber-200 bg-white p-5 shadow-xl"
          >
            <h2 className="text-base font-semibold text-slate-900">
              {EXTRUSION_REGISTER_LABELS.remainingMixtureTitle}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {EXTRUSION_REGISTER_LABELS.remainingMixtureMessage(
                formatKgDisplay(remainingModal.remainingKg),
              )}
            </p>
            <div className="mt-4 rounded-lg border border-violet-100 bg-violet-50/40 px-3 py-3">
              <LabeledField
                htmlFor="return-mixture-kg"
                label={EXTRUSION_REGISTER_LABELS.returnMixtureKgPlaceholder}
              >
                <Input
                  id="return-mixture-kg"
                  inputMode="decimal"
                  value={returnMixtureKg}
                  onChange={(e) => setReturnMixtureKg(e.target.value)}
                />
              </LabeledField>
              <Button
                type="button"
                size="sm"
                className="mt-2"
                disabled={returningMixture}
                onClick={() => void sendMixtureToWarehouse()}
              >
                {returningMixture
                  ? EXTRUSION_REGISTER_LABELS.sendMixtureToWarehouseSaving
                  : EXTRUSION_REGISTER_LABELS.sendMixtureToWarehouse}
              </Button>
            </div>
            <div className="mt-5 flex flex-col gap-3">
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" onClick={dismissRemainingModal}>
                  {EXTRUSION_REGISTER_LABELS.dismissModal}
                </Button>
              </div>
              <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link to={requestMpHref}>{EXTRUSION_REGISTER_LABELS.requestMoreMp}</Link>
                </Button>
                {remainingModal.context === "register" ? (
                  <Button type="button" variant="outline" size="sm" onClick={dismissRemainingModal}>
                    {EXTRUSION_REGISTER_LABELS.continueExtrusion}
                  </Button>
                ) : remainingModal.context === "sealing" ? (
                  <>
                    {remainingModal.navigateHref ? (
                      <Button type="button" variant="default" size="sm" asChild>
                        <Link to={remainingModal.navigateHref}>
                          {EXTRUSION_REGISTER_LABELS.goToSealing}
                        </Link>
                      </Button>
                    ) : null}
                    <Button type="button" variant="outline" size="sm" asChild>
                      <Link to={mezclaPrincipalHref}>{EXTRUSION_REGISTER_LABELS.viewPrincipalMixture}</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    {remainingModal.navigateHref ? (
                      <Button type="button" variant="default" size="sm" asChild>
                        <Link to={remainingModal.navigateHref}>
                          {EXTRUSION_REGISTER_LABELS.goToDispatch}
                        </Link>
                      </Button>
                    ) : null}
                    <Button type="button" variant="outline" size="sm" asChild>
                      <Link to={mezclaPrincipalHref}>{EXTRUSION_REGISTER_LABELS.viewPrincipalMixture}</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-5xl space-y-4 pb-4">
        <ProductionFlowStrip
          activeStep="extrusion"
          workOrderId={Number.isFinite(workIdNum) && workIdNum > 0 ? workIdNum : null}
        />

        {mixtureInitialKg > 0 || mixtureDispatchedKg > 0 ? (
          <div
            className={cn(
              "grid gap-3 rounded-xl border px-4 py-3 sm:grid-cols-3",
              mixtureOverProductionKg > 0
                ? "border-rose-300 bg-rose-50/70"
                : "border-amber-200/80 bg-amber-50/50",
            )}
          >
            <div>
              <p
                className={cn(
                  "text-xs",
                  mixtureOverProductionKg > 0 ? "text-rose-800" : "text-amber-800",
                )}
              >
                {mixtureDispatchedKg > 0
                  ? EXTRUSION_REGISTER_LABELS.mixtureBannerDispatched
                  : EXTRUSION_REGISTER_LABELS.mixtureBannerInitial}
              </p>
              <p
                className={cn(
                  "text-lg font-semibold tabular-nums",
                  mixtureOverProductionKg > 0 ? "text-rose-950" : "text-amber-950",
                )}
              >
                {formatKgDisplay(mixtureDispatchedKg > 0 ? mixtureDispatchedKg : mixtureInitialKg)}
              </p>
            </div>
            <div>
              <p
                className={cn(
                  "text-xs",
                  mixtureOverProductionKg > 0 ? "text-rose-800" : "text-amber-800",
                )}
              >
                {EXTRUSION_REGISTER_LABELS.mixtureBannerUsed}
              </p>
              <p
                className={cn(
                  "text-lg font-semibold tabular-nums",
                  mixtureOverProductionKg > 0 ? "text-rose-950" : "text-amber-950",
                )}
              >
                {formatKgDisplay(
                  mixtureDispatchedKg > 0
                    ? Math.max(0, mixtureDispatchedKg - mixtureRemainingKg)
                    : sessionTotalKg,
                )}
              </p>
            </div>
            <div>
              <p
                className={cn(
                  "text-xs",
                  mixtureOverProductionKg > 0 ? "text-rose-800" : "text-amber-800",
                )}
              >
                {EXTRUSION_REGISTER_LABELS.mixtureBannerRemaining}
              </p>
              <p
                className={cn(
                  "text-lg font-semibold tabular-nums",
                  mixtureOverProductionKg > 0 ? "font-bold text-rose-700" : "text-amber-950",
                )}
              >
                {formatKgDisplay(mixtureRemainingKg)}
              </p>
            </div>
          </div>
        ) : null}

        {mixtureBudgetKg > 0 ? (
          <p
            className={cn(
              "text-xs",
              mixtureOverProductionKg > 0 ? "font-medium text-rose-800" : "text-amber-800/90",
            )}
          >
            {mixtureBudgetKg > 0 ? EXTRUSION_REGISTER_LABELS.mixtureBannerHelp : null}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-violet-200 bg-violet-50/30 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-violet-800">{EXTRUSION_REGISTER_LABELS.timerTitle}</p>
            <p className="text-2xl font-mono tabular-nums text-violet-900">
              {formatTimerDisplay(timerDisplaySeconds)}
            </p>
            <p className="text-xs text-violet-700">
              {timerState === "running"
                ? EXTRUSION_REGISTER_LABELS.timerRunning
                : timerState === "paused"
                  ? EXTRUSION_REGISTER_LABELS.timerPaused
                  : timerNeedsMachine
                    ? EXTRUSION_REGISTER_LABELS.timerSelectMachine
                    : EXTRUSION_REGISTER_LABELS.timerIdle}
            </p>
            {timerState === "paused" ? (
              <p className="text-[11px] text-amber-800">{EXTRUSION_REGISTER_LABELS.timerPausedHint}</p>
            ) : null}
            {timerNeedsMachine ? (
              <div className="mt-3 max-w-xs space-y-1 rounded-lg border border-amber-300 bg-amber-50 p-3">
                <label
                  htmlFor="ext-machine-timer"
                  className="text-xs font-semibold text-amber-900"
                >
                  {EXTRUSION_REGISTER_LABELS.timerSelectMachineInline}
                </label>
                <select
                  id="ext-machine-timer"
                  className={cn(productionSelectClassName, "h-10 text-base font-medium")}
                  value={machine}
                  required
                  disabled={gridDisabled}
                  onChange={(e) => setMachine(e.target.value)}
                >
                  <option value="">{EXTRUSION_REGISTER_LABELS.machineSelect}</option>
                  {EXTRUSION_MACHINE_LINES.map((line) => (
                    <option key={line} value={line}>
                      {extrusionMachineLabel(line)}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-amber-800">
                  {EXTRUSION_REGISTER_LABELS.timerMachineSelectHint}
                </p>
              </div>
            ) : null}
            {machine && !timerNeedsMachine ? (
              <p className="text-[10px] text-violet-600">
                {EXTRUSION_REGISTER_LABELS.timerMachineLine(machine)}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {timerState === "idle" || timerState === "paused" ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={
                  gridDisabled ||
                  (timerState === "idle" ? !timerCanStart : !timerCanResume)
                }
                onClick={startTimer}
              >
                {timerState === "paused"
                  ? EXTRUSION_REGISTER_LABELS.timerResume
                  : EXTRUSION_REGISTER_LABELS.timerStart}
              </Button>
            ) : null}
            {timerState === "running" ? (
              <>
                <Button type="button" size="sm" variant="outline" onClick={pauseTimer}>
                  {EXTRUSION_REGISTER_LABELS.timerPause}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={stopTimer}>
                  {EXTRUSION_REGISTER_LABELS.timerStop}
                </Button>
              </>
            ) : null}
          </div>
        </div>

        <FormSectionCard title={EXTRUSION_REGISTER_LABELS.plantBoardTitle} description={EXTRUSION_REGISTER_LABELS.plantBoardHint}>
          <div className="grid gap-4 sm:grid-cols-2">
            <LabeledField htmlFor="ext-work" label={EXTRUSION_REGISTER_LABELS.fields.work}>
              <select
                id="ext-work"
                className={productionSelectClassName}
                value={workOrderId}
                required
                disabled={
                  loadingWorks ||
                  workLocked ||
                  Boolean(sessionId && mixtureInitialKg > 0)
                }
                onChange={(e) => setWorkOrderId(e.target.value)}
              >
                <option value="">
                  {loadingWorks
                    ? EXTRUSION_REGISTER_LABELS.workLoading
                    : EXTRUSION_REGISTER_LABELS.workSelect}
                </option>
                {workSelectOptions.map((work) => (
                  <option key={work.id} value={String(work.id)}>
                    {workOptionLabel(work)}
                  </option>
                ))}
              </select>
              {fieldErrors.work_order_id ? (
                <p className="text-xs text-rose-600">{fieldErrors.work_order_id}</p>
              ) : null}
              {worksError ? (
                <p className="text-xs text-amber-700">
                  {worksError}{" "}
                  <button type="button" className="underline" onClick={() => void reloadWorks()}>
                    {EXTRUSION_REGISTER_LABELS.retry}
                  </button>
                </p>
              ) : null}
            </LabeledField>

            <LabeledField htmlFor="ext-operator" label={EXTRUSION_REGISTER_LABELS.operatorLabel}>
              <Input id="ext-operator" value={operatorName} disabled readOnly />
            </LabeledField>
          </div>

          {selectedWork ? (
            <div className="space-y-1 text-sm text-slate-600">
              <p>
                <span className="font-semibold text-violet-800">
                  {EXTRUSION_REGISTER_LABELS.productionOrderNop}:{" "}
                </span>
                {selectedWork.production_order?.batch_code ??
                  selectedWork.production_order?.code ??
                  "—"}
                {" · "}
                {selectedWork.code}
              </p>
              <p>
                {selectedWork.client?.name ?? "—"} · {selectedWork.product?.name ?? "—"}
              </p>
            </div>
          ) : null}

          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">{EXTRUSION_REGISTER_LABELS.fields.machine}</th>
                  <th className="px-3 py-2">{EXTRUSION_REGISTER_LABELS.fields.shift}</th>
                  <th className="px-3 py-2">{EXTRUSION_REGISTER_LABELS.fields.time}</th>
                  <th className="px-3 py-2">{EXTRUSION_REGISTER_LABELS.fields.producedKg}</th>
                  <th className="px-3 py-2">{EXTRUSION_REGISTER_LABELS.fields.measure}</th>
                  <th className="px-3 py-2">{EXTRUSION_REGISTER_LABELS.fields.coilsCount}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-slate-100">
                  <td className="px-2 py-2 align-top">
                    <select
                      id="ext-machine"
                      className={cn(productionSelectClassName, "min-w-[7rem]")}
                      value={machine}
                      required
                      disabled={gridDisabled}
                      onChange={(e) => setMachine(e.target.value)}
                    >
                      <option value="">{EXTRUSION_REGISTER_LABELS.machineSelect}</option>
                      {EXTRUSION_MACHINE_LINES.map((line) => (
                        <option key={line} value={line}>
                          {extrusionMachineLabel(line)}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.machine ? (
                      <p className="mt-1 text-xs text-rose-600">{fieldErrors.machine}</p>
                    ) : null}
                  </td>
                  <td className="px-2 py-2 align-top">
                    <select
                      id="ext-shift"
                      className={cn(productionSelectClassName, "min-w-[7rem]")}
                      value={shift}
                      required
                      disabled={gridDisabled}
                      onChange={(e) => setShift(e.target.value as (typeof EXTRUSION_SHIFTS)[number])}
                    >
                      {EXTRUSION_SHIFTS.map((value) => (
                        <option key={value} value={value}>
                          {extrusionShiftLabel(value)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-2 align-top">
                    <Input
                      id="ext-time"
                      type="time"
                      className="min-w-[7rem]"
                      value={recordedAt}
                      required
                      disabled={gridDisabled}
                      onChange={(e) => setRecordedAt(e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-2 align-top">
                    <Input
                      id="ext-produced-kg"
                      inputMode="decimal"
                      className="min-w-[6rem]"
                      value={producedKg}
                      disabled={gridDisabled}
                      onChange={(e) => setProducedKg(e.target.value)}
                    />
                    {fieldErrors.produced_kg ? (
                      <p className="mt-1 text-xs text-rose-600">{fieldErrors.produced_kg}</p>
                    ) : null}
                  </td>
                  <td className="px-2 py-2 align-top">
                    <Input value={productMeasure} readOnly disabled className="min-w-[10rem] bg-slate-50" />
                  </td>
                  <td className="px-2 py-2 align-top">
                    <Input
                      id="ext-coils-count"
                      inputMode="numeric"
                      className="min-w-[5rem]"
                      value={coilsCount}
                      disabled={gridDisabled}
                      onChange={(e) => setCoilsCount(e.target.value)}
                    />
                    {fieldErrors.coils_count ? (
                      <p className="mt-1 text-xs text-rose-600">{fieldErrors.coils_count}</p>
                    ) : null}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {fieldErrors.timer ? <p className="text-xs text-rose-600">{fieldErrors.timer}</p> : null}
          {fieldErrors.segment ? <p className="text-xs text-rose-600">{fieldErrors.segment}</p> : null}
        </FormSectionCard>

        <FormSectionCard title={EXTRUSION_REGISTER_LABELS.wasteTitle}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <LabeledField htmlFor="waste-refil" label={EXTRUSION_REGISTER_LABELS.wasteRefil}>
              <Input
                id="waste-refil"
                inputMode="decimal"
                value={wasteRefilKg}
                disabled={gridDisabled}
                onChange={(e) => setWasteRefilKg(e.target.value)}
              />
            </LabeledField>
            <LabeledField htmlFor="waste-transp" label={EXTRUSION_REGISTER_LABELS.wasteTransparente}>
              <Input
                id="waste-transp"
                inputMode="decimal"
                value={wasteTransparenteKg}
                disabled={gridDisabled}
                onChange={(e) => setWasteTransparenteKg(e.target.value)}
              />
            </LabeledField>
            <LabeledField htmlFor="core-kg" label={EXTRUSION_REGISTER_LABELS.coreKg}>
              <Input
                id="core-kg"
                inputMode="decimal"
                value={coreKg}
                disabled={gridDisabled}
                onChange={(e) => setCoreKg(e.target.value)}
              />
            </LabeledField>
            <LabeledField htmlFor="bolsones-kg" label={EXTRUSION_REGISTER_LABELS.bolsonesKg}>
              <Input
                id="bolsones-kg"
                inputMode="decimal"
                value={bolsonesKg}
                disabled={gridDisabled}
                onChange={(e) => setBolsonesKg(e.target.value)}
              />
            </LabeledField>
            <LabeledField htmlFor="fallas-kg" label={EXTRUSION_REGISTER_LABELS.fallasKg}>
              <Input
                id="fallas-kg"
                inputMode="decimal"
                value={fallasKg}
                disabled={gridDisabled}
                onChange={(e) => setFallasKg(e.target.value)}
              />
            </LabeledField>
          </div>
        </FormSectionCard>

        <FormSectionCard title={EXTRUSION_REGISTER_LABELS.reassignTitle} description={EXTRUSION_REGISTER_LABELS.reassignHint}>
          <div className="grid gap-4 sm:grid-cols-2">
            <LabeledField htmlFor="ext-format" label={EXTRUSION_REGISTER_LABELS.formatTitle}>
              <select
                id="ext-format"
                className={productionSelectClassName}
                value={productionFormat}
                disabled={gridDisabled}
                onChange={(e) =>
                  setProductionFormat(e.target.value as (typeof EXTRUSION_FORMATS)[number] | "")
                }
              >
                <option value="">{EXTRUSION_REGISTER_LABELS.formatSelect}</option>
                {EXTRUSION_FORMATS.map((fmt) => (
                  <option key={fmt} value={fmt}>
                    {extrusionFormatLabel(fmt)}
                  </option>
                ))}
              </select>
            </LabeledField>

            <LabeledField htmlFor="ext-reassign" label={EXTRUSION_REGISTER_LABELS.fields.reassign}>
              <select
                id="ext-reassign"
                className={productionSelectClassName}
                value={reassignWorkOrderId}
                disabled={gridDisabled}
                onChange={(e) => setReassignWorkOrderId(e.target.value)}
              >
                <option value="">{EXTRUSION_REGISTER_LABELS.reassignNone}</option>
                {otherReassignWorks.map((work) => (
                  <option key={work.id} value={String(work.id)}>
                    {workOptionLabel(work)}
                  </option>
                ))}
              </select>
            </LabeledField>
          </div>
          {!loadingWorks && otherReassignWorks.length === 0 ? (
            <p className="mt-3 text-xs text-amber-800">{EXTRUSION_REGISTER_LABELS.reassignEmpty}</p>
          ) : null}
          {mixtureRunId || mixtureOverProductionKg > 0 ? (
            <div
              className={cn(
                "mt-4 space-y-2 rounded-lg border px-4 py-3",
                mixtureOverProductionKg > 0
                  ? "border-rose-300 bg-rose-50/80"
                  : "border-violet-200 bg-violet-50/50",
              )}
            >
              <p
                className={cn(
                  "text-sm font-medium",
                  mixtureOverProductionKg > 0 ? "text-rose-900" : "text-violet-900",
                )}
              >
                {EXTRUSION_REGISTER_LABELS.mixtureSourceTitle}
              </p>
              <p
                className={cn(
                  "text-xs",
                  mixtureOverProductionKg > 0 ? "text-rose-800" : "text-violet-800",
                )}
              >
                {EXTRUSION_REGISTER_LABELS.mixtureSourceHint}
              </p>
              <LabeledField htmlFor="ext-mix-source" label={EXTRUSION_REGISTER_LABELS.fields.mixtureSource}>
                <select
                  id="ext-mix-source"
                  className={productionSelectClassName}
                  value={mixtureSourceWorkOrderId}
                  disabled={gridDisabled}
                  onChange={(e) => setMixtureSourceWorkOrderId(e.target.value)}
                >
                  <option value="">{EXTRUSION_REGISTER_LABELS.mixtureSourceNone}</option>
                  {otherReassignWorks.map((work) => (
                    <option key={work.id} value={String(work.id)}>
                      {workOptionLabel(work)}
                    </option>
                  ))}
                </select>
              </LabeledField>
            </div>
          ) : null}
        </FormSectionCard>

        <Collapsible open={micronsOpen} onOpenChange={setMicronsOpen}>
          <FormSectionCard
            title={EXTRUSION_REGISTER_LABELS.advancedMicronsTitle}
            description={EXTRUSION_REGISTER_LABELS.micronsOptionalHint}
            action={
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 text-violet-700">
                  {micronsOpen
                    ? EXTRUSION_REGISTER_LABELS.micronsCollapse
                    : EXTRUSION_REGISTER_LABELS.micronsExpand}
                  <ChevronDown
                    className={cn("h-4 w-4 transition-transform", micronsOpen && "rotate-180")}
                    aria-hidden
                  />
                </Button>
              </CollapsibleTrigger>
            }
          >
            <CollapsibleContent className="space-y-3">
              {fieldErrors.coils ? (
                <p className="text-xs text-rose-600">{fieldErrors.coils}</p>
              ) : null}
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2">{EXTRUSION_REGISTER_LABELS.columns.coil}</th>
                      {Array.from({ length: EXTRUSION_MICRON_COUNT }, (_, i) => (
                        <th key={i} className="px-2 py-2 text-center">
                          {extrusionMicronColumnLabel(i)}
                        </th>
                      ))}
                      <th className="px-3 py-2">{EXTRUSION_REGISTER_LABELS.columns.kg}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coils.map((row, index) => (
                      <tr key={row.key} className="border-t border-slate-100">
                        <td className="px-3 py-2 tabular-nums font-medium text-slate-700">{index + 1}</td>
                        {row.microns.map((value, micronIndex) => (
                          <td key={micronIndex} className="px-1 py-1">
                            <Input
                              inputMode="decimal"
                              className="h-8 min-w-[3.5rem] px-2 text-center text-sm"
                              value={value}
                              disabled={gridDisabled}
                              onChange={(e) => patchCoilMicron(row.key, micronIndex, e.target.value)}
                            />
                          </td>
                        ))}
                        <td className="px-2 py-1">
                          <Input
                            inputMode="decimal"
                            className="h-8 min-w-[5rem] px-2 text-sm"
                            value={row.kg}
                            disabled={gridDisabled}
                            onChange={(e) => patchCoil(row.key, { kg: e.target.value })}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CollapsibleContent>
          </FormSectionCard>
        </Collapsible>

        <Collapsible defaultOpen={segments.length > 0}>
          <FormSectionCard title={EXTRUSION_REGISTER_LABELS.accumulatedTitle}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="mb-2 h-8 text-slate-600">
                {loadingSession ? "Cargando…" : `${segments.length} tramo(s) · ${formatKgDisplay(sessionTotalKg)} · ${formatMinutesDisplay(sessionTotalMinutes)}`}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {segments.length === 0 ? (
                <p className="text-sm text-slate-500">{EXTRUSION_REGISTER_LABELS.accumulatedEmpty}</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Máquina</th>
                        <th className="px-3 py-2">Turno</th>
                        <th className="px-3 py-2">Operador</th>
                        <th className="px-3 py-2">Duración</th>
                        <th className="px-3 py-2">Kg</th>
                        <th className="px-3 py-2">Core</th>
                        <th className="px-3 py-2">Hora</th>
                      </tr>
                    </thead>
                    <tbody>
                      {segments.map((seg) => (
                        <tr key={seg.id} className="border-t border-slate-100">
                          <td className="px-3 py-2">
                            {seg.machine ? extrusionMachineLabel(seg.machine) : "—"}
                          </td>
                          <td className="px-3 py-2">{extrusionShiftLabel(seg.shift)}</td>
                          <td className="px-3 py-2">{seg.operator_name ?? "—"}</td>
                          <td className="px-3 py-2 tabular-nums">
                            {formatMinutesDisplay(Number(seg.effective_minutes))}
                          </td>
                          <td className="px-3 py-2 tabular-nums">{formatKgDisplay(seg.total_kg)}</td>
                          <td className="px-3 py-2 tabular-nums">
                            {formatKgDisplay(seg.core_kg ?? "0")}
                          </td>
                          <td className="px-3 py-2 text-slate-600">
                            {seg.recorded_at
                              ? new Date(seg.recorded_at).toLocaleTimeString("es-VE", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CollapsibleContent>
          </FormSectionCard>
        </Collapsible>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            void registerProduction()
          }}
        >
          {mixtureOverProductionKg > 0 ? (
            <div
              className="flex items-start gap-2 rounded-lg border border-rose-400 bg-rose-50 px-4 py-3 text-sm text-rose-950"
              role="alert"
            >
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" aria-hidden />
              <p>
                {EXTRUSION_REGISTER_LABELS.mixtureOverProductionHint(
                  formatKgDisplay(mixtureOverProductionKg),
                  formatKgDisplay(mixtureDispatchedKg > 0 ? mixtureDispatchedKg : mixtureBudgetKg),
                )}
              </p>
            </div>
          ) : null}

          <FormStickyFooter className="flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-1">
              <p className="text-sm text-slate-600">{EXTRUSION_REGISTER_LABELS.totalProduced}</p>
              <p className="text-lg font-semibold tabular-nums text-slate-900">
                {formatKgDisplay(segmentTotalKg)}{" "}
                <span className="text-sm font-normal text-slate-500">este tramo</span>
              </p>
              {Object.keys(fieldErrors).length > 0 ? (
                <p className="text-xs text-rose-600" role="alert">
                  {Object.values(fieldErrors).join(" · ")}
                </p>
              ) : (
                <p className="text-xs text-slate-500">{EXTRUSION_REGISTER_LABELS.registerProductionHint}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" asChild>
                <Link to="/extrusion">{EXTRUSION_REGISTER_LABELS.cancel}</Link>
              </Button>
              <Button type="submit" disabled={saving || gridDisabled}>
                {saving
                  ? EXTRUSION_REGISTER_LABELS.registerProductionSaving
                  : EXTRUSION_REGISTER_LABELS.registerProduction}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={saving || gridDisabled}
                onClick={() => void handleSendToSealing()}
              >
                {saving
                  ? EXTRUSION_REGISTER_LABELS.sendToSealingSaving
                  : EXTRUSION_REGISTER_LABELS.sendToSealing}
              </Button>
              <Button
                type="button"
                variant="default"
                disabled={saving || gridDisabled}
                onClick={() => void handleSendToDispatch()}
              >
                {saving
                  ? EXTRUSION_REGISTER_LABELS.sendToDispatchSaving
                  : EXTRUSION_REGISTER_LABELS.sendToDispatch}
              </Button>
            </div>
          </FormStickyFooter>
        </form>
      </div>
    </PageShell>
  )
}