export const BRANDING = {
  appName: "Plásticos",
  siteName: "Plásticos La Dinastía",
  legalName: "Plásticos La Dinastía C.A.",
  slogan: "Tan firme como nuestros sueños",
  logoFile: "brand/plasticos-la-dinastia.jpeg",
  emailDomain: "dinastia.local",
} as const

export function brandAssetUrl(relativePath: string = BRANDING.logoFile): string {
  const base = import.meta.env.BASE_URL ?? "/"
  const normalized = relativePath.replace(/^\//, "")
  const joined = `${base}${normalized}`.replace(/\/+/g, "/").replace(/^\//, "")
  if (typeof window !== "undefined") {
    return new URL(joined, window.location.origin).href
  }
  return `/${joined}`
}
