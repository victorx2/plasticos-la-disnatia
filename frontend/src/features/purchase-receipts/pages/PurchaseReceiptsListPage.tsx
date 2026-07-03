import { Link } from "react-router-dom"
import { Eye, PackageOpen, PackagePlus, ShoppingCart } from "lucide-react"

import { purchaseOrderStatusLabel } from "@/features/purchase-orders/status"
import { PURCHASE_RECEIPT_LABELS } from "@/features/purchase-receipts/labels"
import { usePurchaseReceiptsList } from "@/features/purchase-receipts/hooks/usePurchaseReceiptsList"
import { catalogRowNumber } from "@/shared/catalog/classes"
import { CatalogEmptyState } from "@/shared/catalog/CatalogEmptyState"
import { CatalogListPagination } from "@/shared/catalog/CatalogListPagination"
import { CatalogSearchPanel } from "@/shared/catalog/CatalogSearchPanel"
import {
  CatalogEmptyRows,
  CatalogLoadingRows,
  CatalogTableBody,
  CatalogTableCell,
  CatalogTableHead,
  CatalogTableHeader,
  CatalogTableHeadRow,
  CatalogTablePanel,
  CatalogTableRow,
} from "@/shared/catalog/CatalogTable"
import { CatalogViewTabs } from "@/shared/catalog/CatalogViewTabs"
import { PageShell } from "@/shared/catalog/PageShell"
import { formatDateDMY } from "@/shared/format/dates"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import type { PurchaseReceiptViewTab } from "@/features/purchase-receipts/types"

function materialSummary(
  lines: Array<{ material?: { sku?: string; name?: string } | null }> | undefined,
): string {
  if (!lines?.length) return "—"
  const first = lines[0]?.material
  const label = first ? `${first.sku ?? ""} ${first.name ?? ""}`.trim() : "—"
  if (lines.length === 1) return label
  return `${label} (+${lines.length - 1})`
}

