export const PHONE_INPUT_MAX = 20
export const PHONE_TABLE_DISPLAY_MAX = 18

const PHONE_PATTERN = /^[+]?[\d\s\-()]+$/

export function sanitizePhoneInput(value: string, max = PHONE_INPUT_MAX): string {
  return value.replace(/[^\d+\s\-()]/g, "").slice(0, max)
}

export function countPhoneDigits(value: string): number {
  return (value.match(/\d/g) ?? []).length
}

export function isValidOptionalPhone(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return true
  if (!PHONE_PATTERN.test(trimmed)) return false
  const digits = countPhoneDigits(trimmed)
  return digits >= 7 && digits <= 15
}

export function phoneTelHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`
}
