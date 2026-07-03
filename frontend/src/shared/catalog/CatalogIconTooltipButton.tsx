import { Link } from "react-router-dom"
import type { LucideIcon } from "lucide-react"

import { Button } from "@/shared/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip"
import { cn } from "@/shared/lib/utils"

type CatalogIconTooltipButtonProps = {
  label: string
  icon: LucideIcon
  href?: string
  onClick?: () => void
  disabled?: boolean
  variant?: "default" | "danger" | "success"
}

export function CatalogIconTooltipButton({
  label,
  icon: Icon,
  href,
  onClick,
  disabled = false,
  variant = "default",
}: CatalogIconTooltipButtonProps) {
  const className = cn(
    "h-8 w-8 p-0 opacity-80 transition-opacity",
    "group-hover:opacity-100",
    variant === "danger" && "text-rose-600 hover:bg-rose-50 hover:text-rose-700",
    variant === "success" && "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700",
    variant === "default" && "text-violet-600 hover:bg-violet-50 hover:text-violet-700",
  )

  const content = (
    <>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      <span className="sr-only">{label}</span>
    </>
  )

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {href ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={className}
            disabled={disabled}
            asChild
          >
            <Link to={href} aria-label={label}>
              {content}
            </Link>
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={className}
            disabled={disabled}
            aria-label={label}
            onClick={onClick}
          >
            {content}
          </Button>
        )}
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  )
}
