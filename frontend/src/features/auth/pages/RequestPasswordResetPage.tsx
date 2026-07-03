import { Link } from "react-router-dom"

import { AuthPageShell } from "@/features/auth/components/AuthPageShell"
import { authPanelClass } from "@/shared/catalog/auth-classes"
import { Button } from "@/shared/ui/button"

export function RequestPasswordResetPage() {
  return (
    <AuthPageShell>
      <div className={authPanelClass}>
        <p className="text-sm text-muted-foreground">
          Solicitud de restablecimiento de contraseña — próximamente.
        </p>
        <Button variant="outline" asChild className="mt-4">
          <Link to="/auth/basic/login">Volver al login</Link>
        </Button>
      </div>
    </AuthPageShell>
  )
}
