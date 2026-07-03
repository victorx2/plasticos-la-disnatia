import { BRANDING, brandAssetUrl } from "@/config/branding"
import { cn } from "@/shared/lib/utils"

export function BrandMark({
  className,
  imgClassName,
  fill = false,
}: {
  className?: string
  imgClassName?: string
  fill?: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-transparent",
        fill ? "size-full min-h-0 min-w-0" : "size-12 shrink-0",
        className,
      )}
    >
      <img
        src={brandAssetUrl()}
        alt={BRANDING.siteName}
        className={cn(
          fill
            ? "size-full max-h-full max-w-[72%] object-contain object-center"
            : "h-full w-full max-h-12 object-contain object-center",
          imgClassName,
        )}
        loading="eager"
        decoding="async"
      />
    </div>
  )
}
