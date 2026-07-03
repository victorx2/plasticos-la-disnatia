import { BRANDING, brandAssetUrl } from "@/config/branding"

export function ReportBrandBar() {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
      <img
        src={brandAssetUrl()}
        alt={BRANDING.siteName}
        className="h-14 max-w-[200px] object-contain"
      />
      <div className="min-w-0">
        <p className="text-sm font-bold uppercase tracking-wide text-slate-900">{BRANDING.siteName}</p>
        <p className="text-xs text-slate-500">{BRANDING.slogan}</p>
      </div>
    </div>
  )
}
