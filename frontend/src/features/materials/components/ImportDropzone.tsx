import { useRef, useState } from "react"
import { FileSpreadsheet, Upload } from "lucide-react"

import { expectedColumnsHint } from "@/features/materials/domain/parse-csv"
import { MATERIAL_LABELS } from "@/features/materials/labels"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"

type ImportDropzoneProps = {
  disabled?: boolean
  onFile: (file: File) => void
}

const ACCEPT = ".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

export function ImportDropzone({ disabled, onFile }: ImportDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  function pickFile(file: File | undefined) {
    if (!file || disabled) return
    onFile(file)
  }

  return (
    <div
      className={cn(
        "rounded-xl border-2 border-dashed p-8 text-center transition-colors",
        dragOver ? "border-violet-400 bg-violet-50/60" : "border-slate-200 bg-slate-50/50",
        disabled && "pointer-events-none opacity-60",
      )}
      onDragOver={(event) => {
        event.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(event) => {
        event.preventDefault()
        setDragOver(false)
        pickFile(event.dataTransfer.files[0])
      }}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-700">
        <FileSpreadsheet className="h-6 w-6" aria-hidden />
      </div>
      <p className="mt-4 text-sm font-medium text-slate-900">{MATERIAL_LABELS.import.dropTitle}</p>
      <p className="mt-1 text-sm text-slate-500">{MATERIAL_LABELS.import.dropHint}</p>
      <p className="mt-3 font-mono text-xs text-slate-400">{expectedColumnsHint()}</p>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(event) => pickFile(event.target.files?.[0])}
      />

      <Button
        type="button"
        variant="outline"
        className="mt-5"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-4 w-4" aria-hidden />
        {MATERIAL_LABELS.import.selectFile}
      </Button>
    </div>
  )
}
