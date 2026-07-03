import { sacosFromKg } from "@/features/materials/domain/units"
import type { Material } from "@/features/materials/types"

export function materialProductType(material: Material): string {
  if (material.product_type?.trim()) return material.product_type.trim()
  return material.sku?.trim() || "—"
}

export function materialBrand(material: Material): string {
  if (material.brand?.trim()) return material.brand.trim()
  const name = material.name?.trim() ?? ""
  const sku = material.sku?.trim() ?? ""
  if (sku && name.toLowerCase().startsWith(sku.toLowerCase())) {
    const rest = name.slice(sku.length).trim()
    return rest || "—"
  }
  return name || "—"
}

export function materialUnitsCount(material: Material): string {
  const sacos = sacosFromKg(material.quantity_on_hand)
  if (sacos == null) return "—"
  return sacos.toLocaleString("es-VE", { maximumFractionDigits: 0 })
}

export function buildSkuFromTypeBrand(
  productType: string,
  brand: string,
  containerNumber?: string | null,
): string {
  const slug = (part: string) =>
    part
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")

  const tipo = slug(productType)
  const marca = slug(brand) || "sin-marca"
  const contenedor = slug(containerNumber ?? "")
  if (tipo && contenedor) return `${tipo}-${marca}-${contenedor}`
  if (tipo && marca) return `${tipo}-${marca}`
  return tipo || marca || ""
}

export function buildMaterialName(productType: string, brand: string): string {
  const tipo = productType.trim()
  const marca = brand.trim()
  if (tipo && marca) return `${tipo} ${marca}`
  return tipo || marca
}
