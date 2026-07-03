import { useRef } from "react"
import { Plus } from "lucide-react"

import { PHOTO_ACCEPT } from "@/shared/api/media"
import { EntityAvatar } from "@/shared/catalog/EntityAvatar"
import { cn } from "@/shared/lib/utils"

type PhotoUploadFieldProps = {
  name: string
  previewSrc?: string
  /** sm = h-9 (Input por defecto), md = h-10 (masterInputClassName) */
  size?: "sm" | "md"
  onSelectFile: (file: File | null) => void
  onRemove?: () => void
}

const sizeClasses = {
  sm: {
    box: "h-9 w-9",
    plus: "h-4 w-4",
    plusIcon: "h-2 w-2 stroke-[2.5]",
    plusPos: "-bottom-0.5 -right-0.5 ring-[1.5px]",
    avatar: "sm" as const,
  },
  md: {
    box: "h-10 w-10",
    plus: "h-4 w-4",
    plusIcon: "h-2.5 w-2.5 stroke-[2.5]",
    plusPos: "-bottom-0.5 -right-0.5 ring-[1.5px]",
    avatar: "sm" as const,
  },
}

export function PhotoUploadField({
  name,
  previewSrc,
  size = "sm",
  onSelectFile,
  onRemove,
}: PhotoUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const hasPhoto = Boolean(previewSrc)
  const s = sizeClasses[size]

  function openPicker() {
    inputRef.current?.click()
  }

  return (
    <>
      <button
        type="button"
        className={cn(
          "group relative shrink-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40",
          s.box,
        )}
        aria-label={hasPhoto ? "Cambiar foto" : "Agregar foto"}
        onClick={openPicker}
        onContextMenu={(event) => {
          if (!hasPhoto || !onRemove) return
          event.preventDefault()
          onRemove()
        }}
      >
        {hasPhoto ? (
          <img
            src={previewSrc}
            alt=""
            className={cn(s.box, "rounded-md object-cover ring-1 ring-slate-200/80")}
          />
        ) : (
          <EntityAvatar
            name={name}
            size={s.avatar}
            className={cn(s.box, "rounded-md text-[10px]")}
          />
        )}
        <span
          className={cn(
            "absolute flex items-center justify-center rounded-full bg-violet-600 text-white shadow-sm ring-white transition group-hover:bg-violet-700",
            s.plus,
            s.plusPos,
          )}
          aria-hidden
        >
          <Plus className={s.plusIcon} />
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={PHOTO_ACCEPT}
        hidden
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null
          onSelectFile(file)
          event.target.value = ""
        }}
      />
    </>
  )
}
