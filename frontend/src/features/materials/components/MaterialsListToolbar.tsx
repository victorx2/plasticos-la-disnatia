import { Link } from "react-router-dom"
import { Download, Plus, Upload } from "lucide-react"

import { TEMPLATE_URLS } from "@/features/materials/domain/excel-template"
import { MATERIAL_LABELS } from "@/features/materials/labels"
import { Button } from "@/shared/ui/button"

export function MaterialsListToolbar() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" asChild>
        <a href={TEMPLATE_URLS.inventarioInicial} download>
          <Download className="h-4 w-4" aria-hidden />
          {MATERIAL_LABELS.templates.downloadInitial}
        </a>
      </Button>

      <Button type="button" variant="outline" asChild>
        <Link to="/materiales/importar">
          <Upload className="h-4 w-4" aria-hidden />
          {MATERIAL_LABELS.templates.importExcel}
        </Link>
      </Button>

      <Button type="button" asChild>
        <Link to="/materiales/form">
          <Plus className="h-4 w-4" aria-hidden />
          {MATERIAL_LABELS.newMaterial}
        </Link>
      </Button>
    </div>
  )
}
