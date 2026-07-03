import { Pencil } from "lucide-react"

import { CatalogIconTooltipButton } from "@/shared/catalog/CatalogIconTooltipButton"

type CatalogEditButtonProps = {
  to: string
  label: string
}

export function CatalogEditButton({ to, label }: CatalogEditButtonProps) {
  return <CatalogIconTooltipButton label={label} icon={Pencil} href={to} />
}
