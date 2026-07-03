const AVATAR_PALETTES = [
  "bg-violet-100 text-violet-700 ring-violet-200/60",
  "bg-sky-100 text-sky-700 ring-sky-200/60",
  "bg-emerald-100 text-emerald-700 ring-emerald-200/60",
  "bg-amber-100 text-amber-800 ring-amber-200/60",
  "bg-rose-100 text-rose-700 ring-rose-200/60",
  "bg-indigo-100 text-indigo-700 ring-indigo-200/60",
] as const

export function entityInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return "?"
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase()
}

export function entityAvatarPalette(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length]
}

export function displayValue(value: string | null | undefined): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : "—"
}

function titleCaseWord(word: string): string {
  if (!word) return word
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

export function formatLocation(state: string | null | undefined, city: string | null | undefined): string {
  const parts = [state, city]
    .map((part) => part?.trim())
    .filter(Boolean)
    .map((part) =>
      part!
        .split(/\s+/)
        .map((word) => titleCaseWord(word))
        .join(" "),
    )

  return parts.length ? parts.join(", ") : "—"
}

export function formatPhoneDisplay(phone: string | null | undefined): string {
  const trimmed = phone?.trim()
  if (!trimmed) return "—"
  return trimmed
}

export function hasRif(rif: string | null | undefined): boolean {
  return Boolean(rif?.trim())
}

export function truncateText(text: string | null | undefined, max: number): string {
  if (!text?.trim()) return "—"
  const t = text.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}
