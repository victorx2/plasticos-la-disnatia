import { getJson, patchJson, postJson } from "@/shared/api/client"
import type {
  ApiProductionOrderRow,
  ApiProgramacionBoardResponse,
  CreateProductionOrderInput,
  ProductionOrderRow,
  ProgramacionBoard,
  UpdateProductionOrderStageInput,
} from "@/features/programacion/types"

function mapProductionOrderRowFromApi(raw: ApiProductionOrderRow): ProductionOrderRow {
  const { client_order, ...rest } = raw
  return {
    ...rest,
    production_order: client_order,
  }
}

function mapProgramacionBoardFromApi(raw: ApiProgramacionBoardResponse): ProgramacionBoard {
  const columns: Record<string, ProductionOrderRow[]> = {}
  for (const [stage, rows] of Object.entries(raw.columns)) {
    columns[stage] = rows.map(mapProductionOrderRowFromApi)
  }
  return {
    columns,
    pending_lines: raw.pending_lines ?? [],
  }
}

export async function fetchProgramacionBoard(): Promise<ProgramacionBoard> {
  const raw = await getJson<ApiProgramacionBoardResponse>("work-orders/programacion-board")
  return mapProgramacionBoardFromApi(raw)
}

export async function updateProductionOrderStage(
  id: number,
  input: UpdateProductionOrderStageInput,
): Promise<ProductionOrderRow> {
  const raw = await patchJson<ApiProductionOrderRow>(`work-orders/${id}`, input)
  return mapProductionOrderRowFromApi(raw)
}

export async function scheduleProductionOrder(
  input: CreateProductionOrderInput,
): Promise<ProductionOrderRow> {
  const raw = await postJson<ApiProductionOrderRow>("work-orders", {
    client_order_id: input.production_order_id,
    client_order_line_id: input.client_order_line_id,
    import_client_order_lines: input.import_production_lines ?? true,
    auto_create_material_request: input.auto_create_material_request ?? false,
    board_stage: input.board_stage ?? "nueva",
  })
  return mapProductionOrderRowFromApi(raw)
}

/** @deprecated Use scheduleProductionOrder */
export const createProductionOrderFromNroc = scheduleProductionOrder
