import type { LoginResponse } from "@/features/auth/types"
import { postJson } from "@/shared/api/client"

export async function login(credentials: {
  login: string
  password: string
}): Promise<LoginResponse> {
  return postJson<LoginResponse>("auth/login", {
    login: credentials.login.trim(),
    password: credentials.password,
  })
}
