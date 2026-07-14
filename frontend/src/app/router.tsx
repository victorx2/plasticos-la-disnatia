import type { ReactNode } from "react"
import { lazy, Suspense } from "react"
import { createBrowserRouter, Navigate } from "react-router-dom"

import { AppLayout } from "@/app/AppLayout"
import { AuthLayout } from "@/app/AuthLayout"
import { ModulePlaceholderPage } from "@/app/ModulePlaceholderPage"
import { PageLoading } from "@/app/PageLoading"
import { RequirePermission } from "@/app/RequirePermission"
import { RouteErrorPage } from "@/app/RouteErrorPage"
import { ACARIGUA_MENU_TREE, flattenMenuLeaves } from "@/config/menu"
import { SummaryPage } from "@/features/dashboard/pages/SummaryPage"
import { AlertsListPage } from "@/features/alerts/pages/AlertsListPage"
import { ClientFormPage } from "@/features/masters/clients/pages/ClientFormPage"
import { ClientsListPage } from "@/features/masters/clients/pages/ClientsListPage"
import { ProductFormPage } from "@/features/masters/products/pages/ProductFormPage"
import { ProductsListPage } from "@/features/masters/products/pages/ProductsListPage"
import { SupplierFormPage } from "@/features/masters/suppliers/pages/SupplierFormPage"
import { SuppliersListPage } from "@/features/masters/suppliers/pages/SuppliersListPage"
import { VendorFormPage } from "@/features/masters/vendors/pages/VendorFormPage"
import { VendorsListPage } from "@/features/masters/vendors/pages/VendorsListPage"
import { NrocOrderFormPage } from "@/features/nroc-orders/pages/NrocOrderFormPage"
import { ProgramacionBoardPage } from "@/features/programacion/pages/ProgramacionBoardPage"
import { InventoryReturnFormPage } from "@/features/inventory-returns/pages/InventoryReturnFormPage"
import { InventoryReturnsListPage } from "@/features/inventory-returns/pages/InventoryReturnsListPage"
import { ExtrusionPage } from "@/features/production/extrusion/pages/ExtrusionPage"
import { ExtrusionRegisterPage } from "@/features/production/extrusion/pages/ExtrusionRegisterPage"
import { SealingPage } from "@/features/production/sealing/pages/SealingPage"
import { SealingRegisterPage } from "@/features/production/sealing/pages/SealingRegisterPage"
import { MixingFormPage } from "@/features/tinta-mixtures/pages/MixingFormPage"
import { MixingListPage } from "@/features/tinta-mixtures/pages/MixingListPage"
import { MixtureProductionPage } from "@/features/tinta-mixtures/pages/MixtureProductionPage"
import { DispatchPage } from "@/features/dispatch/pages/DispatchPage"
import { BolsonesInventoryPage } from "@/features/production-subproducts/pages/BolsonesInventoryPage"
import { DesperdicioInventoryPage } from "@/features/production-subproducts/pages/DesperdicioInventoryPage"
import { FallasInventoryPage } from "@/features/production-subproducts/pages/FallasInventoryPage"
import { ReportsHubPage } from "@/features/reports/pages/ReportsHubPage"
import { REPORT_IMPLEMENTED_URLS } from "@/features/reports/routes"
import { AreaRequestInsumosPage } from "@/features/area-requests/pages/AreaRequestInsumosPage"
import { AreaRequestsListPage } from "@/features/area-requests/pages/AreaRequestsListPage"
import { InventoryMovementsListPage } from "@/features/inventory-movements/pages/InventoryMovementsListPage"
import { MaterialRequestFormPage } from "@/features/material-requests/pages/MaterialRequestFormPage"
import { MaterialRequestReviewPage } from "@/features/material-requests/pages/MaterialRequestReviewPage"
import { MaterialFormPage } from "@/features/materials/pages/MaterialFormPage"
import { MaterialImportPage } from "@/features/materials/pages/MaterialImportPage"
import { MaterialsListPage } from "@/features/materials/pages/MaterialsListPage"
import { PurchaseReceiptFormPage } from "@/features/purchase-receipts/pages/PurchaseReceiptFormPage"
import { PurchaseReceiptsListPage } from "@/features/purchase-receipts/pages/PurchaseReceiptsListPage"
import { PurchaseOrderFormPage } from "@/features/purchase-orders/pages/PurchaseOrderFormPage"
import { PurchaseOrdersListPage } from "@/features/purchase-orders/pages/PurchaseOrdersListPage"
import { LoginPage } from "@/features/auth/pages/LoginPage"
import { RequestPasswordResetPage } from "@/features/auth/pages/RequestPasswordResetPage"
import { isDemoAutoLoginEnabled } from "@/shared/auth/demoAutoLogin"
import { isAuthenticated } from "@/shared/auth/session"

