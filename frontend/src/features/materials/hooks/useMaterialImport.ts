import { useCallback, useState } from "react"
import { toast } from "sonner"

import { importMaterials } from "@/features/materials/api"
import { parseInventoryCsv, type ParsedImportRow } from "@/features/materials/domain/parse-csv"
import { MATERIAL_LABELS } from "@/features/materials/labels"
import type { MaterialImportResult } from "@/features/materials/types"
import { ApiError } from "@/shared/api/client"

export function useMaterialImport() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ParsedImportRow[]>([])
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<MaterialImportResult | null>(null)

  const validRows = preview.filter((row) => !row.error)
  const invalidRows = preview.filter((row) => row.error)

  const loadFile = useCallback(async (next: File) => {
    setParsing(true)
    setResult(null)
    setFile(next)
    try {
      const text = await next.text()
      const rows = parseInventoryCsv(text)
      setPreview(rows)
      if (rows.length === 0) {
        toast.error(MATERIAL_LABELS.import.emptyFile)
      }
    } catch {
      setPreview([])
      toast.error(MATERIAL_LABELS.import.parseError)
    } finally {
      setParsing(false)
    }
  }, [])

  const clear = useCallback(() => {
    setFile(null)
    setPreview([])
    setResult(null)
  }, [])

  async function runImport(): Promise<boolean> {
    if (!file) return false
    if (validRows.length === 0) {
      toast.error(MATERIAL_LABELS.import.noValidRows)
      return false
    }

    setImporting(true)
    try {
      const importResult = await importMaterials(file)
      setResult(importResult)
      if (importResult.errors.length > 0) {
        toast.warning(MATERIAL_LABELS.import.partialSuccess(importResult))
      } else {
        toast.success(MATERIAL_LABELS.import.success(importResult))
      }
      return importResult.created + importResult.updated > 0
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : MATERIAL_LABELS.import.importError
      toast.error(message)
      return false
    } finally {
      setImporting(false)
    }
  }

  return {
    file,
    preview,
    validRows,
    invalidRows,
    parsing,
    importing,
    result,
    loadFile,
    clear,
    runImport,
  }
}
