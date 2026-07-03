import type { RifFormParts, RifLetter } from "@/features/masters/shared/rif"
import { RIF_LETTERS } from "@/features/masters/shared/rif"
import { AlertTriangle } from "lucide-react"
import { inputErrorClass } from "@/shared/catalog/masterFormUi"
import { cn } from "@/shared/lib/utils"
import { Input } from "@/shared/ui/input"

type RifFieldGroupProps = {
  label: string
  parts: RifFormParts
  onLetterChange: (letter: RifLetter) => void
  onMainChange: (main: string) => void
  onDvChange: (dv: string) => void
  error?: string
  disabled?: boolean
  allowNoRif?: boolean
  noRif?: boolean
  onNoRifChange?: (value: boolean) => void
  noRifLabel?: string
}

export function RifFieldGroup({
  label,
  parts,
  onLetterChange,
  onMainChange,
  onDvChange,
  error,
  disabled = false,
  allowNoRif = false,
  noRif = false,
  onNoRifChange,
  noRifLabel = "Sin RIF",
}: RifFieldGroupProps) {
  const rifDisabled = disabled || noRif
  const hasError = Boolean(error)

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      {allowNoRif ? (
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
            checked={noRif}
            disabled={disabled}
            onChange={(e) => onNoRifChange?.(e.target.checked)}
          />
          {noRifLabel}
        </label>
      ) : null}
      <div
        className={cn(
          "flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/60 p-2",
          hasError ? "border-rose-300 bg-rose-50/40" : null,
        )}
      >
        <select
          className={cn(
            "h-9 w-16 shrink-0 rounded-md border border-slate-200 bg-white px-2 text-sm font-medium disabled:opacity-50",
            inputErrorClass(hasError),
          )}
          value={parts.rifLetter}
          disabled={rifDisabled}
          onChange={(e) => onLetterChange(e.target.value as RifLetter)}
          aria-invalid={hasError}
          aria-label="Tipo de RIF"
        >
          {RIF_LETTERS.map((letter) => (
            <option key={letter} value={letter}>
              {letter}
            </option>
          ))}
        </select>
        <Input
          className={cn(
            "min-w-[8rem] flex-1 font-mono sm:max-w-xs",
            inputErrorClass(hasError),
          )}
          inputMode="numeric"
          placeholder="12345678"
          aria-invalid={hasError}
          aria-label="Número de RIF"
          value={parts.rifMain}
          disabled={rifDisabled}
          onChange={(e) => onMainChange(e.target.value)}
        />
        <span className="self-center text-slate-400" aria-hidden>
          -
        </span>
        <Input
          className={cn(
            "w-14 shrink-0 font-mono",
            inputErrorClass(hasError),
          )}
          inputMode="numeric"
          placeholder="0"
          aria-invalid={hasError}
          aria-label="Dígito verificador"
          value={parts.rifDv}
          disabled={rifDisabled}
          onChange={(e) => onDvChange(e.target.value)}
        />
      </div>
      {error ? (
        <p className="inline-flex items-center gap-1.5 text-xs text-rose-600">
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
          {error}
        </p>
      ) : null}
    </div>
  )
}
