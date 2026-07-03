import { BRANDING, brandAssetUrl } from "@/config/branding"

export function exportBrandTitle(): string {
  return BRANDING.legalName
}

export function exportBrandSubtitle(): string {
  return BRANDING.slogan
}

export function buildExportBrandHtml(): string {
  const logoUrl = brandAssetUrl()
  return `<div style="display:flex;align-items:center;gap:14px;margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;">
  <img src="${logoUrl}" alt="${BRANDING.siteName}" style="max-height:58px;max-width:210px;object-fit:contain;" />
  <div>
    <div style="font-size:15px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#111;">${BRANDING.siteName}</div>
    <div style="font-size:11px;color:#475569;margin-top:2px;">${BRANDING.slogan}</div>
  </div>
</div>`
}
