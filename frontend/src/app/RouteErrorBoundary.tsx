import { Component, type ErrorInfo, type ReactNode } from "react"

type RouteErrorBoundaryProps = {
  children: ReactNode
  title?: string
}

type RouteErrorBoundaryState = {
  error: Error | null
}

export class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6">
          <h2 className="font-semibold text-rose-900">
            {this.props.title ?? "Error al cargar la página"}
          </h2>
          <p className="mt-2 text-sm text-rose-800">{this.state.error.message}</p>
          <button
            type="button"
            className="mt-4 text-sm font-medium text-rose-700 underline"
            onClick={() => window.location.reload()}
          >
            Recargar
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
