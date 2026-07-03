type CatalogCountBadgeProps = {
  label: string
}

export function CatalogCountBadge({ label }: CatalogCountBadgeProps) {
  return (
    <span className="inline-flex items-center rounded-full border border-violet-200/80 bg-violet-50 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-violet-700">
      {label}
    </span>
  )
}
