import type { MenuNode } from "@/config/menu"

/** Roles canónicos de Axones Acarigua. */
export type AppRole = "administrador" | "inventario" | "produccion" | "despacho" | "ordenes"

const ADMIN_ALIASES = new Set([
  "administrador",
  "admin",
  "boss",
  "jefe_supremo",
  "superadmin",
  "jefe_operaciones",
])

const INVENTORY_ALIASES = new Set([
  "inventario",
  "inventory",
  "inventory_chief",
  "jefe_inventario",
  "jefe_almacen",
])

const PRODUCTION_ALIASES = new Set([
  "produccion",
  "production",
  "printing",
  "impresion",
  "laminacion",
  "corte",
  "montaje",
  "tintas",
  "planificador",
  "supervisor",
  "quality",
  "calidad",
])

const ORDER_ALIASES = new Set([
  "ordenes",
])

const DISPATCH_ALIASES = new Set([
  "despacho",
  "dispatch",
  "admin_area",
  "administracion",
  "gate",
  "vigilancia",
])

export function normalizeApiRole(role?: string | null): string {
  return (role ?? "").toLowerCase().trim()
}

export function resolveAppRole(role?: string | null): AppRole {
  const r = normalizeApiRole(role)
  if (ADMIN_ALIASES.has(r)) return "administrador"
  if (INVENTORY_ALIASES.has(r)) return "inventario"
  if (ORDER_ALIASES.has(r)) return "ordenes"
  if (PRODUCTION_ALIASES.has(r)) return "produccion"
  if (DISPATCH_ALIASES.has(r)) return "despacho"
  return "despacho"
}

export function getSessionAppRole(user?: { username?: string | null; role?: string | null } | null): AppRole {
  if (user?.username?.toLowerCase().trim() === "ordenes") {
    return "ordenes"
  }
  return resolveAppRole(user?.role)
}

export const MENU_ROLE_ACCESS: Record<string, readonly AppRole[]> = {
  resumen: ["administrador", "inventario", "produccion", "despacho", "ordenes"],
  alertas: ["administrador", "inventario", "produccion", "despacho", "ordenes"],

  // 🌟 SECCIÓN DATOS MAESTROS (Removido "inventario" de estos 4)
  
  clientes: ["administrador", "ordenes"],
  productos: ["administrador", "ordenes"],
  proveedores: ["administrador"],
  vendedores: ["administrador"],"ordenes-compra": ["administrador"],

  // 🌟 SECCIÓN INVENTARIO (Aquí SÍ se queda "inventario")

  materiales: ["administrador", "inventario"],
  recepciones: ["administrador", "inventario"],
  movimientos: ["administrador", "inventario"],
  devoluciones: ["administrador", "inventario"],
  "solicitudes-area": ["administrador", "inventario", "produccion"],
  solicitudes: ["administrador", "inventario", "produccion"],
  "orden-produccion": ["administrador", "ordenes"],
  programacion: ["administrador", "produccion"],
  mezcla: ["administrador", "produccion"],
  extrusion: ["administrador", "produccion"],
  sellado: ["administrador", "produccion"],
  "inventario-subproductos": ["administrador", "inventario", "produccion", "despacho"],
  despacho: ["administrador", "despacho"],
  reportes: ["administrador", "produccion"],
}

function permissionKey(node: MenuNode): string {
  return node.permissionId ?? node.url
}

export function canAccessPermission(permissionId: string, role: AppRole): boolean {
  const allowed = MENU_ROLE_ACCESS[permissionId]
  if (!allowed) return true
  return allowed.includes(role)
}

function isBranch(node: MenuNode): node is MenuNode & { items: MenuNode[] } {
  return Array.isArray(node.items) && node.items.length > 0
}

/** Filtra el árbol: elimina hojas no permitidas y ramas vacías. */
export function filterMenuTree(nodes: MenuNode[], role: AppRole): MenuNode[] {
  const out: MenuNode[] = []

  for (const node of nodes) {
    if (isBranch(node)) {
      const children = filterMenuTree(node.items, role)
      if (children.length > 0) {
        out.push({ ...node, items: children })
      }
      continue
    }

    if (node.url === "#") continue

    if (canAccessPermission(permissionKey(node), role)) {
      out.push(node)
    }
  }

  return out
}

const PATH_PERMISSION: Record<string, string> = {
  resumen: "resumen",
  alertas: "alertas",
  clientes: "clientes",
  productos: "productos",
  proveedores: "proveedores",
  vendedores: "vendedores",
  "ordenes-compra": "ordenes-compra",
  materiales: "materiales",
  recepciones: "recepciones",
  "movimientos-inventario": "movimientos",
  devoluciones: "devoluciones",
  "solicitudes-area": "solicitudes-area",
  "solicitudes-material": "solicitudes",
  "orden-produccion": "orden-produccion",
  "pedidos-cliente": "orden-produccion",
  programacion: "programacion",
  mezcla: "mezcla",
  extrusion: "extrusion",
  sellado: "sellado",
  despacho: "despacho",
  reportes: "reportes",
}

export function permissionIdForPath(pathname: string): string | null {
  const segment = pathname.replace(/^\/+/, "").split("/")[0] ?? ""
  if (!segment) return null
  return PATH_PERMISSION[segment] ?? null
}

export function canAccessPath(pathname: string, role: AppRole): boolean {
  const permissionId = permissionIdForPath(pathname)
  if (!permissionId) return true
  return canAccessPermission(permissionId, role)
}

export function isInventoryRole(role: AppRole): boolean {
  return role === "inventario"
}
