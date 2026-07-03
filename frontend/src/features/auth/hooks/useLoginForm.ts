import { useCallback, useId, useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { login } from "@/features/auth/api"
import { AUTH_LABELS } from "@/features/auth/labels"
import type { LoginFieldErrors } from "@/features/auth/types"
import { ApiError } from "@/shared/api/client"
import { setAuthSession } from "@/shared/auth/session"

function validateFields(loginValue: string, password: string): LoginFieldErrors {
  const errors: LoginFieldErrors = {}
  if (!loginValue.trim()) {
    errors.login = AUTH_LABELS.errors.usernameRequired
  }
  if (!password) {
    errors.password = AUTH_LABELS.errors.passwordRequired
  }
  return errors
}

function mapApiErrors(error: ApiError): LoginFieldErrors {
  const fieldErrors: LoginFieldErrors = {}
  if (error.body.errors?.login?.[0]) fieldErrors.login = error.body.errors.login[0]
  if (error.body.errors?.password?.[0]) fieldErrors.password = error.body.errors.password[0]
  return fieldErrors
}

export function useLoginForm() {
  const navigate = useNavigate()
  const formId = useId()
  const loginId = `${formId}-login`
  const passwordId = `${formId}-password`

  const [showPassword, setShowPassword] = useState(false)
  const [loginValue, setLoginValue] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<LoginFieldErrors>({})

  const clearFieldError = useCallback((field: keyof LoginFieldErrors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }, [])

  const submit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setErrors({})

      const validationErrors = validateFields(loginValue, password)
      if (validationErrors.login || validationErrors.password) {
        setErrors(validationErrors)
        return
      }

      setSubmitting(true)
      try {
        const data = await login({ login: loginValue, password })
        setAuthSession(data.token, data.user)
        toast.success(AUTH_LABELS.toast.welcome(data.user.name))
        navigate("/resumen", { replace: true })
      } catch (unknown) {
        const fieldErrors =
          unknown instanceof ApiError ? mapApiErrors(unknown) : {}

        if (fieldErrors.login || fieldErrors.password) {
          setErrors(fieldErrors)
        }

        const message =
          fieldErrors.login ||
          fieldErrors.password ||
          (unknown instanceof ApiError ? unknown.message : null) ||
          AUTH_LABELS.errors.loginFailed

        toast.error(message)
      } finally {
        setSubmitting(false)
      }
    },
    [loginValue, password, navigate],
  )

  return {
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
  }
}
