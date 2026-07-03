import { INVENTORY_EXCEL_COLUMNS } from "@/features/materials/domain/excel-template"
import { categoryLabel, normalizeCategoryValue } from "@/features/materials/domain/categories"
import {
  normalizeMaterialFields,
  validateMaterialRow,
} from "@/features/materials/domain/material-import-rules"

export type ParsedImportRow = {
  row: number
  fecha: string
  categoria: string
  categoriaValue: string | null
  tipo: string
  marca: string
  cantidadKg: number | null
  unidadesSacos: number | null
  proveedor: string
  nroContenedor: string
  error?: string
}

function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
}

const HEADER_MAP: Record<string, keyof Omit<ParsedImportRow, "row" | "categoriaValue" | "error">> = {
  fecha: "fecha",
  categoria: "categoria",
  cat: "categoria",
  tipo: "tipo",
  marca: "marca",
  cantidad_kg: "cantidadKg",
  cantidadkg: "cantidadKg",
  cantidad: "cantidadKg",
  cantidad_de_kilos: "cantidadKg",
  unidades_sacos: "unidadesSacos",
  unidades: "unidadesSacos",
  proveedor: "proveedor",
  nro_contenedor: "nroContenedor",
  nrocontenedor: "nroContenedor",
  numero_contenedor: "nroContenedor",
  nrc: "nroContenedor",
  nrc_numerde_control: "nroContenedor",
  numerde_control: "nroContenedor",
}

export function parseDecimal(value: string | undefined): number | null {
  if (!value?.trim()) return null
  let raw = value.trim().replace(/\s/g, "").replace(/kg/gi, "")
  if (raw.includes(",") && raw.includes(".")) {
    if (raw.lastIndexOf(",") > raw.lastIndexOf(".")) {
      raw = raw.replace(/\./g, "").replace(",", ".")
    } else {
      raw = raw.replace(/,/g, "")
    }
  } else if (raw.includes(",")) {
    const parts = raw.split(",")
    if (parts.length === 2 && parts[1].length === 3 && /^\d+$/.test(parts[0])) {
      raw = raw.replace(/,/g, "")
    } else {
      raw = raw.replace(",", ".")
    }
  } else if (raw.includes(".")) {
    const parts = raw.split(".")
    if (parts.length === 2 && parts[1].length === 3 && /^\d+$/.test(parts[0])) {
      raw = raw.replace(/\./g, "")
    }
  }
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (ch === "," && !inQuotes) {
      cells.push(current)
      current = ""
      continue
    }
    current += ch
  }
  cells.push(current)
  return cells.map((c) => c.trim())
}

export function parseInventoryCsv(text: string): ParsedImportRow[] {
  const normalized = text.replace(/^\uFEFF/, "")
  const lines = normalized.split(/\r?\n/).filter((line) => line.trim().length > 0)
  if (lines.length < 2) return []

  const headers = parseCsvLine(lines[0])
  const fieldIndex: Partial<Record<keyof ParsedImportRow, number>> = {}
  headers.forEach((header, index) => {
    const key = HEADER_MAP[normalizeHeader(header)]
    if (key === "cantidadKg") fieldIndex.cantidadKg = index
    else if (key === "unidadesSacos") fieldIndex.unidadesSacos = index
    else if (key) fieldIndex[key] = index
  })

  const rows: ParsedImportRow[] = []
  for (let i = 1; i < lines.length; i += 1) {
    const cells = parseCsvLine(lines[i])
    const get = (key: keyof typeof fieldIndex) => {
      const idx = fieldIndex[key]
      return idx != null ? (cells[idx] ?? "").trim() : ""
    }

    const categoriaRaw = get("categoria")
    let tipo = get("tipo")
    let marca = get("marca")
    const cantidadKg = parseDecimal(get("cantidadKg") || undefined)
    const unidadesSacos = parseDecimal(get("unidadesSacos") || undefined)

    if (!categoriaRaw && !tipo && !marca && cantidadKg == null) continue

    const categoriaValue = normalizeCategoryValue(categoriaRaw)
    if (categoriaValue) {
      const normalized = normalizeMaterialFields(categoriaValue, tipo, marca)
      tipo = normalized.tipo
      marca = normalized.marca
    }

    let error: string | undefined = validateMaterialRow(categoriaValue, tipo, marca)
    if (!error && (cantidadKg == null || cantidadKg <= 0)) error = "Cantidad_kg inválida"

    rows.push({
      row: i + 1,
      fecha: get("fecha"),
      categoria: categoriaValue ? categoryLabel(categoriaValue) : categoriaRaw,
      categoriaValue,
      tipo,
      marca,
      cantidadKg,
      unidadesSacos,
      proveedor: get("proveedor"),
      nroContenedor: get("nroContenedor"),
      error,
    })
  }

  return rows
}

export function expectedColumnsHint(): string {
  return INVENTORY_EXCEL_COLUMNS.join(", ")
}
