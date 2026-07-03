import { UserCheck, UserMinus } from "lucide-react"

import { CatalogIconTooltipButton } from "@/shared/catalog/CatalogIconTooltipButton"

type CatalogStatusToggleButtonProps = {
  active: boolean
  activateLabel: string
  deactivateLabel: string
  disabled?: boolean
  onToggle: () => void
}

export function CatalogStatusToggleButton({
  active,
  activateLabel,
  deactivateLabel,
  disabled = false,
  onToggle,
}: CatalogStatusToggleButtonProps) {
  const label = active ? deactivateLabel : activateLabel

  return (
    <CatalogIconTooltipButton
      label={label}
      icon={active ? UserMinus : UserCheck}
      variant={active ? "danger" : "success"}
      disabled={disabled}
      onClick={onToggle}
    />
  )
}
