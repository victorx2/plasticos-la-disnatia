import type { ComponentPropsWithoutRef } from "react"
import { AtSign, Eye, EyeOff, KeyRound, LogIn } from "lucide-react"
import { Link } from "react-router-dom"

import { useLoginForm } from "@/features/auth/hooks/useLoginForm"
import { AUTH_LABELS } from "@/features/auth/labels"
import { authFormInputClass, authPanelClass } from "@/shared/catalog/auth-classes"
import { LabeledField } from "@/shared/catalog/LabeledField"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { cn } from "@/shared/lib/utils"

export function LoginForm({
  className,
  ...props
}: ComponentPropsWithoutRef<"form">) {
  const {
    loginId,
    passwordId,
    showPassword,
    setShowPassword,
    loginValue,
    setLoginValue,
    password,
    setPassword,
    submitting,
    errors,
    clearFieldError,
    submit,
  } = useLoginForm()

  return (
    <form
      className={cn(authPanelClass, "justify-between", className)}
      onSubmit={submit}
      noValidate
      aria-label={AUTH_LABELS.loginAria}
      {...props}
    >
      <div className="grid flex-1 content-center gap-4">
        <h2 className="inline-flex items-center gap-2 text-base font-semibold md:hidden">
          <LogIn className="h-4 w-4 text-primary" aria-hidden />
          {AUTH_LABELS.loginTitle}
        </h2>

        <div className="grid gap-4">
          <LabeledField label={AUTH_LABELS.username} htmlFor={loginId} icon={AtSign}>
            <Input
              id={loginId}
              name="login"
              type="text"
              autoComplete="username"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              placeholder={AUTH_LABELS.usernamePlaceholder}
              value={loginValue}
              onChange={(ev) => {
                setLoginValue(ev.target.value)
                if (errors.login) clearFieldError("login")
              }}
              disabled={submitting}
              className={authFormInputClass}
              aria-invalid={Boolean(errors.login)}
            />
            {errors.login ? (
              <p className="text-destructive text-sm" role="alert">
                {errors.login}
              </p>
            ) : null}
          </LabeledField>

          <LabeledField label={AUTH_LABELS.password} htmlFor={passwordId} icon={KeyRound}>
            <div className="relative">
              <Input
                id={passwordId}
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(ev) => {
                  setPassword(ev.target.value)
                  if (errors.password) clearFieldError("password")
                }}
                disabled={submitting}
                className={cn(authFormInputClass, "pr-11")}
                aria-invalid={Boolean(errors.password)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0.5 top-1/2 h-9 w-9 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={
                  showPassword ? AUTH_LABELS.hidePassword : AUTH_LABELS.showPassword
                }
                disabled={submitting}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.password ? (
              <p className="text-destructive text-sm" role="alert">
                {errors.password}
              </p>
            ) : null}
          </LabeledField>
        </div>
      </div>

      <div className="grid shrink-0 gap-3 border-t border-primary/10 pt-4">
        <Button type="submit" className="h-11 w-full shadow-sm" disabled={submitting} size="lg">
          {submitting ? AUTH_LABELS.submitting : AUTH_LABELS.submit}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full gap-2 border-primary/25 text-foreground shadow-sm hover:bg-primary/5"
          asChild
        >
          <Link to="/auth/basic/request-reset">
            <KeyRound className="size-4 shrink-0" aria-hidden />
            {AUTH_LABELS.requestReset}
          </Link>
        </Button>
      </div>
    </form>
  )
}
