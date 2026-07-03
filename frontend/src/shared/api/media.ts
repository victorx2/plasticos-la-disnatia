import { apiBase } from "@/shared/api/client"

export function resolveMediaUrl(path: string | null | undefined): string | undefined {
  if (!path?.trim()) return undefined
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("blob:") ||
    path.startsWith("data:")
  ) {
    return path
  }

  if (import.meta.env.DEV && typeof window !== "undefined") {
    return `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`
  }

  const api = apiBase().replace(/\/$/, "")
  const origin = api.endsWith("/api") ? api.slice(0, -4) : api.replace(/\/api$/, "")
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`
}

export const PHOTO_ACCEPT = "image/jpeg,image/png,image/webp"
export const PHOTO_MAX_BYTES = 2 * 1024 * 1024

export type PhotoValidationError = "format" | "size"

export function validatePhotoFile(file: File): PhotoValidationError | null {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return "format"
  }
  if (file.size > PHOTO_MAX_BYTES) return "size"
  return null
}
