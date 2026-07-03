import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import {
  buildMaterialName,
  buildSkuFromTypeBrand,
  materialBrand,
  materialProductType,
} from "@/features/materials/domain/material-display"
import { DEFAULT_CATEGORY } from "@/features/materials/domain/categories"
import { DEFAULT_UNIT } from "@/features/materials/domain/units"
import { createMaterial, fetchMaterial, updateMaterial } from "@/features/materials/api"
import { MATERIAL_LABELS } from "@/features/materials/labels"
import type { MaterialInput } from "@/features/materials/types"
import { ApiError } from "@/shared/api/client"

export type MaterialFormState = {
  inventory_area: string
  product_type: string
  brand: string
  quantity_kg: string
  units_count: string
  unit: string
  supplier_id: string
  container_number: string
  notes: string
  change_reason: string
}

const EMPTY_FORM: MaterialFormState = {
  inventory_area: DEFAULT_CATEGORY,
  product_type: "",
  brand: "",
  quantity_kg: "",
  units_count: "",
  unit: DEFAULT_UNIT,
  supplier_id: "",
  container_number: "",
  notes: "",
  change_reason: "",
}

function notesWithoutLegacyStockLines(notes: string | null | undefined): string {
  if (!notes?.trim()) return ""
  return notes
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !/^Stock inicial:/i.test(line))
    .join("\n")
}

function toPayload(form: MaterialFormState, isEdit: boolean): MaterialInput {
  const sku = buildSkuFromTypeBrand(form.product_type, form.brand, form.container_number)
  const payload: MaterialInput = {
    sku,
    name: buildMaterialName(form.product_type, form.brand),
    inventory_area: form.inventory_area,
    product_type: form.product_type.trim() || null,
    brand: form.brand.trim() || null,
    units_count: form.units_count.trim() || null,
    container_number: form.container_number.trim() || null,
    unit: DEFAULT_UNIT,
    min_stock: "0",
    notes: notesWithoutLegacyStockLines(form.notes) || null,
  }

  const sid = form.supplier_id.trim()
  if (sid) {
    payload.supplier_id = Number(sid)
  }

  if (isEdit && form.change_reason.trim()) {
    payload.change_reason = form.change_reason.trim()
  }

  const kg = form.quantity_kg.trim()
  if (kg) {
    payload.quantity_on_hand = kg
  }

  return payload
}

export function useMaterialForm(materialId: number | null) {
  const isEdit = materialId != null && materialId > 0
  const [form, setForm] = useState<MaterialFormState>(EMPTY_FORM)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const patch = useCallback((partial: Partial<MaterialFormState>) => {
    setForm((prev) => ({ ...prev, ...partial }))
  }, [])

  useEffect(() => {
    if (!isEdit || materialId == null) return

    let cancelled = false
    setLoading(true)
    void (async () => {
      try {
        const material = await fetchMaterial(materialId)
        if (cancelled) return

        const tipo = materialProductType(material)
        const marca = materialBrand(material)

        setForm({
          inventory_area: material.inventory_area ?? DEFAULT_CATEGORY,
          product_type: tipo === "—" ? "" : tipo,
          brand: marca === "—" ? "" : marca,
          quantity_kg: material.quantity_on_hand ?? "",
          units_count:
            material.units_count != null ? String(material.units_count) : "",
          unit: material.unit ?? DEFAULT_UNIT,
          supplier_id: material.supplier_id ? String(material.supplier_id) : "",
          container_number: material.container_number ?? "",
          notes: notesWithoutLegacyStockLines(material.notes),
          change_reason: "",
        })
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof ApiError ? error.message : MATERIAL_LABELS.loadOneError
          toast.error(message)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isEdit, materialId])

  async function submit(): Promise<boolean> {
    setSaving(true)
    setFieldErrors({})
    try {
      const payload = toPayload(form, isEdit)
      if (isEdit && materialId != null) {
        await updateMaterial(materialId, payload)
      } else {
        await createMaterial(payload)
      }
      return true
    } catch (error) {
      if (error instanceof ApiError && error.body.errors) {
        const next: Record<string, string> = {}
        for (const [key, messages] of Object.entries(error.body.errors)) {
          if (messages[0]) next[key] = messages[0]
        }
        setFieldErrors(next)
      }
      const message = error instanceof ApiError ? error.message : MATERIAL_LABELS.saveError
      toast.error(message)
      return false
    } finally {
      setSaving(false)
    }
  }

  return {
    form,
    patch,
    loading,
    saving,
    isEdit,
    fieldErrors,
    submit,
  }
}
