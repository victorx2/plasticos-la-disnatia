import { Label } from "@/shared/ui/label"

type CatalogFilterOption = {
  value: string
  label: string
}

type CatalogFilterSelectProps = {
  id: string
  label: string
  value: string
  disabled?: boolean
  options: CatalogFilterOption[]
  onChange: (value: string) => void
}

export function CatalogFilterSelect({
  id,
  label,
  value,
  disabled = false,
  options,
  onChange,
}: CatalogFilterSelectProps) {
  return (
    <div className="min-w-[10rem]">
      <Label htmlFor={id} className="sr-only">
        {label}
      </Label>
      <select
        id={id}
        className="h-9 w-full min-w-[12rem] rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
