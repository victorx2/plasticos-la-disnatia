import type { PrincipalBalance } from "@/features/tinta-mixtures/api"
import { MATERIAL_REQUEST_LABELS } from "@/features/material-requests/labels"
import { formatKgDisplay, parseKgNumber } from "@/shared/format/numbers"

type PrincipalBalanceBreakdownProps = {
  balance: PrincipalBalance
}

export function PrincipalBalanceBreakdown({ balance }: PrincipalBalanceBreakdownProps) {
  const rows = (balance.components ?? []).filter((c) => parseKgNumber(c.quantity) > 0)
  if (!rows.length) return null

  return (
    <div className="mt-3 rounded-lg border border-violet-200/80 bg-white/80 p-3">
      <p className="text-xs font-medium text-violet-900">
        {MATERIAL_REQUEST_LABELS.principalByMaterialTitle}
      </p>
      <p className="mt-1 text-xs text-violet-800">{MATERIAL_REQUEST_LABELS.principalByMaterialHint}</p>
      <ul className="mt-2 space-y-1.5">
        {rows.map((row) => {
          const name = row.material
            ? `${row.material.sku} · ${row.material.name}`
            : `Material #${row.material_id}`
          return (
            <li
              key={row.material_id}
              className="flex items-center justify-between gap-2 text-xs text-slate-700"
            >
              <span className="truncate">{name}</span>
              <span className="shrink-0 font-semibold tabular-nums text-violet-900">
                {formatKgDisplay(row.quantity)}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
