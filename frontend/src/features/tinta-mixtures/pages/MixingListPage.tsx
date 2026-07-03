import { useEffect, useMemo } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Factory, FlaskConical, Info, Plus } from "lucide-react"

import { mixtureTotalKg } from "@/features/tinta-mixtures/domain/mixtureTotals"
import { MIXING_LABELS, mixtureKindBadgeClass, mixtureKindLabel } from "@/features/tinta-mixtures/labels"
import {
  formatPlantWorkLabel,
  usePlantWorkOptions,
} from "@/features/tinta-mixtures/hooks/usePlantWorkOptions"
import { useTintaMixturesList } from "@/features/tinta-mixtures/hooks/useTintaMixturesList"
import { useOpenMaterialRequestForWork } from "@/features/material-requests/hooks/useOpenMaterialRequestForWork"
import { areaRequestInsumosHref } from "@/features/material-requests/domain/openMaterialRequest"
import { MATERIAL_REQUEST_LABELS } from "@/features/material-requests/labels"
import { ProductionFlowStrip } from "@/features/production/shared/ProductionFlowStrip"
import { PRODUCTION_FLOW_LABELS } from "@/features/production/shared/labels"
import { useWorkProductionResume } from "@/features/production/shared/useWorkProductionResume"
import {
  extrusionRegisterHref,
  isExtrusionResume,
} from "@/features/production/shared/workProductionResume"
import { ProductionGuidedEmpty } from "@/features/production/shared/ProductionGuidedEmpty"
import { catalogRowNumber } from "@/shared/catalog/classes"
import { SearchableSelect } from "@/shared/catalog/SearchableSelect"
import { CatalogCountBadge } from "@/shared/catalog/CatalogCountBadge"
import {
  CatalogListPanelShell,
  catalogTableCellClass,
  catalogTableRowClass,
} from "@/shared/catalog/CatalogListPanelShell"
import { CatalogListPagination } from "@/shared/catalog/CatalogListPagination"
import { CATALOG_LABELS } from "@/shared/catalog/labels"
import {
  CatalogEmptyRows,
  CatalogLoadingRows,
  CatalogTableBody,
  CatalogTableHead,
  CatalogTableHeader,
  CatalogTableHeadRow,
} from "@/shared/catalog/CatalogTable"
import { PageShell } from "@/shared/catalog/PageShell"
import { formatDateDMY } from "@/shared/format/dates"
import { Button } from "@/shared/ui/button"

