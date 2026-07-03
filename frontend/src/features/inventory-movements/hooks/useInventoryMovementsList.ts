import { useCallback, useEffect, useState } from "react"

import { LIST_AREA_TABS } from "@/features/materials/areas"
import { fetchInventoryMovements } from "@/features/inventory-movements/api"
import {
  defaultFromDate,
  todayDate,
} from "@/features/inventory-movements/enums"
import { INVENTORY_MOVEMENT_LABELS } from "@/features/inventory-movements/labels"
import { usePaginatedList } from "@/shared/hooks/usePaginatedList"

export function useInventoryMovementsList() {
  const [fromDate, setFromDate] = useState(defaultFromDate)
  const [toDate, setToDate] = useState(todayDate)
  const [movementType, setMovementType] = useState("")
  const [inventoryArea, setInventoryArea] = useState("")
  const [referenceType, setReferenceType] = useState("")

  const fetchPage = useCallback(
    (query: { q?: string; page?: number; per_page?: number }) =>
      fetchInventoryMovements({
        ...query,
        from: fromDate || undefined,
        to: toDate || undefined,
        movement_type: movementType || undefined,
        inventory_area: inventoryArea || undefined,
        reference_type: referenceType || undefined,
      }),
    [fromDate, toDate, movementType, inventoryArea, referenceType],
  )

  const { setPage, ...list } = usePaginatedList({
    fetchPage,
    loadErrorMessage: INVENTORY_MOVEMENT_LABELS.loadError,
    defaultPerPage: 50,
  })

  useEffect(() => {
    setPage(1)
  }, [fromDate, toDate, movementType, inventoryArea, referenceType, setPage])

  const areaOptions = [
    { id: "", label: "Todas" },
    ...LIST_AREA_TABS.filter((t) => t.id !== "all").map((t) => ({
      id: t.id,
      label: t.label,
    })),
  ]

  return {
    ...list,
    setPage,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    movementType,
    setMovementType,
    inventoryArea,
    setInventoryArea,
    referenceType,
    setReferenceType,
    areaOptions,
    hasActiveFilters:
      list.hasActiveFilters ||
      movementType !== "" ||
      inventoryArea !== "" ||
      referenceType !== "" ||
      fromDate !== defaultFromDate() ||
      toDate !== todayDate(),
  }
}
