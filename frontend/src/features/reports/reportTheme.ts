import type { LucideIcon } from "lucide-react"
import { Clock, Factory, FlaskConical, Layers, Recycle, ScrollText } from "lucide-react"

import type { ReportTabId } from "@/features/reports/labels"

export type ReportAccent = "violet" | "emerald" | "amber" | "sky" | "rose"

export const REPORT_TAB_ACCENTS: Record<ReportTabId, ReportAccent> = {
  times: "violet",
  total: "emerald",
  byOrder: "amber",
  production: "sky",
  waste: "rose",
  machine: "violet",
}

export const REPORT_TAB_ICONS: Record<ReportTabId, LucideIcon> = {
  times: Clock,
  total: FlaskConical,
  byOrder: ScrollText,
  production: Factory,
  waste: Recycle,
  machine: Layers,
}

export const accentNavActive: Record<ReportAccent, string> = {
  violet: "border-violet-300 bg-violet-50 ring-2 ring-violet-200/80",
  emerald: "border-emerald-300 bg-emerald-50 ring-2 ring-emerald-200/80",
  amber: "border-amber-300 bg-amber-50 ring-2 ring-amber-200/80",
  sky: "border-sky-300 bg-sky-50 ring-2 ring-sky-200/80",
  rose: "border-rose-300 bg-rose-50 ring-2 ring-rose-200/80",
}

export const accentIconWrap: Record<ReportAccent, string> = {
  violet: "bg-violet-500/10 text-violet-600 ring-violet-200/60",
  emerald: "bg-emerald-500/10 text-emerald-600 ring-emerald-200/60",
  amber: "bg-amber-500/10 text-amber-600 ring-amber-200/60",
  sky: "bg-sky-500/10 text-sky-600 ring-sky-200/60",
  rose: "bg-rose-500/10 text-rose-600 ring-rose-200/60",
}

/** @deprecated Use accentPanelFrame — kept for any legacy references */
export const accentPanelTop: Record<ReportAccent, string> = {
  violet: "border-t-violet-500",
  emerald: "border-t-emerald-500",
  amber: "border-t-amber-500",
  sky: "border-t-sky-500",
  rose: "border-t-rose-500",
}

export const accentKpi: Record<ReportAccent, string> = {
  violet: "border-violet-200/80 bg-violet-50/50",
  emerald: "border-emerald-200/80 bg-emerald-50/50",
  amber: "border-amber-200/80 bg-amber-50/50",
  sky: "border-sky-200/80 bg-sky-50/50",
  rose: "border-rose-200/80 bg-rose-50/50",
}

export const accentPanelFrame: Record<ReportAccent, string> = {
  violet:
    "bg-gradient-to-br from-white via-violet-50/40 to-slate-50/90 shadow-[0_1px_3px_rgba(15,23,42,0.06)] ring-1 ring-violet-200/45",
  emerald:
    "bg-gradient-to-br from-white via-emerald-50/35 to-slate-50/90 shadow-[0_1px_3px_rgba(15,23,42,0.06)] ring-1 ring-emerald-200/45",
  amber:
    "bg-gradient-to-br from-white via-amber-50/35 to-slate-50/90 shadow-[0_1px_3px_rgba(15,23,42,0.06)] ring-1 ring-amber-200/45",
  sky: "bg-gradient-to-br from-white via-sky-50/35 to-slate-50/90 shadow-[0_1px_3px_rgba(15,23,42,0.06)] ring-1 ring-sky-200/45",
  rose: "bg-gradient-to-br from-white via-rose-50/35 to-slate-50/90 shadow-[0_1px_3px_rgba(15,23,42,0.06)] ring-1 ring-rose-200/45",
}

export const accentMeshOrb: Record<ReportAccent, string> = {
  violet: "bg-violet-400/15",
  emerald: "bg-emerald-400/15",
  amber: "bg-amber-400/15",
  sky: "bg-sky-400/15",
  rose: "bg-rose-400/15",
}

