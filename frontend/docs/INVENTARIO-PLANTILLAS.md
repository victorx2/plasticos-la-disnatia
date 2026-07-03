# Plantillas de inventario — Acarigua

Plantillas para carga de inventario de almacén. Abrir en Excel o LibreOffice Calc.

## Archivos

| Archivo | Uso |
|---------|-----|
| [`public/templates/inventario-inicial.csv`](../public/templates/inventario-inicial.csv) | Corte de stock actual (kg disponible) |
| [`public/templates/entrada-producto.csv`](../public/templates/entrada-producto.csv) | Entrada con proveedor y nº de contenedor |

En la app: **Materiales → Descargar plantilla**.

## Columnas

| Columna | Obligatorio | Notas |
|---------|-------------|-------|
| Fecha | Sí | `DD/MM/YYYY` |
| Categoría | Sí | Ver lista abajo |
| Tipo | Sí | Ej. `3003`, `11PG1`, `Blanco` |
| Marca | Según categoría | Ej. `Synpol`, `Petrothene` |
| Cantidad_kg | Sí | Total kg de la fila |
| Unidades_sacos | Sí | `Cantidad_kg ÷ 25` |
| Proveedor | No en inventario inicial | Se llena en la entrada |
| Nro_contenedor | No en inventario inicial | Distingue lotes/containers |

## Categorías válidas

- Resina
- Pigmento
- Misceláneo
- Deslizante

## Regla del saco

**1 saco = 25 kg.** El sistema validará que `Unidades_sacos × 25 ≈ Cantidad_kg`.

## Filas repetidas

Misma marca y tipo en varias filas = contenedores distintos. Se diferencian con **Nro_contenedor** al registrar la entrada.

## Importación

La importación desde Excel estará disponible en una fase posterior (`POST /api/materials/import`). Hoy la plantilla sirve para acordar formato con almacén.
