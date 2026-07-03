export const RIF_LETTERS = ["J", "V", "E", "G", "P", "C"] as const

export type RifLetter = (typeof RIF_LETTERS)[number]

export type RifFormParts = {
  rifLetter: RifLetter
  rifMain: string
  rifDv: string
}

export const DEFAULT_RIF_FORM: RifFormParts = {
  rifLetter: "V",
  rifMain: "",
  rifDv: "",
}

export function onlyDigits(value: string, max: number): string {
  return value.replace(/\D/g, "").slice(0, max)
}

export function parseStoredRif(rif: string | null | undefined): RifFormParts {
  const raw = (rif ?? "").trim().toUpperCase()
  if (!raw) return { ...DEFAULT_RIF_FORM }

  const hyphen = raw.match(/^([JVEGPC])-(\d{7,8})-(\d)$/)
  if (hyphen) {
    return {
      rifLetter: hyphen[1] as RifLetter,
      rifMain: hyphen[2],
      rifDv: hyphen[3],
    }
  }

  const compact = raw.replace(/[.\-_]/g, "")
  const m = compact.match(/^([JVEGPC])(\d{8,9})$/)
  if (!m) return { ...DEFAULT_RIF_FORM }

  const digits = m[2]
  return {
    rifLetter: m[1] as RifLetter,
    rifMain: digits.slice(0, -1),
    rifDv: digits.slice(-1),
  }
}

export function buildRifValue(parts: RifFormParts): string {
  const main = onlyDigits(parts.rifMain, 8)
  const dv = onlyDigits(parts.rifDv, 1)
  if (!main || !dv) return ""
  return `${parts.rifLetter}-${main}-${dv}`
}
