import { BRANDING } from "@/config/branding"

const MODULES = [
  "auth",
  "dashboard",
  "masters",
  "purchase-orders",
  "purchase-receipts",
  "nroc-orders",
  "inventory",
  "inventory-movements",
  "inventory-returns",
  "area-requests",
  "scheduling",
  "mixing",
  "extrusion",
  "dispatch",
  "account",
] as const

export function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <p className="text-sm font-medium text-violet-700">{BRANDING.appName}</p>
        <h1 className="text-2xl font-semibold tracking-tight">{BRANDING.siteName}</h1>
        <p className="mt-1 text-sm text-slate-600">
          Frontend en construcción — estructura lista, módulos por implementar.
        </p>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Proyecto levantado</h2>
          <p className="mt-2 text-sm text-slate-600">
            Si ves esta pantalla, Vite y React funcionan. Los cambios en{" "}
            <code className="rounded bg-slate-100 px-1">src/app/HomePage.tsx</code> se
            actualizan en tiempo real.
          </p>
        </section>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Módulos (carpetas features/)</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {MODULES.map((name) => (
              <li
                key={name}
                className="rounded-lg border border-dashed border-slate-200 px-3 py-2 text-sm text-slate-700"
              >
                {name}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  )
}
