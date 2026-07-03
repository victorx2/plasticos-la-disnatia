/** Activa logs: consola del navegador → localStorage.setItem('extrusion-timer-debug','1') */
export function isExtrusionTimerDebugEnabled(): boolean {
  if (import.meta.env.DEV) return true
  try {
    return localStorage.getItem("extrusion-timer-debug") === "1"
  } catch {
    return false
  }
}

export function logExtrusionTimer(event: string, payload?: Record<string, unknown>): void {
  if (!isExtrusionTimerDebugEnabled()) return
  const ts = new Date().toISOString().slice(11, 23)
  if (payload) {
    console.log(`[extrusion-timer ${ts}] ${event}`, payload)
  } else {
    console.log(`[extrusion-timer ${ts}] ${event}`)
  }
}

export function listExtrusionTimerStorageKeys(): string[] {
  const keys: string[] = []
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (
        key &&
        (key.startsWith("extrusion-timer:") ||
          key.startsWith("extrusion-timer-wo:") ||
          key.startsWith("extrusion-register-draft:") ||
          key.startsWith("extrusion-microns-open:"))
      ) {
        keys.push(key)
      }
    }
  } catch {
    // ignore
  }
  try {
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const key = sessionStorage.key(i)
      if (
        key &&
        (key.startsWith("extrusion-register-draft:") ||
          key.startsWith("extrusion-microns-open:"))
      ) {
        keys.push(`session:${key}`)
      }
    }
  } catch {
    // ignore
  }
  return keys.sort()
}

export function dumpExtrusionTimerStorage(
  workOrderId?: string | null,
  sessionId?: number | null,
): Record<string, unknown> {
  const dump: Record<string, unknown> = {
    workOrderId: workOrderId ?? null,
    sessionId: sessionId ?? null,
    localStorage: {} as Record<string, string | null>,
    sessionStorage: {} as Record<string, string | null>,
  }

  const ls = dump.localStorage as Record<string, string | null>
  const ss = dump.sessionStorage as Record<string, string | null>

  for (const key of listExtrusionTimerStorageKeys()) {
    if (key.startsWith("session:")) {
      const realKey = key.slice("session:".length)
      try {
        ss[realKey] = sessionStorage.getItem(realKey)
      } catch {
        ss[realKey] = null
      }
      continue
    }
    try {
      ls[key] = localStorage.getItem(key)
    } catch {
      ls[key] = null
    }
  }

  logExtrusionTimer("STORAGE_DUMP", dump)
  return dump
}
