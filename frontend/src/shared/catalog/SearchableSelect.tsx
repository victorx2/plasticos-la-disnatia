import { useEffect, useId, useMemo, useRef, useState } from "react"
import { Check, ChevronDown, Search } from "lucide-react"

import { cn } from "@/shared/lib/utils"

export type SearchableSelectOption = {
  value: string
  label: string
}

type SearchableSelectProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  options: SearchableSelectOption[]
  placeholder?: string
  disabled?: boolean
  emptyMessage?: string
  noResultsMessage?: string
  className?: string
  "aria-invalid"?: boolean
}

export function SearchableSelect({
  id,
  value,
  onChange,
  options,
  placeholder = "Buscar…",
  disabled = false,
  emptyMessage = "Sin opciones",
  noResultsMessage = "Sin coincidencias",
  className,
  "aria-invalid": ariaInvalid,
}: SearchableSelectProps) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const selected = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  )

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return options
    return options.filter((option) => option.label.toLowerCase().includes(term))
  }, [options, query])

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setQuery(selected?.label ?? "")
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    return () => document.removeEventListener("mousedown", handlePointerDown)
  }, [open, selected?.label])

  function openList() {
    if (disabled) return
    setOpen(true)
    setQuery(selected?.label ?? "")
    requestAnimationFrame(() => inputRef.current?.select())
  }

  function selectOption(option: SearchableSelectOption) {
    onChange(option.value)
    setQuery(option.label)
    setOpen(false)
  }

  function handleInputChange(next: string) {
    setQuery(next)
    setOpen(true)
    if (!next.trim()) onChange("")
  }

  const displayValue = open ? query : selected?.label ?? query

  return (
    <div ref={rootRef} className={cn("relative min-w-0", className)}>
      <div
        className={cn(
          "flex h-10 items-center gap-2 rounded-lg border bg-white px-3 shadow-sm transition-colors",
          "focus-within:ring-2 focus-within:ring-violet-500/30 focus-within:border-violet-300",
          disabled ? "cursor-not-allowed bg-slate-50 opacity-60" : "border-slate-200",
          ariaInvalid ? "border-rose-300 focus-within:border-rose-400 focus-within:ring-rose-500/20" : null,
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-invalid={ariaInvalid}
          autoComplete="off"
          disabled={disabled}
          value={displayValue}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
          onFocus={openList}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false)
              setQuery(selected?.label ?? "")
              inputRef.current?.blur()
            }
            if (e.key === "Enter" && filtered[0]) {
              e.preventDefault()
              selectOption(filtered[0])
            }
          }}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          className="inline-flex shrink-0 rounded-md p-0.5 text-slate-400 hover:text-slate-600 disabled:pointer-events-none"
          aria-label="Abrir lista"
          onClick={() => (open ? setOpen(false) : openList())}
        >
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", open ? "rotate-180" : null)}
            aria-hidden
          />
        </button>
      </div>

      {open && !disabled ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1.5 max-h-60 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg shadow-slate-200/60"
        >
          {options.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-500">{emptyMessage}</li>
          ) : filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-500">{noResultsMessage}</li>
          ) : (
            filtered.map((option) => {
              const isSelected = option.value === value
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors",
                      isSelected
                        ? "bg-violet-50 text-violet-900"
                        : "text-slate-700 hover:bg-slate-50",
                    )}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectOption(option)}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected ? <Check className="h-4 w-4 shrink-0 text-violet-600" /> : null}
                  </button>
                </li>
              )
            })
          )}
        </ul>
      ) : null}
    </div>
  )
}
