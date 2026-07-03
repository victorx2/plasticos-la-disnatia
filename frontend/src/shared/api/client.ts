import { getStoredToken } from "@/shared/auth/session"
import type { ApiErrorBody } from "@/features/auth/types"

export function apiBase(): string {
  // En desarrollo (LAN o tunnel Cloudflare) usar siempre el proxy de Vite:
  // https://xxx.trycloudflare.com/api → servidor local, no 127.0.0.1 del visitante.
  if (import.meta.env.DEV && typeof window !== "undefined") {
    return `${window.location.origin}/api`
  }

  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined
  const fromEnv = raw?.trim().replace(/\/$/, "")
  if (fromEnv) return fromEnv

  return "http://127.0.0.1:8001/api"
}

export class ApiError extends Error {
  status: number
  body: ApiErrorBody

  constructor(message: string, status: number, body: ApiErrorBody) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.body = body
  }
}

function buildUrl(path: string, query?: Record<string, string | number | undefined>): string {
  const base = apiBase().replace(/\/$/, "")
  const segment = path.startsWith("/") ? path.slice(1) : path
  let url = `${base}/${segment}`
  if (query) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") params.set(key, String(value))
    }
    const qs = params.toString()
    if (qs) url += `?${qs}`
  }
  return url
}

export function authHeaders(): Record<string, string> {
  const token = getStoredToken()
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

export async function getJson<T>(
  path: string,
  query?: Record<string, string | number | undefined>,
): Promise<T> {
  const res = await fetch(buildUrl(path, query), { headers: authHeaders() })
  const data = (await res.json().catch(() => ({}))) as T & ApiErrorBody

  if (res.status === 401) {
    throw new ApiError("Sesión expirada o no autorizada.", 401, {})
  }

  if (!res.ok) {
    throw new ApiError(
      (data as ApiErrorBody).message || `Error ${res.status}`,
      res.status,
      data as ApiErrorBody,
    )
  }

  return data as T
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(buildUrl(path), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  })

  const data = (await res.json().catch(() => ({}))) as T & ApiErrorBody

  if (res.status === 401) {
    throw new ApiError("Sesión expirada o no autorizada.", 401, {})
  }

  if (!res.ok) {
    throw new ApiError(
      (data as ApiErrorBody).message || `Error ${res.status}`,
      res.status,
      data as ApiErrorBody,
    )
  }

  return data as T
}

export async function patchJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(buildUrl(path), {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(body),
  })

  const data = (await res.json().catch(() => ({}))) as T & ApiErrorBody

  if (res.status === 401) {
    throw new ApiError("Sesión expirada o no autorizada.", 401, {})
  }

  if (!res.ok) {
    throw new ApiError(
      (data as ApiErrorBody).message || `Error ${res.status}`,
      res.status,
      data as ApiErrorBody,
    )
  }

  return data as T
}

function multipartHeaders(): Record<string, string> {
  const token = getStoredToken()
  const headers: Record<string, string> = { Accept: "application/json" }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

export async function postFormData<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(buildUrl(path), {
    method: "POST",
    headers: multipartHeaders(),
    body: formData,
  })

  const data = (await res.json().catch(() => ({}))) as T & ApiErrorBody

  if (res.status === 401) {
    throw new ApiError("Sesión expirada o no autorizada.", 401, {})
  }

  if (!res.ok) {
    throw new ApiError(
      (data as ApiErrorBody).message || `Error ${res.status}`,
      res.status,
      data as ApiErrorBody,
    )
  }

  return data as T
}

export async function deleteJson<T>(path: string): Promise<T> {
  const res = await fetch(buildUrl(path), {
    method: "DELETE",
    headers: authHeaders(),
  })

  const data = (await res.json().catch(() => ({}))) as T & ApiErrorBody

  if (res.status === 401) {
    throw new ApiError("Sesión expirada o no autorizada.", 401, {})
  }

  if (!res.ok) {
    throw new ApiError(
      (data as ApiErrorBody).message || `Error ${res.status}`,
      res.status,
      data as ApiErrorBody,
    )
  }

  return data as T
}
