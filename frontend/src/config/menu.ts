import type { LucideIcon } from "lucide-react"
import {
  Activity,
  BadgeCheck,
  BarChart3,
  Boxes,
  ClipboardList,
  Factory,
  FlaskConical,
  Package,
  PackageOpen,
  Recycle,
  Scissors,
  ScrollText,
  ShoppingCart,
  Tags,
  Truck,
  Users,
  Warehouse,
  AlertTriangle,
} from "lucide-react"

import { REPORT_MENU_ITEMS, REPORT_IMPLEMENTED_URLS, reportTitleForPath } from "@/features/reports/routes"

export type MenuNode = {
  title: string
  /** Ruta relativa sin slash inicial, o "#" para grupo. */
  url: string
  icon?: LucideIcon
  /** Clave en MENU_ROLE_ACCESS; por defecto = url. */
  permissionId?: string
  items?: MenuNode[]
}

/**
 * Árbol de menú Axones Acarigua.
 * Se filtra con `filterMenuTree` en config/permissions.ts.
 */
export const ACARIGUA_MENU_TREE: MenuNode[] = [
  {
    title: "Inicio y monitoreo",
    url: "#",
    icon: Activity,
    items: [
      { title: "Resumen", url: "resumen", icon: Activity, permissionId: "resumen" },
      { title: "Alertas", url: "alertas", icon: BadgeCheck, permissionId: "alertas" },
    ],
  },
  {
    title: "Órdenes",
    url: "#",
    icon: ScrollText,
    items: [
      { title: "Clientes", url: "clientes", icon: ClipboardList, permissionId: "clientes" },
      {
        title: "Especificaciones de producto",
        url: "productos",
        icon: Package,
        permissionId: "productos",
      },
      {
        title: "Orden de producción",
        url: "orden-produccion",
        icon: ScrollText,
        permissionId: "orden-produccion",
      },
      {
        title: "Órdenes de compra",
        url: "ordenes-compra",
        icon: ShoppingCart,
        permissionId: "ordenes-compra",
      },
    ],
  },
  {
    title: "Datos maestros",
    url: "#",
    icon: Tags,
    items: [
      { title: "Vendedores", url: "vendedores", icon: Users, permissionId: "vendedores" },
      { title: "Proveedores", url: "proveedores", icon: Truck, permissionId: "proveedores" },
    ],
  },
  {
    title: "Inventario",
    url: "#",
    icon: Warehouse,
    items: [
      { title: "Materiales", url: "materiales", icon: Boxes, permissionId: "materiales" },
      {
        title: "Solicitudes entre áreas",
        url: "solicitudes-area",
        icon: ClipboardList,
        permissionId: "solicitudes-area",
      },
      { title: "Recepción", url: "recepciones", icon: PackageOpen, permissionId: "recepciones" },
      {
        title: "Movimientos",
        url: "movimientos-inventario",
        icon: ScrollText,
        permissionId: "movimientos",
      },
      { title: "Devoluciones", url: "devoluciones", icon: PackageOpen, permissionId: "devoluciones" },
    ],
  },
  {
    title: "Producción",
    url: "#",
    icon: Factory,
    items: [
      { title: "Programación", url: "programacion", icon: ClipboardList, permissionId: "programacion" },
      { title: "Mezcla", url: "mezcla", icon: FlaskConical, permissionId: "mezcla" },
      { title: "Extrusión", url: "extrusion", icon: Factory, permissionId: "extrusion" },
      { title: "Sellado", url: "sellado", icon: Scissors, permissionId: "sellado" },
      {
        title: "Inventario bolsones",
        url: "inventario-bolsones",
        icon: Package,
        permissionId: "inventario-subproductos",
      },
      {
        title: "Inventario desperdicio",
        url: "inventario-desperdicio",
        icon: Recycle,
        permissionId: "inventario-subproductos",
      },
      {
        title: "Inventario fallas",
        url: "inventario-fallas",
        icon: AlertTriangle,
        permissionId: "inventario-subproductos",
      },
    ],
  },
  {
    title: "Reportes",
    url: "#",
    icon: BarChart3,
    items: REPORT_MENU_ITEMS,
  },
  {
    title: "Solicitudes de insumos",
    url: "solicitudes-material",
    icon: Package,
    permissionId: "solicitudes",
  },
  { title: "Despacho", url: "despacho", icon: Truck, permissionId: "despacho" },
]

/** Módulos con pantalla real (no placeholder). */
export const IMPLEMENTED_URLS = new Set([
  "resumen",
  "clientes",
  "clientes/form",
  "productos",
  "productos/form",
  "proveedores",
  "proveedores/form",
  "vendedores",
  "vendedores/form",
  "ordenes-compra",
  "ordenes-compra/nueva",
  "materiales",
  "materiales/form",
  "materiales/importar",
  "recepciones",
  "recepciones/nueva",
  "movimientos-inventario",
  "solicitudes-area",
  "solicitudes-area/insumos",
  "solicitudes-material",
  "solicitudes-material/nueva",
  "devoluciones",
  "devoluciones/nueva",
  "mezcla",
  "mezcla/nueva",
  "mezcla/produccion",
  "extrusion",
  "extrusion/registro",
  "sellado",
  "sellado/registro",
  "inventario-bolsones",
  "inventario-desperdicio",
  "inventario-fallas",
  "programacion",
  "orden-produccion",
  "orden-produccion/nueva",
  "despacho",
  "reportes",
  ...REPORT_IMPLEMENTED_URLS,
  "solicitudes-material/revision",
])

export function flattenMenuLeaves(nodes: MenuNode[]): MenuNode[] {
  const out: MenuNode[] = []
  for (const node of nodes) {
    if (node.items?.length) {
      out.push(...flattenMenuLeaves(node.items))
    } else if (node.url !== "#") {
      out.push(node)
    }
  }
  return out
}

export function menuTitleForPath(pathname: string): string | null {
  if (pathname.startsWith("/clientes/form")) return "Clientes"
  if (pathname.startsWith("/productos/form")) return "Especificaciones de producto"
  if (pathname.startsWith("/proveedores/form")) return "Proveedores"
  if (pathname.startsWith("/vendedores/form")) return "Vendedores"
  if (pathname.startsWith("/ordenes-compra/nueva")) return "Órdenes de compra"
  if (pathname.startsWith("/materiales/importar")) return "Materiales"
  if (pathname.startsWith("/materiales/form")) return "Materiales"
  if (pathname.startsWith("/recepciones/nueva")) return "Recepción"
  if (pathname.startsWith("/solicitudes-area/insumos")) return "Solicitudes entre áreas"
  if (pathname.startsWith("/solicitudes-material/nueva")) return "Solicitudes de insumos"
  if (pathname.startsWith("/devoluciones/nueva")) return "Devoluciones"
  if (pathname.startsWith("/mezcla/nueva")) return "Mezcla"
  if (pathname.startsWith("/extrusion/registro")) return "Registro de extrusión"
  if (pathname.startsWith("/sellado/registro")) return "Registro de sellado"
  if (pathname.startsWith("/orden-produccion/nueva")) return "Orden de producción"
  if (pathname.startsWith("/pedidos-cliente")) return "Orden de producción"
  if (pathname.startsWith("/reportes")) return reportTitleForPath(pathname)
  const segment = pathname.replace(/^\/+/, "").split("/")[0] ?? ""
  if (!segment) return null
  const leaf = flattenMenuLeaves(ACARIGUA_MENU_TREE).find((n) => n.url === segment)
  return leaf?.title ?? null
}
