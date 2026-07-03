import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import {
  createVendor,
  deleteVendorPhoto,
  fetchVendor,
  updateVendor,
  uploadVendorPhoto,
} from "@/features/masters/vendors/api"
import { VENDOR_LABELS } from "@/features/masters/vendors/labels"
import type { VendorInput } from "@/features/masters/vendors/types"
import { usePhotoField } from "@/features/masters/shared/hooks/usePhotoField"
import { MASTER_PHOTO_LABELS } from "@/features/masters/shared/photoLabels"
import {
  isValidOptionalPhone,
  sanitizePhoneInput,
} from "@/features/masters/shared/phone"
import { ApiError } from "@/shared/api/client"

export type VendorFormState = {
  name: string
  phonePrimary: string
  phoneSecondary: string
}

const EMPTY_FORM: VendorFormState = {
  name: "",
  phonePrimary: "",
  phoneSecondary: "",
}

function validateForm(form: VendorFormState): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!form.name.trim()) {
    errors.name = VENDOR_LABELS.validation.name
  }
  if (!isValidOptionalPhone(form.phonePrimary)) {
    errors.phonePrimary = VENDOR_LABELS.validation.phone
  }
  if (!isValidOptionalPhone(form.phoneSecondary)) {
    errors.phoneSecondary = VENDOR_LABELS.validation.phone
  }
  return errors
}

function toPayload(form: VendorFormState): VendorInput {
  return {
    name: form.name.trim(),
    phone_primary: form.phonePrimary.trim() || null,
    phone_secondary: form.phoneSecondary.trim() || null,
  }
}

export function useVendorForm(vendorId: number | null) {
  const isEdit = vendorId != null && vendorId > 0
  const [form, setForm] = useState<VendorFormState>(EMPTY_FORM)
  const [clientsCount, setClientsCount] = useState(0)
  const [active, setActive] = useState(true)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const photo = usePhotoField()

  const patch = useCallback((partial: Partial<VendorFormState>) => {
    setForm((prev) => ({ ...prev, ...partial }))
  }, [])

  useEffect(() => {
    if (!isEdit || vendorId == null) return

    let cancelled = false
    setLoading(true)
    void (async () => {
      try {
        const vendor = await fetchVendor(vendorId)
        if (cancelled) return
        setForm({
          name: vendor.name ?? "",
          phonePrimary: vendor.phone_primary ?? "",
          phoneSecondary: vendor.phone_secondary ?? "",
        })
        photo.loadExisting(vendor.photo_url)
        setClientsCount(vendor.clients_count ?? 0)
        setActive(vendor.active)
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof ApiError ? error.message : VENDOR_LABELS.loadOneError
          toast.error(message)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isEdit, vendorId, photo.loadExisting])

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
      toast.error(VENDOR_LABELS.validation.summary)
      return false
    }

    setSaving(true)
    setFieldErrors({})
    try {
      const payload = toPayload(form)
      let savedId = vendorId
      if (isEdit && vendorId != null) {
        await updateVendor(vendorId, payload)
      } else {
        const created = await createVendor(payload)
        savedId = created.id
      }

      if (savedId != null) {
        if (photo.removePhoto) {
          await deleteVendorPhoto(savedId)
        } else if (photo.photoFile) {
          await uploadVendorPhoto(savedId, photo.photoFile)
        }
      }

      toast.success(isEdit ? VENDOR_LABELS.savedEdit : VENDOR_LABELS.saved)
      return true
    } catch (error) {
      if (error instanceof ApiError && error.body.errors) {
        const next: Record<string, string> = {}
        for (const [key, messages] of Object.entries(error.body.errors)) {
          const keyMap: Record<string, string> = {
            phone_primary: "phonePrimary",
            phone_secondary: "phoneSecondary",
          }
          const uiKey = keyMap[key] ?? key
          if (messages[0]) next[uiKey] = messages[0]
        }
        setFieldErrors(next)
      }
      const message = error instanceof ApiError ? error.message : VENDOR_LABELS.saveError
      toast.error(message)
      return false
    } finally {
      setSaving(false)
    }
  }

  const displayName = form.name.trim() || "Nuevo vendedor"

  return {
    form,
    patch,
    loading,
    saving,
    isEdit,
    active,
    clientsCount,
    fieldErrors,
    submit,
    setPhonePrimary: (value: string) => patch({ phonePrimary: sanitizePhoneInput(value) }),
    setPhoneSecondary: (value: string) => patch({ phoneSecondary: sanitizePhoneInput(value) }),
    photoPreviewSrc: photo.previewSrc(displayName),
    handlePhotoSelect,
    handlePhotoRemove: photo.markRemove,
  }
}
