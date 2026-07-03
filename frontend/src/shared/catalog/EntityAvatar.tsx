import { entityAvatarPalette, entityInitials } from "@/shared/catalog/entityDisplay"
import { resolveMediaUrl } from "@/shared/api/media"
import { cn } from "@/shared/lib/utils"

type EntityAvatarProps = {
  name: string
  photoUrl?: string | null
  size?: "sm" | "md"
  className?: string
}

export function EntityAvatar({ name, photoUrl, size = "sm", className }: EntityAvatarProps) {
  const src = resolveMediaUrl(photoUrl)
  const palette = entityAvatarPalette(name)
  const initials = entityInitials(name)
  const sizeClass = size === "sm" ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm"

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={cn(
          "inline-flex shrink-0 rounded-lg object-cover ring-1 ring-slate-200/80",
          sizeClass,
          className,
        )}
      />
    )
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg font-semibold ring-1",
        size === "sm" ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm",
        palette,
        className,
      )}
      aria-hidden
    >
      {initials}
    </span>
  )
}
