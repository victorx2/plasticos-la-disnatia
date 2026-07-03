import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import {
  buildRifValue,
  DEFAULT_RIF_FORM,
  onlyDigits,
  parseStoredRif,
  RIF_LETTERS,
  type RifFormParts,
  type RifLetter,
} from "@/features/masters/shared/rif"
import { isValidOptionalPhone, sanitizePhoneInput } from "@/features/masters/shared/phone"
import { usePhotoField } from "@/features/masters/shared/hooks/usePhotoField"
import { MASTER_PHOTO_LABELS } from "@/features/masters/shared/photoLabels"
import {
  createSupplier,
  deleteSupplierPhoto,
  fetchSupplier,
  updateSupplier,
  uploadSupplierPhoto,
} from "@/features/masters/suppliers/api"
import { SUPPLIER_LABELS } from "@/features/masters/suppliers/labels"
import type { SupplierInput } from "@/features/masters/suppliers/types"
import { ApiError } from "@/shared/api/client"

export type SupplierFormState = {
  name: string
  noRif: boolean
  email: string
  phone: string
  address: string
} & RifFormParts

const EMPTY_FORM: SupplierFormState = {
  name: "",
  noRif: false,
  ...DEFAULT_RIF_FORM,
  email: "",
  phone: "",
  address: "",
}

function validateForm(form: SupplierFormState): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!form.name.trim()) {
    errors.name = SUPPLIER_LABELS.validation.name
  }
  if (!form.noRif) {
    const main = onlyDigits(form.rifMain, 8)
    const dv = onlyDigits(form.rifDv, 1)
    if (main.length < 7 || dv.length !== 1) {
      errors.rif = SUPPLIER_LABELS.validation.rifRequired
    }
  }
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = SUPPLIER_LABELS.validation.email
  }
  if (!isValidOptionalPhone(form.phone)) {
    errors.phone = SUPPLIER_LABELS.validation.phone
  }
  return errors
}

function toPayload(form: SupplierFormState): SupplierInput {
  const rif = form.noRif ? null : buildRifValue(form) || null
  return {
    name: form.name.trim(),
    no_rif: form.noRif,
    rif,
    email: form.email.trim() || null,
    phone: form.phone.trim() || null,
    address: form.address.trim() || null,
  }
}

export function useSupplierForm(supplierId: number | null) {
  const isEdit = supplierId != null && supplierId > 0
  const [form, setForm] = useState<SupplierFormState>(EMPTY_FORM)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const photo = usePhotoField()

  const patch = useCallback((partial: Partial<SupplierFormState>) => {
    setForm((prev) => ({ ...prev, ...partial }))
  }, [])

  useEffect(() => {
    if (!isEdit || supplierId == null) return

    let cancelled = false
    setLoading(true)
    void (async () => {
      try {
        const supplier = await fetchSupplier(supplierId)
        if (cancelled) return

        const hasRif = Boolean(supplier.rif?.trim())
        const rif = hasRif ? parseStoredRif(supplier.rif) : DEFAULT_RIF_FORM

        setForm({
          name: supplier.name ?? "",
          noRif: !hasRif,
          rifLetter: rif.rifLetter,
          rifMain: rif.rifMain,
          rifDv: rif.rifDv,
          email: supplier.email ?? "",
          phone: supplier.phone ?? "",
          address: supplier.address ?? "",
        })
        photo.loadExisting(supplier.photo_url)
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof ApiError ? error.message : SUPPLIER_LABELS.loadOneError
          toast.error(message)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isEdit, supplierId, photo.loadExisting])

  function handlePhotoSelect(file: File | null) {
    if (!file) return
    const error = photo.selectFile(file)
    if (error === "format") {
      toast.error(MASTER_PHOTO_LABELS.invalidFormat)
      return
    }
    if (error === "size") {
      toast.error(MASTER_PHOTO_LABELS.tooLarge)
    }
  }

  async function submit(): Promise<boolean> {
    const validationErrors = validateForm(form)
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      toast.error(SUPPLIER_LABELS.validation.summary)
      return false
    }

    setSaving(true)
    setFieldErrors({})
    try {
      const payload = toPayload(form)
      let savedId = supplierId
      if (isEdit && supplierId != null) {
        await updateSupplier(supplierId, payload)
      } else {
        const created = await createSupplier(payload)
        savedId = created.id
      }

      if (savedId != null) {
        if (photo.removePhoto) {
          await deleteSupplierPhoto(savedId)
        } else if (photo.photoFile) {
          await uploadSupplierPhoto(savedId, photo.photoFile)
        }
      }

      toast.success(isEdit ? SUPPLIER_LABELS.savedEdit : SUPPLIER_LABELS.saved)
      return true
    } catch (error) {
      if (error instanceof ApiError && error.body.errors) {
        const next: Record<string, string> = {}
        for (const [key, messages] of Object.entries(error.body.errors)) {
          if (messages[0]) next[key] = messages[0]
        }
        setFieldErrors(next)
      }
      const message = error instanceof ApiError ? error.message : SUPPLIER_LABELS.saveError
      toast.error(message)
      return false
    } finally {
      setSaving(false)
    }
  }

  const displayName = form.name.trim() || "Nuevo proveedor"

  return {
    form,
    patch,
    loading,
    saving,
    isEdit,
    fieldErrors,
    submit,
    rifLetters: RIF_LETTERS,
    setRifLetter: (letter: RifLetter) => patch({ rifLetter: letter }),
    setRifMain: (value: string) => patch({ rifMain: onlyDigits(value, 8) }),
    setRifDv: (value: string) => patch({ rifDv: onlyDigits(value, 1) }),
    setPhone: (value: string) => patch({ phone: sanitizePhoneInput(value) }),
    setNoRif: (noRif: boolean) => patch({ noRif }),
    photoPreviewSrc: photo.previewSrc(displayName),
    handlePhotoSelect,
    handlePhotoRemove: photo.markRemove,
  }
}
