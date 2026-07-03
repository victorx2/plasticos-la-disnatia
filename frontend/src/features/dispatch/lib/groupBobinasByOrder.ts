import type { BobinaAvailable } from "@/features/dispatch/types"
import { parseKgNumber } from "@/shared/format/numbers"

export type BobinaOrderGroup = {
  key: string
  work_order_id: number | null
  client_order_code: string | null
  work_order_code: string | null
  client_name: string | null
  bobinas: BobinaAvailable[]
  coil_count: number
  total_kg: number
}

function groupKey(bobina: BobinaAvailable): string {
  if (bobina.work_order_id != null && bobina.work_order_id > 0) {
    return `wo-${bobina.work_order_id}`
  }
  if (bobina.client_order_code?.trim()) {
    return `op-${bobina.client_order_code.trim()}`
  }
  return `coil-${bobina.id}`
}

export function groupBobinasByOrder(bobinas: BobinaAvailable[]): BobinaOrderGroup[] {
  const map = new Map<string, BobinaOrderGroup>()

  for (const bobina of bobinas) {
    const key = groupKey(bobina)
    const existing = map.get(key)
    if (existing) {
      existing.bobinas.push(bobina)
      existing.coil_count += 1
      existing.total_kg += parseKgNumber(bobina.kg)
      continue
    }
    map.set(key, {
      key,
      work_order_id: bobina.work_order_id ?? null,
      client_order_code: bobina.client_order_code ?? null,
      work_order_code: bobina.work_order_code ?? bobina.tp_code ?? null,
      client_name: bobina.client_name ?? null,
      bobinas: [bobina],
      coil_count: 1,
      total_kg: parseKgNumber(bobina.kg),
    })
  }

  return [...map.values()].sort((a, b) => {
    const opA = a.client_order_code ?? ""
    const opB = b.client_order_code ?? ""
    if (opA !== opB) return opA.localeCompare(opB, "es", { numeric: true })
    return (a.work_order_code ?? "").localeCompare(b.work_order_code ?? "", "es", { numeric: true })
  })
}

export function bobinasInventoryTotals(bobinas: BobinaAvailable[]) {
  const groups = groupBobinasByOrder(bobinas)
  const totalKg = bobinas.reduce((sum, b) => sum + parseKgNumber(b.kg), 0)
  return {
    order_count: groups.length,
    coil_count: bobinas.length,
    total_kg: totalKg,
    groups,
  }
}