const NrocOrdersListPage = lazy(() =>
  import("@/features/nroc-orders/pages/NrocOrdersListPage").then((module) => ({
    default: module.NrocOrdersListPage,
  })),
)

function RootRedirect() {
  return (
    <Navigate
      to={isAuthenticated() || isDemoAutoLoginEnabled() ? "/resumen" : "/auth/basic/login"}
      replace
    />
  )
}

function withPermission(element: ReactNode, permissionId?: string) {
  return <RequirePermission permissionId={permissionId}>{element}</RequirePermission>
}

function withLazyPage(
  Page: React.LazyExoticComponent<() => ReactNode>,
  permissionId?: string,
) {
  return withPermission(
    <Suspense fallback={<PageLoading />}>
      <Page />
    </Suspense>,
    permissionId,
  )
}

const IMPLEMENTED = new Set([
  "resumen",
  "alertas",
  "clientes",
  "productos",
  "proveedores",
  "vendedores",
  "ordenes-compra",
  "materiales",
  "recepciones",
  "movimientos-inventario",
  "solicitudes-area",
  "solicitudes-material",
  "solicitudes-material/revision",
  "devoluciones",
  "mezcla",
  "mezcla/nueva",
  "mezcla/produccion",
  "extrusion",
  "extrusion/registro",
  "sellado",
  "sellado/registro",
  "programacion",
  "orden-produccion",
  "despacho",
  "inventario-bolsones",
  "inventario-desperdicio",
  "inventario-fallas",
  "reportes",
  ...REPORT_IMPLEMENTED_URLS,
])

