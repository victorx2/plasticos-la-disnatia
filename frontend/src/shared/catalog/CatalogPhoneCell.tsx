import { Phone } from "lucide-react"

import { formatPhoneDisplay, truncateText } from "@/shared/catalog/entityDisplay"
import { phoneTelHref } from "@/features/masters/shared/phone"

type CatalogPhoneCellProps = {
  phone: string | null | undefined
  truncateAt?: number
}

export function CatalogPhoneCell({ phone, truncateAt = 18 }: CatalogPhoneCellProps) {
  const display = formatPhoneDisplay(phone)
  if (display === "—") {
    return <span className="text-slate-400">—</span>
  }

  const short = truncateText(display, truncateAt)
  const truncated = short !== display

  return (
    <a
      href={phoneTelHref(display)}
      className="inline-flex max-w-full min-w-0 items-center gap-1.5 text-slate-700 hover:text-violet-700"
      title={truncated ? display : undefined}
    >
      <Phone className="h-3.5 w-3.5 shrink-0 text-sky-500" aria-hidden />
      <span className="truncate">{short}</span>
    </a>
  )
}
