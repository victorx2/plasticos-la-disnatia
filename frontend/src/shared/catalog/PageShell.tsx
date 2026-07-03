import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

type PageShellProps = {
  title: string
  subtitle?: string
  subtitleIcon?: LucideIcon
  meta?: ReactNode
  icon?: LucideIcon
  action?: ReactNode
  children: ReactNode
}

export function PageShell({
  title,
  subtitle,
  subtitleIcon: SubtitleIcon,
  meta,
  icon: Icon,
  action,
  children,
}: PageShellProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <div className="flex items-center gap-2">
              {Icon ? (
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
              ) : null}
              <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
            </div>
            {meta ? <span className="text-sm text-slate-500">{meta}</span> : null}
          </div>
          {subtitle ? (
            <p className="mt-2 flex max-w-2xl items-start gap-2 text-sm text-slate-600">
              {SubtitleIcon ? (
                <SubtitleIcon className="mt-0.5 h-4 w-4 shrink-0 text-violet-500/80" aria-hidden />
              ) : null}
              {subtitle}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </div>
  )
}
