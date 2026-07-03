import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { createClient, deleteClientPhoto, fetchClient, updateClient, uploadClientPhoto } from "@/features/masters/clients/api"
import { CLIENT_LABELS } from "@/features/masters/clients/labels"
import type { ClientInput } from "@/features/masters/clients/types"
import { fetchVendor } from "@/features/masters/vendors/api"
import { usePhotoField } from "@/features/masters/shared/hooks/usePhotoField"
import { MASTER_PHOTO_LABELS } from "@/features/masters/shared/photoLabels"
import { isValidOptionalPhone, sanitizePhoneInput } from "@/features/masters/shared/phone"
import {
  buildRifValue,
  DEFAULT_RIF_FORM,
  onlyDigits,
  parseStoredRif,
  RIF_LETTERS,
  type RifFormParts,
  type RifLetter,
} from "@/features/masters/shared/rif"
import { ApiError } from "@/shared/api/client"

export type ClientFormState = {
  name: string
  noRif: boolean
  state: string
  city: string
  email: string
  phone: string
  address: string
  vendorId: string
  vendorName: string
} & RifFormParts

const EMPTY_FORM: ClientFormState = {
  name: "",
  noRif: false,
  ...DEFAULT_RIF_FORM,
  state: "",
  city: "",
  email: "",
  phone: "",
  address: "",
  vendorId: "",
  vendorName: "",
}

function validateForm(form: ClientFormState): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!form.name.trim()) {
    errors.name = CLIENT_LABELS.validation.name
  }
  if (!form.noRif) {
    const rifMain = onlyDigits(form.rifMain, 8)
    const rifDv = onlyDigits(form.rifDv, 1)
    if (rifMain.length < 7 || rifDv.length !== 1) {
      errors.rif = CLIENT_LABELS.validation.rifRequired
    }
  }
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = CLIENT_LABELS.validation.email
  }
  if (!isValidOptionalPhone(form.phone)) {
    errors.phone = CLIENT_LABELS.validation.phone
  }
  return errors
}

function toPayload(form: ClientFormState): ClientInput {
  const rif = form.noRif ? null : buildRifValue(form) || null
  const vendorId = form.vendorId.trim() ? Number(form.vendorId) : null
  return {
    name: form.name.trim(),
    no_rif: form.noRif,
    rif,
    state: form.state.trim() || null,
    city: form.city.trim() || null,
    email: form.email.trim() || null,
    phone: form.phone.trim() || null,
    address: form.address.trim() || null,
    vendor_id: vendorId != null && Number.isFinite(vendorId) && vendorId > 0 ? vendorId : null,
  }
}

export function useClientForm(clientId: number | null) {
  const isEdit = clientId != null && clientId > 0
  const [form, setForm] = useState<ClientFormState>(EMPTY_FORM)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const photo = usePhotoField()

  const patch = useCallback((partial: Partial<ClientFormState>) => {
    setForm((prev) => ({ ...prev, ...partial }))
  }, [])

  useEffect(() => {
    if (!isEdit || clientId == null) return

    let cancelled = false
    setLoading(true)
    void (async () => {
      try {
        const client = await fetchClient(clientId)
        if (cancelled) return
        const hasRif = Boolean(client.rif?.trim())
        const rif = parseStoredRif(client.rif)
        let vendorName = ""
        if (client.vendor_id) {
          try {
            const vendor = await fetchVendor(client.vendor_id)
            if (!cancelled) vendorName = vendor.name
          } catch {
            /* inactive or missing vendor — still keep id for save */
          }
        }
        if (cancelled) return
        setForm({
          name: client.name ?? "",
          noRif: !hasRif,
          rifLetter: rif.rifLetter,
          rifMain: hasRif ? rif.rifMain : "",
          rifDv: hasRif ? rif.rifDv : "",
          state: client.state ?? "",
          city: client.city ?? "",
          email: client.email ?? "",
          phone: client.phone ?? "",
          address: client.address ?? "",
          vendorId: client.vendor_id ? String(client.vendor_id) : "",
          vendorName,
        })
        photo.loadExisting(client.photo_url)
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof ApiError ? error.message : CLIENT_LABELS.loadOneError
          toast.error(message)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [clientId, isEdit, photo.loadExisting])

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

  async function submit(): Promise<number | null> {
    const validationErrors = validateForm(form)
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      toast.error(CLIENT_LABELS.validation.summary)
      return null
    }

    setSaving(true)
    setFieldErrors({})
    try {
      const payload = toPayload(form)
      let savedId = clientId
      if (isEdit && clientId != null) {
        await updateClient(clientId, payload)
      } else {
        const created = await createClient(payload)
        savedId = created.id
      }

      if (savedId != null) {
        if (photo.removePhoto) {
          await deleteClientPhoto(savedId)
        } else if (photo.photoFile) {
          await uploadClientPhoto(savedId, photo.photoFile)
        }
      }

      toast.success(isEdit ? CLIENT_LABELS.savedEdit : CLIENT_LABELS.saved)
      return savedId ?? null
    } catch (error) {
      if (error instanceof ApiError && error.body.errors) {
        const next: Record<string, string> = {}
        for (const [key, messages] of Object.entries(error.body.errors)) {
          if (messages[0]) next[key] = messages[0]
        }
        setFieldErrors(next)
      }
      const message = error instanceof ApiError ? error.message : CLIENT_LABELS.saveError
      toast.error(message)
      return null
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
    setRifLetter: (letter: RifLetter) => patch({ rifLetter: letter }),
    setRifMain: (value: string) => patch({ rifMain: onlyDigits(value, 8) }),
    setRifDv: (value: string) => patch({ rifDv: onlyDigits(value, 1) }),
    setPhone: (value: string) => patch({ phone: sanitizePhoneInput(value) }),
    setNoRif: (value: boolean) => patch({ noRif: value }),
    setVendorId: (value: string, name = "") => patch({ vendorId: value, vendorName: name }),
    rifLetters: RIF_LETTERS,
    photoPreviewSrc: photo.previewSrc(form.name.trim() || "Nuevo cliente"),
    handlePhotoSelect,
    handlePhotoRemove: photo.markRemove,
  }
}