const placeholderRoutes = flattenMenuLeaves(ACARIGUA_MENU_TREE)
  .filter((item) => !IMPLEMENTED.has(item.url))
  .map((item) => ({
    path: item.url,
    element: withPermission(<ModulePlaceholderPage />, item.permissionId ?? item.url),
  }))

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootRedirect />,
  },
  {
    element: <AuthLayout />,
    children: [
      { path: "auth/basic/login", element: <LoginPage /> },
      {
        path: "auth/basic/request-reset",
        element: <RequestPasswordResetPage />,
      },
    ],
  },
  {
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { path: "resumen", element: withPermission(<SummaryPage />, "resumen") },
      { path: "alertas", element: withPermission(<AlertsListPage />, "alertas") },
      { path: "clientes", element: withPermission(<ClientsListPage />, "clientes") },
      {
        path: "clientes/form",
        element: withPermission(<ClientFormPage />, "clientes"),
      },
      { path: "productos", element: withPermission(<ProductsListPage />, "productos") },
      {
        path: "productos/form",
        element: withPermission(<ProductFormPage />, "productos"),
      },
      { path: "proveedores", element: withPermission(<SuppliersListPage />, "proveedores") },
      {
        path: "proveedores/form",
        element: withPermission(<SupplierFormPage />, "proveedores"),
      },
      { path: "vendedores", element: withPermission(<VendorsListPage />, "vendedores") },
      {
        path: "vendedores/form",
        element: withPermission(<VendorFormPage />, "vendedores"),
      },
      {
        path: "ordenes-compra",
        element: withPermission(<PurchaseOrdersListPage />, "ordenes-compra"),
      },
      {
        path: "ordenes-compra/nueva",
        element: withPermission(<PurchaseOrderFormPage />, "ordenes-compra"),
      },
      { path: "materiales", element: withPermission(<MaterialsListPage />, "materiales") },
      {
        path: "materiales/form",
        element: withPermission(<MaterialFormPage />, "materiales"),
      },
      {
        path: "materiales/importar",
        element: withPermission(<MaterialImportPage />, "materiales"),
      },
      { path: "recepciones", element: withPermission(<PurchaseReceiptsListPage />, "recepciones") },
      {
        path: "recepciones/nueva",
        element: withPermission(<PurchaseReceiptFormPage />, "recepciones"),
      },
      {
        path: "movimientos-inventario",
        element: withPermission(<InventoryMovementsListPage />, "movimientos"),
      },
      {
        path: "solicitudes-area",
        element: withPermission(<AreaRequestsListPage />, "solicitudes-area"),
      },
      {
        path: "solicitudes-area/insumos/:id",
        element: withPermission(<AreaRequestInsumosPage />, "solicitudes-area"),
      },
      {
        path: "solicitudes-material",
        element: withPermission(
          <Navigate to="/solicitudes-material/nueva" replace />,
          "solicitudes",
        ),
      },
      {
        path: "solicitudes-material/nueva",
        element: withPermission(<MaterialRequestFormPage />, "solicitudes"),
      },
      {
        path: "solicitudes-material/revision/:id",
        element: withPermission(<MaterialRequestReviewPage />, "solicitudes"),
      },
      { path: "devoluciones", element: withPermission(<InventoryReturnsListPage />, "devoluciones") },
      {
        path: "devoluciones/nueva",
        element: withPermission(<InventoryReturnFormPage />, "devoluciones"),
      },
      { path: "mezcla", element: withPermission(<MixingListPage />, "mezcla") },
      {
        path: "mezcla/nueva",
        element: withPermission(<MixingFormPage />, "mezcla"),
      },
      {
        path: "mezcla/produccion",
        element: withPermission(<MixtureProductionPage />, "mezcla"),
      },
      { path: "extrusion", element: withPermission(<ExtrusionPage />, "extrusion") },
      {
        path: "extrusion/registro",
        element: withPermission(<ExtrusionRegisterPage />, "extrusion"),
      },
      { path: "sellado", element: withPermission(<SealingPage />, "sellado") },
      {
        path: "sellado/registro",
        element: withPermission(<SealingRegisterPage />, "sellado"),
      },
      {
        path: "programacion",
        element: withPermission(<ProgramacionBoardPage />, "programacion"),
      },
      {
        path: "orden-produccion",
        element: withLazyPage(NrocOrdersListPage, "orden-produccion"),
      },
      {
        path: "orden-produccion/nueva",
        element: withPermission(<NrocOrderFormPage />, "orden-produccion"),
      },
      { path: "despacho", element: withPermission(<DispatchPage />, "despacho") },
      {
        path: "inventario-bolsones",
        element: withPermission(<BolsonesInventoryPage />, "inventario-subproductos"),
      },
      {
        path: "inventario-desperdicio",
        element: withPermission(<DesperdicioInventoryPage />, "inventario-subproductos"),
      },
      {
        path: "inventario-fallas",
        element: withPermission(<FallasInventoryPage />, "inventario-subproductos"),
      },
      {
        path: "inventario-subproductos",
        element: <Navigate to="/inventario-bolsones" replace />,
      },
      {
        path: "reportes",
        element: withPermission(<Navigate to="/reportes/tiempos" replace />, "reportes"),
      },
      {
        path: "reportes/:reportTab",
        element: withPermission(<ReportsHubPage />, "reportes"),
      },
      {
        path: "pedidos-cliente",
        element: <Navigate to="/orden-produccion" replace />,
      },
      {
        path: "pedidos-cliente/nueva",
        element: <Navigate to="/orden-produccion/nueva" replace />,
      },
      ...placeholderRoutes,
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
])