export const accentMeshOrbSecondary: Record<ReportAccent, string> = {
  violet: "bg-violet-300/10",
  emerald: "bg-emerald-300/10",
  amber: "bg-amber-300/10",
  sky: "bg-sky-300/10",
  rose: "bg-rose-300/10",
}

export const accentSidebarRail: Record<ReportAccent, string> = {
  violet: "border-violet-200/35 bg-violet-500/[0.04]",
  emerald: "border-emerald-200/35 bg-emerald-500/[0.04]",
  amber: "border-amber-200/35 bg-amber-500/[0.04]",
  sky: "border-sky-200/35 bg-sky-500/[0.04]",
  rose: "border-rose-200/35 bg-rose-500/[0.04]",
}

export const accentSidebarStripe: Record<ReportAccent, string> = {
  violet: "bg-gradient-to-b from-violet-400 via-violet-500 to-violet-600/70",
  emerald: "bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-600/70",
  amber: "bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600/70",
  sky: "bg-gradient-to-b from-sky-400 via-sky-500 to-sky-600/70",
  rose: "bg-gradient-to-b from-rose-400 via-rose-500 to-rose-600/70",
}

export const accentEyebrow: Record<ReportAccent, string> = {
  violet: "text-violet-600/90",
  emerald: "text-emerald-600/90",
  amber: "text-amber-700/90",
  sky: "text-sky-600/90",
  rose: "text-rose-600/90",
}

export const accentRecordBadge: Record<ReportAccent, string> = {
  violet: "bg-violet-500/10 text-violet-800 ring-1 ring-violet-200/70",
  emerald: "bg-emerald-500/10 text-emerald-800 ring-1 ring-emerald-200/70",
  amber: "bg-amber-500/10 text-amber-900 ring-1 ring-amber-200/70",
  sky: "bg-sky-500/10 text-sky-800 ring-1 ring-sky-200/70",
  rose: "bg-rose-500/10 text-rose-800 ring-1 ring-rose-200/70",
}

export const accentFilterBar: Record<ReportAccent, string> = {
  violet: "border-violet-200/30 bg-violet-500/[0.06] backdrop-blur-[2px]",
  emerald: "border-emerald-200/30 bg-emerald-500/[0.06] backdrop-blur-[2px]",
  amber: "border-amber-200/30 bg-amber-500/[0.06] backdrop-blur-[2px]",
  sky: "border-sky-200/30 bg-sky-500/[0.06] backdrop-blur-[2px]",
  rose: "border-rose-200/30 bg-rose-500/[0.06] backdrop-blur-[2px]",
}

export const accentContentArea: Record<ReportAccent, string> = {
  violet:
    "bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,rgba(139,92,246,0.08),transparent_55%)]",
  emerald:
    "bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,rgba(16,185,129,0.08),transparent_55%)]",
  amber:
    "bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,rgba(245,158,11,0.08),transparent_55%)]",
  sky: "bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,rgba(14,165,233,0.08),transparent_55%)]",
  rose: "bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,rgba(244,63,94,0.08),transparent_55%)]",
}

export const accentDataSurface: Record<ReportAccent, string> = {
  violet: "rounded-xl bg-white/75 shadow-sm ring-1 ring-violet-200/35 backdrop-blur-sm",
  emerald: "rounded-xl bg-white/75 shadow-sm ring-1 ring-emerald-200/35 backdrop-blur-sm",
  amber: "rounded-xl bg-white/75 shadow-sm ring-1 ring-amber-200/35 backdrop-blur-sm",
  sky: "rounded-xl bg-white/75 shadow-sm ring-1 ring-sky-200/35 backdrop-blur-sm",
  rose: "rounded-xl bg-white/75 shadow-sm ring-1 ring-rose-200/35 backdrop-blur-sm",
}

export const accentDateShell: Record<ReportAccent, string> = {
  violet: "rounded-xl bg-white/85 shadow-sm ring-1 ring-violet-200/50 backdrop-blur-sm",
  emerald: "rounded-xl bg-white/85 shadow-sm ring-1 ring-emerald-200/50 backdrop-blur-sm",
  amber: "rounded-xl bg-white/85 shadow-sm ring-1 ring-amber-200/50 backdrop-blur-sm",
  sky: "rounded-xl bg-white/85 shadow-sm ring-1 ring-sky-200/50 backdrop-blur-sm",
  rose: "rounded-xl bg-white/85 shadow-sm ring-1 ring-rose-200/50 backdrop-blur-sm",
}

