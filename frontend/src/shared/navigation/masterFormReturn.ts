/** Rutas de formularios maestros con retorno a otra pantalla (p. ej. orden de producción). */

export function buildMasterFormHref(
  basePath: "/clientes/form" | "/productos/form",
  options?: {
    returnTo?: string
    clientId?: string | number | null
  },
): string {
  const params = new URLSearchParams()
  if (options?.returnTo) params.set("return", options.returnTo)
  if (options?.clientId) params.set("client_id", String(options.clientId))
  const qs = params.toString()
  return qs ? `${basePath}?${qs}` : basePath
}

export function resolveAfterMasterSave(
  returnTo: string | null,
  extra?: Record<string, string | number | null | undefined>,
): string {
  if (!returnTo || !returnTo.startsWith("/")) return returnTo ?? "/"

  const [pathname, existingSearch = ""] = returnTo.split("?")
  const params = new URLSearchParams(existingSearch)
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value != null && String(value).trim() !== "") {
        params.set(key, String(value))
      }
    }
  }
  const qs = params.toString()
  return qs ? `${pathname}?${qs}` : pathname
}

export function isSafeReturnPath(path: string | null): path is string {
  return Boolean(path && path.startsWith("/") && !path.startsWith("//"))
}
