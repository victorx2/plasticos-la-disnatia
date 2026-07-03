import { useCallback, useEffect, useState } from "react"

import {
  resolveMediaUrl,
  validatePhotoFile,
  type PhotoValidationError,
} from "@/shared/api/media"

export function usePhotoField() {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [removePhoto, setRemovePhoto] = useState(false)

  const revokePreview = useCallback((url: string | null) => {
    if (url?.startsWith("blob:")) URL.revokeObjectURL(url)
  }, [])

  useEffect(() => {
    return () => revokePreview(photoPreview)
  }, [photoPreview, revokePreview])

  const loadExisting = useCallback(
    (url: string | null | undefined) => {
      revokePreview(photoPreview)
      setPhotoUrl(url ?? null)
      setPhotoPreview(null)
      setPhotoFile(null)
      setRemovePhoto(false)
    },
    [photoPreview, revokePreview],
  )

  function selectFile(file: File | null): PhotoValidationError | null {
    if (!file) {
      revokePreview(photoPreview)
      setPhotoFile(null)
      setPhotoPreview(null)
      return null
    }
    const error = validatePhotoFile(file)
    if (error) return error
    revokePreview(photoPreview)
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
    setRemovePhoto(false)
    return null
  }

  function markRemove() {
    revokePreview(photoPreview)
    setPhotoFile(null)
    setPhotoPreview(null)
    setPhotoUrl(null)
    setRemovePhoto(true)
  }

  function previewSrc(name: string): string | undefined {
    if (photoPreview) return photoPreview
    return resolveMediaUrl(photoUrl ?? undefined)
  }

  return {
    photoUrl,
    photoFile,
    removePhoto,
    previewSrc,
    selectFile,
    markRemove,
    loadExisting,
  }
}
