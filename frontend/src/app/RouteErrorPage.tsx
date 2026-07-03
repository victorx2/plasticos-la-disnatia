import { isRouteErrorResponse, useRouteError } from "react-router-dom"

export function RouteErrorPage() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? error.statusText || "Error de navegación"
    : error instanceof Error
      ? error.message
      : "Error inesperado"

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <div className="max-w-md rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
        <h1 className="text-lg font-semibold text-rose-900">No se pudo cargar la pantalla</h1>
        <p className="mt-2 text-sm text-rose-800">{message}</p>
        <button
          type="button"
          className="mt-4 text-sm font-medium text-rose-700 underline"
          onClick={() => window.location.reload()}
        >
          Recargar aplicación
        </button>
      </div>
    </div>
  )
}
