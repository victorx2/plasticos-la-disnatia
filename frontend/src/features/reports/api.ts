import { getJson } from "@/shared/api/client"
import type {
  MixtureConsumptionByOrderRow,
  MixtureConsumptionRow,
  ProductionGeneralRow,
  ProductionTimeRow,
  ReportsQuery,
  WasteByOrderRow,
  WasteConsolidatedRow,
} from "@/features/reports/types"

export async function fetchProductionTimes(query: ReportsQuery = {}): Promise<ProductionTimeRow[]> {
  return getJson<ProductionTimeRow[]>("reports/production-times", {
    from_date: query.from_date,
    to_date: query.to_date,
  })
}

export async function fetchMixtureConsumptionTotal(
  query: ReportsQuery = {},
): Promise<MixtureConsumptionRow[]> {
  return getJson<MixtureConsumptionRow[]>("reports/mixture-consumption-total", {
    from_date: query.from_date,
    to_date: query.to_date,
  })
}

export async function fetchMixtureConsumptionByOrder(
  query: ReportsQuery = {},
): Promise<MixtureConsumptionByOrderRow[]> {
  return getJson<MixtureConsumptionByOrderRow[]>("reports/mixture-consumption-by-order", {
    order_id: query.order_id,
  })
}

export async function fetchProductionGeneral(
  query: ReportsQuery = {},
): Promise<ProductionGeneralRow[]> {
  return getJson<ProductionGeneralRow[]>("reports/production-general", {
    from_date: query.from_date,
    to_date: query.to_date,
  })
}

export async function fetchWasteByOrder(query: ReportsQuery = {}): Promise<WasteByOrderRow[]> {
  return getJson<WasteByOrderRow[]>("reports/waste-by-order", {
    from_date: query.from_date,
    to_date: query.to_date,
  })
}

export async function fetchWasteConsolidated(
  query: ReportsQuery = {},
): Promise<WasteConsolidatedRow> {
  return getJson<WasteConsolidatedRow>("reports/waste-consolidated", {
    from_date: query.from_date,
    to_date: query.to_date,
  })
}

export async function fetchProductionByMachine(
  query: ReportsQuery = {},
): Promise<import("@/features/reports/types").ProductionMachineReportRow[]> {
  return getJson("reports/production-by-machine", {
    from_date: query.from_date,
    to_date: query.to_date,
  })
}
