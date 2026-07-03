export type AuthUser = {
  id: number
  name: string
  email: string
  username?: string | null
  role?: string
}

export type LoginResponse = {
  token: string
  token_type: string
  user: AuthUser
}

export type ApiErrorBody = {
  message?: string
  errors?: Record<string, string[]>
}

export type LoginFieldErrors = {
  login?: string
  password?: string
}