export const accentDateInputFocus: Record<ReportAccent, string> = {
  violet: "focus-within:ring-2 focus-within:ring-violet-300/70 focus-within:ring-offset-1",
  emerald: "focus-within:ring-2 focus-within:ring-emerald-300/70 focus-within:ring-offset-1",
  amber: "focus-within:ring-2 focus-within:ring-amber-300/70 focus-within:ring-offset-1",
  sky: "focus-within:ring-2 focus-within:ring-sky-300/70 focus-within:ring-offset-1",
  rose: "focus-within:ring-2 focus-within:ring-rose-300/70 focus-within:ring-offset-1",
}

export const accentDateDivider: Record<ReportAccent, string> = {
  violet: "text-violet-400/80",
  emerald: "text-emerald-500/80",
  amber: "text-amber-500/80",
  sky: "text-sky-500/80",
  rose: "text-rose-500/80",
}

export const accentDateIcon: Record<ReportAccent, string> = {
  violet: "text-violet-500/70",
  emerald: "text-emerald-500/70",
  amber: "text-amber-600/70",
  sky: "text-sky-500/70",
  rose: "text-rose-500/70",
}

export const accentExportShell: Record<ReportAccent, string> = {
  violet: "rounded-lg bg-white/80 shadow-sm ring-1 ring-violet-200/55 backdrop-blur-sm",
  emerald: "rounded-lg bg-white/80 shadow-sm ring-1 ring-emerald-200/55 backdrop-blur-sm",
  amber: "rounded-lg bg-white/80 shadow-sm ring-1 ring-amber-200/55 backdrop-blur-sm",
  sky: "rounded-lg bg-white/80 shadow-sm ring-1 ring-sky-200/55 backdrop-blur-sm",
  rose: "rounded-lg bg-white/80 shadow-sm ring-1 ring-rose-200/55 backdrop-blur-sm",
}

export const accentExportButton: Record<ReportAccent, string> = {
  violet:
    "text-slate-700 hover:bg-violet-500/10 hover:text-violet-800 active:bg-violet-500/15",
  emerald:
    "text-slate-700 hover:bg-emerald-500/10 hover:text-emerald-800 active:bg-emerald-500/15",
  amber: "text-slate-700 hover:bg-amber-500/10 hover:text-amber-900 active:bg-amber-500/15",
  sky: "text-slate-700 hover:bg-sky-500/10 hover:text-sky-800 active:bg-sky-500/15",
  rose: "text-slate-700 hover:bg-rose-500/10 hover:text-rose-800 active:bg-rose-500/15",
}

export const accentExportDivider: Record<ReportAccent, string> = {
  violet: "border-violet-200/40",
  emerald: "border-emerald-200/40",
  amber: "border-amber-200/40",
  sky: "border-sky-200/40",
  rose: "border-rose-200/40",
}

export const accentApplyButton: Record<ReportAccent, string> = {
  violet:
    "border-violet-200/60 bg-white/90 text-violet-800 shadow-sm hover:bg-violet-50 hover:text-violet-900 ring-1 ring-violet-200/40",
  emerald:
    "border-emerald-200/60 bg-white/90 text-emerald-800 shadow-sm hover:bg-emerald-50 hover:text-emerald-900 ring-1 ring-emerald-200/40",
  amber:
    "border-amber-200/60 bg-white/90 text-amber-900 shadow-sm hover:bg-amber-50 hover:text-amber-950 ring-1 ring-amber-200/40",
  sky: "border-sky-200/60 bg-white/90 text-sky-800 shadow-sm hover:bg-sky-50 hover:text-sky-900 ring-1 ring-sky-200/40",
  rose: "border-rose-200/60 bg-white/90 text-rose-800 shadow-sm hover:bg-rose-50 hover:text-rose-900 ring-1 ring-rose-200/40",
}
