export function toDateInputValue(value: string | null | undefined): string {
  if (!value) return new Date().toISOString().slice(0, 10)
  const d = value.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : new Date().toISOString().slice(0, 10)
}
