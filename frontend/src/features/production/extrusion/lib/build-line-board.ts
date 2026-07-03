import { extrusionShiftLabel } from "@/features/production/extrusion/labels"
import {
  EXTRUSION_MACHINE_LINES,
  type ExtrusionDailySummary,
} from "@/features/production/extrusion/types"
import { parseKgNumber } from "@/shared/format/numbers"

export type ExtrusionLineBoardRow = {
  line: string
  shifts: string
  totalKg: number
  coilsCount: number
  wasteKg: number
  coreKg: number
  runsCount: number
}

export function buildExtrusionLineBoard(summary: ExtrusionDailySummary[]): ExtrusionLineBoardRow[] {
  const byLine = new Map<
    string,
    {
      shifts: Set<string>
      totalKg: number
      coilsCount: number
      wasteKg: number
      coreKg: number
      runsCount: number
    }
  >()

  for (const row of summary) {
    const line = row.machine?.trim()
    if (!line) continue
    const existing = byLine.get(line) ?? {
      shifts: new Set<string>(),
      totalKg: 0,
      coilsCount: 0,
      wasteKg: 0,
      coreKg: 0,
      runsCount: 0,
    }
    if (row.shift) existing.shifts.add(row.shift)
    existing.totalKg += parseKgNumber(row.total_kg)
    existing.coilsCount += row.coils_count ?? 0
    existing.wasteKg += parseKgNumber(row.total_waste_kg ?? "0")
    existing.coreKg += parseKgNumber(row.total_core_kg ?? "0")
    existing.runsCount += row.runs_count ?? 0
    byLine.set(line, existing)
  }

  return EXTRUSION_MACHINE_LINES.map((line) => {
    const data = byLine.get(line)
    if (!data) {
      return {
        line,
        shifts: "—",
        totalKg: 0,
        coilsCount: 0,
        wasteKg: 0,
        coreKg: 0,
        runsCount: 0,
      }
    }
    const shifts = [...data.shifts].map(extrusionShiftLabel).join(", ") || "—"
    return {
      line,
      shifts,
      totalKg: data.totalKg,
      coilsCount: data.coilsCount,
      wasteKg: data.wasteKg,
      coreKg: data.coreKg,
      runsCount: data.runsCount,
    }
  })
}
