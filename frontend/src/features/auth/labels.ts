export const AUTH_LABELS = {
  loginTitle: "Entrar",
  username: "Usuario",
  password: "Contraseña",
  usernamePlaceholder: "usuario",
  submit: "Entrar",
  submitting: "Entrando…",
  requestReset: "Solicitar restablecimiento de contraseña",
  showPassword: "Mostrar contraseña",
  hidePassword: "Ocultar contraseña",
  brandAria: "Marca Plásticos La Dinastía",
  loginAria: "Iniciar sesión",
  errors: {
    usernameRequired: "El usuario es obligatorio.",
    passwordRequired: "La contraseña es obligatoria.",
    loginFailed: "Error al iniciar sesión.",
  },
  toast: {
    welcome: (name: string) => `Hola, ${name}`,
  },
} as const
