import { AuthPageShell } from "@/features/auth/components/AuthPageShell"
import { LoginForm } from "@/features/auth/components/LoginForm"

export function LoginPage() {
  return (
    <AuthPageShell>
      <LoginForm />
    </AuthPageShell>
  )
}
