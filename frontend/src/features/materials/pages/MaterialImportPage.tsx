import { Link, useNavigate } from "react-router-dom"
import { Boxes, CheckCircle2 } from "lucide-react"

import { ImportDropzone } from "@/features/materials/components/ImportDropzone"
import { ImportPreviewTable } from "@/features/materials/components/ImportPreviewTable"
import { TEMPLATE_URLS } from "@/features/materials/domain/excel-template"
import { useMaterialImport } from "@/features/materials/hooks/useMaterialImport"
import { MATERIAL_LABELS } from "@/features/materials/labels"
import { PageShell } from "@/shared/catalog/PageShell"
import { Button } from "@/shared/ui/button"

export function MaterialImportPage() {
  const navigate = useNavigate()
  const {
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
  } = useMaterialImport()

  async function handleImport() {
    const ok = await runImport()
    if (ok && invalidRows.length === 0) {
      navigate("/materiales")
    }
  }

  return (
    <PageShell
      title={MATERIAL_LABELS.import.title}
      subtitle={MATERIAL_LABELS.import.subtitle}
      icon={Boxes}
      action={
        <Button type="button" variant="outline" asChild>
          <Link to="/materiales">{MATERIAL_LABELS.cancel}</Link>
        </Button>
      }
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">{MATERIAL_LABELS.import.instructions}</p>
          <p className="mt-2">
            <a
              href={TEMPLATE_URLS.inventarioInicial}
              download
              className="text-sm font-medium text-violet-700 hover:underline"
            >
              {MATERIAL_LABELS.templates.downloadInitial}
            </a>
          </p>
        </div>

        {!file ? (
          <ImportDropzone disabled={parsing} onFile={(next) => void loadFile(next)} />
        ) : (
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-900">{file.name}</p>
                <p className="text-sm text-slate-500">
                  {MATERIAL_LABELS.import.fileSummary(validRows.length, invalidRows.length)}
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={clear} disabled={importing}>
                {MATERIAL_LABELS.import.changeFile}
              </Button>
            </div>

            <ImportPreviewTable rows={preview} />

            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                type="button"
                disabled={importing || parsing || validRows.length === 0}
                onClick={() => void handleImport()}
              >
                {importing ? MATERIAL_LABELS.import.importing : MATERIAL_LABELS.import.confirm}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to="/materiales">{MATERIAL_LABELS.cancel}</Link>
              </Button>
            </div>
          </div>
        )}

        {result ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" aria-hidden />
              <div className="space-y-2 text-sm text-emerald-900">
                <p className="font-medium">{MATERIAL_LABELS.import.resultTitle}</p>
                <p>{MATERIAL_LABELS.import.resultSummary(result)}</p>
                {result.errors.length > 0 ? (
                  <ul className="list-inside list-disc text-amber-800">
                    {result.errors.slice(0, 8).map((err) => (
                      <li key={`${err.row}-${err.message}`}>
                        Fila {err.row}: {err.message}
                      </li>
                    ))}
                    {result.errors.length > 8 ? (
                      <li>…y {result.errors.length - 8} más</li>
                    ) : null}
                  </ul>
                ) : null}
                <Button type="button" size="sm" className="mt-2" asChild>
                  <Link to="/materiales">{MATERIAL_LABELS.import.goToList}</Link>
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </PageShell>
  )
}