export function MixingListPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const workOrderIdRaw = searchParams.get("work_order_id")
  const initialWorkOrderId = workOrderIdRaw ? Number(workOrderIdRaw) : null
  const validWorkOrderId =
    initialWorkOrderId != null && Number.isFinite(initialWorkOrderId) && initialWorkOrderId > 0
      ? initialWorkOrderId
      : null

  const { works, loading: loadingWorks } = usePlantWorkOptions()
  const {
    query,
    setQuery,
    setPage,
    perPage,
    setPerPage,
    loading,
    rows,
    applySearchNow,
    showInitialSkeleton,
    workFilter,
    setWorkFilter,
    hasWorkFilter,
  } = useTintaMixturesList(validWorkOrderId)

  const { resume, loading: resumeLoading } = useWorkProductionResume(validWorkOrderId)
  const workIdForOpenRequest = workFilter ? Number(workFilter) : validWorkOrderId
  const { openRequest } = useOpenMaterialRequestForWork(
    workIdForOpenRequest != null && Number.isFinite(workIdForOpenRequest) && workIdForOpenRequest > 0
      ? workIdForOpenRequest
      : null,
  )
  const extrusionResumeHref =
    validWorkOrderId && resume && isExtrusionResume(resume)
      ? extrusionRegisterHref(validWorkOrderId, resume.activeMixtureRunId)
      : null

  useEffect(() => {
    if (resumeLoading || !extrusionResumeHref) return
    navigate(extrusionResumeHref, { replace: true })
  }, [resumeLoading, extrusionResumeHref, navigate])

  const total = rows?.total ?? 0
  const selectedWork = works.find((w) => String(w.id) === workFilter) ?? null
  const tableData = rows?.data ?? []
  const hasActiveFilters = hasWorkFilter || query.trim().length > 0

  function applyWorkFilter(value: string) {
    setWorkFilter(value)
    if (value) {
      navigate(`/mezcla?work_order_id=${value}`, { replace: true })
    } else {
      navigate("/mezcla", { replace: true })
    }
  }

  const newMixturePath = workFilter
    ? `/mezcla/nueva?work_order_id=${workFilter}`
    : "/mezcla/nueva"

  const requestInsumosPath = openRequest
    ? areaRequestInsumosHref(openRequest.id)
    : workFilter
      ? `/solicitudes-material/nueva?work_order_id=${workFilter}`
      : "/solicitudes-material/nueva"

  const requestInsumosLabel = openRequest
    ? MATERIAL_REQUEST_LABELS.openRequestAction
    : hasWorkFilter
      ? MIXING_LABELS.requestInsumosForWork
      : MIXING_LABELS.requestInsumos

  const productionPath = workFilter
    ? `/mezcla/produccion?work_order_id=${workFilter}`
    : "/mezcla/produccion"

  const requestInsumosButton = (
    <Button type="button" asChild variant={openRequest ? "outline" : "default"}>
      <Link to={requestInsumosPath}>
        <Plus className="h-4 w-4" aria-hidden />
        {requestInsumosLabel}
      </Link>
    </Button>
  )

  const manualMixtureButton = (
    <Button type="button" variant="outline" asChild>
      <Link to={newMixturePath}>
        {hasWorkFilter ? MIXING_LABELS.newMixtureForWork : MIXING_LABELS.newMixture}
      </Link>
    </Button>
  )

  const emptySteps = [
    { label: MIXING_LABELS.emptyStepProgramacion, href: "/programacion" },
    { label: MIXING_LABELS.emptyStepSelectWork },
    { label: MIXING_LABELS.emptyStepRequestInsumos, href: requestInsumosPath },
  ]

  const workFilterOptions = useMemo(
    () => [
      { value: "", label: MIXING_LABELS.workFilterAll },
      ...works.map((work) => ({
        value: String(work.id),
        label: formatPlantWorkLabel(work),
      })),
    ],
    [works],
  )

  const workFilterControl = (
    <div className="flex min-w-[14rem] flex-col gap-1">
      <label htmlFor="mix-work-filter" className="text-xs font-medium text-slate-500">
        {MIXING_LABELS.workFilter}
      </label>
      <SearchableSelect
        id="mix-work-filter"
        value={workFilter}
        disabled={loadingWorks}
        placeholder={MIXING_LABELS.workFilterSelect}
        options={workFilterOptions}
        onChange={applyWorkFilter}
      />
    </div>
  )

  return (
    <PageShell
      title={MIXING_LABELS.listTitle}
      subtitle={MIXING_LABELS.listSubtitle}
      icon={FlaskConical}
      meta={
        !loading ? (
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800"
              title={MIXING_LABELS.outputAreaResinaHint}
            >
              {MIXING_LABELS.outputAreaResina}
            </span>
            {rows ? <CatalogCountBadge label={MIXING_LABELS.count(total)} /> : null}
          </div>
        ) : null
      }
      action={
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" asChild>
            <Link to={productionPath}>{MIXING_LABELS.openProduction}</Link>
          </Button>
          {requestInsumosButton}
          {manualMixtureButton}
        </div>
      }
    >
      <div className="space-y-4">
        <ProductionFlowStrip activeStep="mezcla" workOrderId={validWorkOrderId} />

        {isExtrusionResume(resume) && extrusionResumeHref ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-violet-200/80 bg-violet-50/60 px-4 py-3">
            <div className="flex items-start gap-2 text-sm text-violet-900">
              <Factory className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p>{MIXING_LABELS.extrusionActiveBanner}</p>
            </div>
            <Button type="button" size="sm" asChild>
              <Link to={extrusionResumeHref}>{MIXING_LABELS.extrusionActiveCta}</Link>
            </Button>
          </div>
        ) : null}

        <div className="flex items-start gap-2 rounded-lg border border-violet-200/80 bg-violet-50/50 px-4 py-3 text-sm text-violet-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>{MIXING_LABELS.listHelp}</p>
        </div>

        <p className="text-xs text-slate-500">{CATALOG_LABELS.searchHint}</p>

        {!hasWorkFilter && !loadingWorks && works.length > 0 ? (
          <div className="rounded-lg border border-violet-200/80 bg-violet-50/50 px-4 py-3 text-sm text-violet-900">
            {PRODUCTION_FLOW_LABELS.selectWorkBanner}
          </div>
        ) : null}

        {hasWorkFilter && selectedWork ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200/80 bg-slate-50/50 px-4 py-3">
            <p className="text-sm text-slate-600">
              {MIXING_LABELS.workFilterActive(selectedWork.code)}{" "}
              <Link to="/mezcla" className="font-medium text-violet-700 underline">
                {MIXING_LABELS.workFilterClear}
              </Link>
            </p>
            <Button type="button" variant="ghost" size="sm" asChild>
              <Link to={requestInsumosPath}>{MIXING_LABELS.requestInsumosForWork}</Link>
            </Button>
          </div>
        ) : null}

        <CatalogListPanelShell
          query={query}
          onQueryChange={setQuery}
          onSearchSubmit={applySearchNow}
          searchPlaceholder={MIXING_LABELS.searchPlaceholder}
          searchAriaLabel={MIXING_LABELS.searchAriaLabel}
          searchId="mixing-search"
          hasActiveFilters={hasActiveFilters}
          filters={workFilterControl}
          minTableWidth="920px"
          showPagination={!showInitialSkeleton && tableData.length > 0}
          pagination={
            <CatalogListPagination
              rows={rows}
              loading={loading}
              perPage={perPage}
              onPerPageChange={setPerPage}
              onPageChange={setPage}
              selectId="mixing-per-page"
            />
          }
        >
          <CatalogTableHeader className="catalog-table-head sticky top-0 z-10 bg-white">
            <CatalogTableHeadRow className="border-b border-slate-200 bg-white hover:bg-white">
              <CatalogTableHead className="w-16">{MIXING_LABELS.table.number}</CatalogTableHead>
              <CatalogTableHead>{MIXING_LABELS.fields.work}</CatalogTableHead>
              <CatalogTableHead>{MIXING_LABELS.fields.kind}</CatalogTableHead>
              <CatalogTableHead>{MIXING_LABELS.fields.outputName}</CatalogTableHead>
              <CatalogTableHead>{MIXING_LABELS.fields.totalKg}</CatalogTableHead>
              <CatalogTableHead>{MIXING_LABELS.fields.componentsCount}</CatalogTableHead>
              <CatalogTableHead>{MIXING_LABELS.fields.creator}</CatalogTableHead>
              <CatalogTableHead>{MIXING_LABELS.fields.createdAt}</CatalogTableHead>
            </CatalogTableHeadRow>
          </CatalogTableHeader>

          <CatalogTableBody>
            {showInitialSkeleton ? (
              <CatalogLoadingRows colSpan={8} />
            ) : !tableData.length ? (
              <CatalogEmptyRows colSpan={8}>
                <ProductionGuidedEmpty
                  compact
                  icon={FlaskConical}
                  title={hasWorkFilter ? MIXING_LABELS.emptyTitleFiltered : MIXING_LABELS.emptyTitle}
                  description={
                    hasWorkFilter
                      ? MIXING_LABELS.emptyDescriptionFiltered
                      : MIXING_LABELS.emptyDescription
                  }
                  primaryAction={requestInsumosButton}
                  secondaryAction={manualMixtureButton}
                  steps={hasWorkFilter ? undefined : emptySteps}
                />
              </CatalogEmptyRows>
            ) : (
              tableData.map((mixture, index) => {
                const n = catalogRowNumber(rows!.current_page, rows!.per_page, index)
                return (
                  <tr key={mixture.id} className={catalogTableRowClass}>
                    <td className={`${catalogTableCellClass} tabular-nums text-xs text-slate-400`}>
                      {n}
                    </td>
                    <td className={`${catalogTableCellClass} font-mono text-xs font-semibold text-slate-900`}>
                      {mixture.work_order?.code ?? mixture.work_order_id ?? "—"}
                    </td>
                    <td className={catalogTableCellClass}>
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${mixtureKindBadgeClass(mixture.mixture_kind)}`}
                      >
                        {mixtureKindLabel(mixture.mixture_kind)}
                      </span>
                    </td>
                    <td className={`${catalogTableCellClass} font-medium text-slate-800`}>
                      {mixture.output_name}
                    </td>
                    <td className={`${catalogTableCellClass} tabular-nums text-slate-700`}>
                      {mixtureTotalKg(mixture)}
                    </td>
                    <td className={`${catalogTableCellClass} tabular-nums text-slate-600`}>
                      {mixture.components_count ?? mixture.components?.length ?? "—"}
                    </td>
                    <td className={`${catalogTableCellClass} text-slate-700`}>
                      {mixture.creator?.name ?? "—"}
                    </td>
                    <td className={`${catalogTableCellClass} whitespace-nowrap text-slate-600`}>
                      {formatDateDMY(mixture.created_at)}
                    </td>
                  </tr>
                )
              })
            )}
          </CatalogTableBody>
        </CatalogListPanelShell>
      </div>
    </PageShell>
  )
}
