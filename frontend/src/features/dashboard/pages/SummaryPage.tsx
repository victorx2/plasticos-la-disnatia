import { DASHBOARD_LABELS } from "@/features/dashboard/labels"
import { KpiCard } from "@/features/dashboard/components/KpiCard"
import { SummaryHeader } from "@/features/dashboard/components/SummaryHeader"
import { SummaryKpiSection } from "@/features/dashboard/components/SummaryKpiSection"
import { useDashboardSummary } from "@/features/dashboard/hooks/useDashboardSummary"

export function SummaryPage() {
  const { loading, viewModel, reload } = useDashboardSummary()

  return (
    <div className="space-y-8">
      <SummaryHeader
        loading={loading}
        generatedAt={viewModel?.generatedAt}
        onRefresh={() => void reload()}
      />

      {loading && !viewModel ? (
        <p className="text-sm text-slate-500">{DASHBOARD_LABELS.loading}</p>
      ) : null}

      {!loading && !viewModel ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {DASHBOARD_LABELS.noData}
        </p>
      ) : null}

      {viewModel ? (
        <div
          className="grid gap-6 lg:grid-cols-3"
          aria-label="Indicadores del resumen"
        >
          {viewModel.sections.map((section) => (
            <SummaryKpiSection key={section.id} title={section.title} variant={section.id}>
              {section.kpis.map((kpi) => (
                <KpiCard key={kpi.id} kpi={kpi} />
              ))}
            </SummaryKpiSection>
          ))}
        </div>
      ) : null}
    </div>
  )
}
