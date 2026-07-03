import type { ReactNode } from "react"

import { BrandMark } from "@/features/auth/components/BrandMark"
import { AUTH_LABELS } from "@/features/auth/labels"
import { authPanelClass } from "@/shared/catalog/auth-classes"
import { cn } from "@/shared/lib/utils"

type AuthPageShellProps = {
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function AuthPageShell({ children, footer, className }: AuthPageShellProps) {
  return (
    <div
      className={cn(
        "flex min-h-svh w-full items-center justify-center bg-gradient-to-b from-primary/[0.06] via-muted/40 to-background p-4 sm:p-6 md:p-10",
        className,
      )}
    >
      <div className="flex w-full max-w-4xl flex-col items-center gap-4 lg:max-w-5xl">
        <div className="grid w-full grid-cols-1 items-start gap-4 md:grid-cols-2 md:items-stretch md:gap-6">
          {children}

          <aside
            className={cn(
              authPanelClass,
              "items-center justify-center bg-gradient-to-br from-primary/[0.1] via-card/98 to-violet-500/[0.08]",
            )}
            aria-label={AUTH_LABELS.brandAria}
          >
            <BrandMark fill />
          </aside>
        </div>

        {footer ? <div className="w-full">{footer}</div> : null}
      </div>
    </div>
  )
}
