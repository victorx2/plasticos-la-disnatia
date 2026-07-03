import type { ReactNode } from "react"

import { catalogFilterPanelClass } from "@/shared/catalog/classes"
import { CATALOG_LABELS } from "@/shared/catalog/labels"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { cn } from "@/shared/lib/utils"

type CatalogSearchPanelProps = {
  id: string
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  onSubmit?: () => void
  countLabel?: string | null
  className?: string
  footer?: ReactNode
  showHint?: boolean
  variant?: "panel" | "inline"
}

export function CatalogSearchPanel({
  id,
  label,
  placeholder,
  value,
  onChange,
  onSubmit,
  countLabel,
  className,
  footer,
  showHint = true,
  variant = "panel",
}: CatalogSearchPanelProps) {
  const isInline = variant === "inline"

  return (
    <div
      className={cn(isInline ? "min-w-0 flex-1" : catalogFilterPanelClass, className)}
    >
      <Label htmlFor={id} className={isInline ? "text-xs text-slate-600" : undefined}>
        {label}
      </Label>
      <Input
        id={id}
        className={cn(isInline ? "mt-1 h-9" : "mt-2")}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit?.()
        }}
      />
      {showHint ? (
        <p className="mt-2 text-xs text-slate-500">{CATALOG_LABELS.searchHint}</p>
      ) : null}
      {countLabel && !isInline ? (
        <p className="mt-1 text-xs font-medium text-slate-600">{countLabel}</p>
      ) : null}
      {footer}
    </div>
  )
}
