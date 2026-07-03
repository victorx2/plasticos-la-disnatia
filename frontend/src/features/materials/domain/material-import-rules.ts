/**
 * Reglas de tipo/marca para filas del almacén (pigmento, deslizante).
 */
export function normalizeMaterialFields(
  categoria: string,
  tipo: string,
  marca: string,
): { tipo: string; marca: string } {
  let t = tipo.trim()
  let m = marca.trim()

  if (categoria === "pigmento" && t && !m) m = t
  if (categoria === "deslizante") {
    if (!t) t = "General"
    if (!m) m = "General"
  }
  return { tipo: t, marca: m }
}

export function validateMaterialRow(
  categoria: string | null,
  tipo: string,
  marca: string,
): string | undefined {
  if (!categoria) return "Categoría inválida"
  if (categoria === "deslizante") return undefined
  if (categoria === "pigmento") {
    if (!tipo) return "Tipo vacío (color)"
    return undefined
  }
  if (!tipo) return "Tipo vacío"
  if (!marca) return "Marca vacía"
  return undefined
}