export function PurchaseReceiptsListPage() {
  const {
    query,
    setQuery,
    setPage,
    perPage,
    setPerPage,
    applySearchNow,
    hasActiveFilters,
    viewTab,
    setViewTab,
    supplierFilter,
    setSupplierFilter,
    invoiceFilter,
    setInvoiceFilter,
    fromFilter,
    setFromFilter,
    toFilter,
    setToFilter,
    historyRows,
    pendingRows,
    historyLoading,
    pendingLoading,
  } = usePurchaseReceiptsList()

  const isPendingTab = viewTab === "pending"
  const rows = isPendingTab ? pendingRows : historyRows
  const loading = isPendingTab ? pendingLoading : historyLoading
  const showInitialSkeleton = loading && rows === null

  const newReceiptButton = (
    <Button type="button" asChild>
      <Link to="/recepciones/nueva">
        <PackagePlus className="h-4 w-4" aria-hidden />
        {PURCHASE_RECEIPT_LABELS.newReceipt}
      </Link>
    </Button>
  )

  const total = rows?.total ?? 0

  const empty = hasActiveFilters
    ? {
        title: PURCHASE_RECEIPT_LABELS.emptyFiltered,
        description: PURCHASE_RECEIPT_LABELS.emptyFilteredDescription,
      }
    : isPendingTab
      ? {
          title: PURCHASE_RECEIPT_LABELS.emptyPendingTitle,
          description: PURCHASE_RECEIPT_LABELS.emptyPendingDescription,
        }
      : {
          title: PURCHASE_RECEIPT_LABELS.emptyHistoryTitle,
          description: PURCHASE_RECEIPT_LABELS.emptyHistoryDescription,
        }

  return (
    <PageShell
      title={PURCHASE_RECEIPT_LABELS.listTitle}
      subtitle={PURCHASE_RECEIPT_LABELS.listSubtitle}
      icon={PackageOpen}
      action={newReceiptButton}
    >
      <div className="space-y-4">
        <CatalogViewTabs
          tabs={[
            { id: "pending", label: PURCHASE_RECEIPT_LABELS.tabs.pending },
            { id: "history", label: PURCHASE_RECEIPT_LABELS.tabs.history },
          ]}
          value={viewTab}
          onChange={(id) => setViewTab(id as PurchaseReceiptViewTab)}
        />

        <CatalogSearchPanel
          id="receipt-search"
          label={PURCHASE_RECEIPT_LABELS.searchLabel}
          placeholder={PURCHASE_RECEIPT_LABELS.searchPlaceholder}
          value={query}
          onChange={setQuery}
          onSubmit={applySearchNow}
          countLabel={rows && !loading ? PURCHASE_RECEIPT_LABELS.count(total) : null}
          footer={
            !isPendingTab ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <Label htmlFor="rec-filter-supplier">{PURCHASE_RECEIPT_LABELS.filters.supplier}</Label>
                  <Input
                    id="rec-filter-supplier"
                    className="mt-2"
                    value={supplierFilter}
                    onChange={(e) => setSupplierFilter(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="rec-filter-invoice">{PURCHASE_RECEIPT_LABELS.filters.invoice}</Label>
                  <Input
                    id="rec-filter-invoice"
                    className="mt-2"
                    value={invoiceFilter}
                    onChange={(e) => setInvoiceFilter(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="rec-filter-from">{PURCHASE_RECEIPT_LABELS.filters.from}</Label>
                  <Input
                    id="rec-filter-from"
                    type="date"
                    className="mt-2"
                    value={fromFilter}
                    onChange={(e) => setFromFilter(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="rec-filter-to">{PURCHASE_RECEIPT_LABELS.filters.to}</Label>
                  <Input
                    id="rec-filter-to"
                    type="date"
                    className="mt-2"
                    value={toFilter}
                    onChange={(e) => setToFilter(e.target.value)}
                  />
                </div>
              </div>
            ) : null
          }
        />

        {isPendingTab ? (
          <CatalogTablePanel minWidth="900px">
            <CatalogTableHeader>
              <CatalogTableHeadRow>
                <CatalogTableHead className="w-16">{PURCHASE_RECEIPT_LABELS.table.number}</CatalogTableHead>
                <CatalogTableHead>Código OC</CatalogTableHead>
                <CatalogTableHead>{PURCHASE_RECEIPT_LABELS.fields.supplier}</CatalogTableHead>
                <CatalogTableHead>Estado</CatalogTableHead>
                <CatalogTableHead>{PURCHASE_RECEIPT_LABELS.fields.lines}</CatalogTableHead>
                <CatalogTableHead>Fecha pedido</CatalogTableHead>
                <CatalogTableHead align="right">{PURCHASE_RECEIPT_LABELS.table.actions}</CatalogTableHead>
              </CatalogTableHeadRow>
            </CatalogTableHeader>
            <CatalogTableBody>
              {showInitialSkeleton ? (
                <CatalogLoadingRows colSpan={7} />
              ) : !rows?.data.length ? (
                <CatalogEmptyRows colSpan={7}>
                  <CatalogEmptyState
                    compact
                    icon={ShoppingCart}
                    title={empty.title}
                    description={empty.description}
                  />
                </CatalogEmptyRows>
              ) : (
                pendingRows!.data.map((order, index) => {
                  const n = catalogRowNumber(pendingRows!.current_page, pendingRows!.per_page, index)
                  return (
                    <CatalogTableRow key={order.id}>
                      <CatalogTableCell className="tabular-nums text-slate-500">{n}</CatalogTableCell>
                      <CatalogTableCell className="font-mono text-xs font-medium">
                        {order.code}
                      </CatalogTableCell>
                      <CatalogTableCell>
                        {order.supplier?.name ?? `Proveedor #${order.supplier_id}`}
                      </CatalogTableCell>
                      <CatalogTableCell>
                        <span className="inline-flex rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                          {purchaseOrderStatusLabel(order.status)}
                        </span>
                      </CatalogTableCell>
                      <CatalogTableCell className="tabular-nums">
                        {order.lines_count ?? "—"}
                      </CatalogTableCell>
                      <CatalogTableCell className="whitespace-nowrap">
                        {formatDateDMY(order.ordered_at ?? order.created_at)}
                      </CatalogTableCell>
                      <CatalogTableCell className="text-right">
                        <Button type="button" variant="default" size="sm" asChild>
                          <Link to={`/recepciones/nueva?oc=${order.id}`}>
                            <PackagePlus className="h-3.5 w-3.5" aria-hidden />
                            {PURCHASE_RECEIPT_LABELS.receive}
                          </Link>
                        </Button>
                      </CatalogTableCell>
                    </CatalogTableRow>
                  )
                })
              )}
            </CatalogTableBody>
          </CatalogTablePanel>
        ) : (
          <CatalogTablePanel minWidth="980px">
            <CatalogTableHeader>
              <CatalogTableHeadRow>
                <CatalogTableHead className="w-16">{PURCHASE_RECEIPT_LABELS.table.number}</CatalogTableHead>
                <CatalogTableHead>{PURCHASE_RECEIPT_LABELS.fields.receiptCode}</CatalogTableHead>
                <CatalogTableHead>{PURCHASE_RECEIPT_LABELS.fields.supplier}</CatalogTableHead>
                <CatalogTableHead>Material</CatalogTableHead>
                <CatalogTableHead>{PURCHASE_RECEIPT_LABELS.fields.invoice}</CatalogTableHead>
                <CatalogTableHead>{PURCHASE_RECEIPT_LABELS.fields.purchaseOrder}</CatalogTableHead>
                <CatalogTableHead>{PURCHASE_RECEIPT_LABELS.fields.receivedAt}</CatalogTableHead>
                <CatalogTableHead align="right">{PURCHASE_RECEIPT_LABELS.table.actions}</CatalogTableHead>
              </CatalogTableHeadRow>
            </CatalogTableHeader>
            <CatalogTableBody>
              {showInitialSkeleton ? (
                <CatalogLoadingRows colSpan={8} />
              ) : !rows?.data.length ? (
                <CatalogEmptyRows colSpan={8}>
                  <CatalogEmptyState
                    compact
                    icon={PackageOpen}
                    title={empty.title}
                    description={empty.description}
                    action={hasActiveFilters ? undefined : newReceiptButton}
                  />
                </CatalogEmptyRows>
              ) : (
                historyRows!.data.map((receipt, index) => {
                  const n = catalogRowNumber(historyRows!.current_page, historyRows!.per_page, index)
                  const supplierName =
                    receipt.supplier?.name?.trim() ||
                    receipt.supplier_name?.trim() ||
                    `Proveedor #${receipt.supplier_id}`

                  return (
                    <CatalogTableRow key={receipt.id}>
                      <CatalogTableCell className="tabular-nums text-slate-500">{n}</CatalogTableCell>
                      <CatalogTableCell className="font-mono text-xs font-medium text-slate-900">
                        {PURCHASE_RECEIPT_LABELS.receiptCode(receipt.id)}
                      </CatalogTableCell>
                      <CatalogTableCell>{supplierName}</CatalogTableCell>
                      <CatalogTableCell className="max-w-[12rem] truncate text-xs">
                        {materialSummary(receipt.lines)}
                      </CatalogTableCell>
                      <CatalogTableCell>{receipt.invoice_number ?? "—"}</CatalogTableCell>
                      <CatalogTableCell className="font-mono text-xs">
                        {receipt.purchase_order_reference ?? receipt.purchase_order?.code ?? "—"}
                      </CatalogTableCell>
                      <CatalogTableCell className="whitespace-nowrap">
                        {formatDateDMY(receipt.received_at)}
                      </CatalogTableCell>
                      <CatalogTableCell className="text-right">
                        {receipt.purchase_order_id ? (
                          <Button type="button" variant="outline" size="sm" asChild>
                            <Link to={`/ordenes-compra/nueva?id=${receipt.purchase_order_id}`}>
                              <Eye className="h-3.5 w-3.5" aria-hidden />
                              {PURCHASE_RECEIPT_LABELS.table.view}
                            </Link>
                          </Button>
                        ) : (
                          "—"
                        )}
                      </CatalogTableCell>
                    </CatalogTableRow>
                  )
                })
              )}
            </CatalogTableBody>
          </CatalogTablePanel>
        )}

        <CatalogListPagination
          rows={rows}
          loading={loading}
          perPage={perPage}
          onPerPageChange={setPerPage}
          onPageChange={setPage}
          selectId="purchase-receipts-per-page"
        />
      </div>
    </PageShell>
  )
}
