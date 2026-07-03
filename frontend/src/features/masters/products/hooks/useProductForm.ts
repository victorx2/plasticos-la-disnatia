import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { createProduct, fetchProduct, updateProduct } from "@/features/masters/products/api"
import { PRODUCT_LABELS } from "@/features/masters/products/labels"
import { useClientOptions } from "@/features/masters/shared/hooks/useClientOptions"
import type { ProductInput } from "@/features/masters/products/types"
import { ApiError } from "@/shared/api/client"

export type ProductFormState = {
  clientId: string
  name: string
  barcode: string
  structure: string
}

const EMPTY_FORM: ProductFormState = {
  clientId: "",
  name: "",
  barcode: "",
  structure: "",
}

function validateForm(form: ProductFormState): Record<string, string> {
  const errors: Record<string, string> = {}
  const clientId = Number(form.clientId)
  if (!form.clientId || !Number.isFinite(clientId) || clientId <= 0) {
    errors.client_id = PRODUCT_LABELS.validation.client
  }
  if (!form.name.trim()) {
    errors.name = PRODUCT_LABELS.validation.name
  }
  return errors
}

function toPayload(form: ProductFormState, isEdit: boolean): ProductInput {
  const clientId = Number(form.clientId)
  const payload: ProductInput = {
    client_id: clientId,
    name: form.name.trim(),
    barcode: form.barcode.trim() || null,
    structure: form.structure.trim() || null,
  }
  if (!isEdit) {
    payload.cpe = null
    payload.mps = null
    payload.print_type = null
  }
  return payload
}

export function useProductForm(
  productId: number | null,
  options?: { initialClientId?: string | null },
) {
  const isEdit = productId != null && productId > 0
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM)
  const { clients, loading: loadingClients } = useClientOptions()
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const patch = useCallback((partial: Partial<ProductFormState>) => {
    setForm((prev) => ({ ...prev, ...partial }))
  }, [])

  useEffect(() => {
    if (isEdit || !options?.initialClientId) return
    const cid = options.initialClientId.trim()
    if (!cid) return
    patch({ clientId: cid })
  }, [isEdit, options?.initialClientId, patch])

  useEffect(() => {
    if (!isEdit || productId == null) return

    let cancelled = false
    setLoading(true)
    void (async () => {
      try {
        const product = await fetchProduct(productId)
        if (cancelled) return
        setForm({
          clientId: product.client_id != null ? String(product.client_id) : "",
          name: product.name ?? "",
          barcode: product.barcode ?? "",
          structure: product.structure ?? "",
        })
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof ApiError ? error.message : PRODUCT_LABELS.loadOneError
          toast.error(message)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isEdit, productId])

  async function submit(): Promise<number | null> {
    const validationErrors = validateForm(form)
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      toast.error(PRODUCT_LABELS.validation.summary)
      return null
    }

    setSaving(true)
    setFieldErrors({})
    try {
      const payload = toPayload(form, isEdit)
      let savedId = productId
      if (isEdit && productId != null) {
        await updateProduct(productId, payload)
      } else {
        const created = await createProduct(payload)
        savedId = created.id
      }
      toast.success(isEdit ? PRODUCT_LABELS.savedEdit : PRODUCT_LABELS.saved)
      return savedId ?? null
    } catch (error) {
      if (error instanceof ApiError && error.body.errors) {
        const next: Record<string, string> = {}
        for (const [key, messages] of Object.entries(error.body.errors)) {
          if (messages[0]) next[key] = messages[0]
        }
        setFieldErrors(next)
      }
      const message = error instanceof ApiError ? error.message : PRODUCT_LABELS.saveError
      toast.error(message)
      return null
    } finally {
      setSaving(false)
    }
  }

  return {
    form,
    patch,
    clients,
    loading,
    loadingClients,
    saving,
    isEdit,
    fieldErrors,
    submit,
  }
}
