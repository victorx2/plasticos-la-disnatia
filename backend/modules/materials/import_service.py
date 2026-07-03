import csv
import io
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from modules.materials.categories import (
    KG_PER_SACO,
    build_name,
    build_sku,
    normalize_category,
    normalize_header,
    normalize_material_fields,
    parse_decimal,
    validate_material_row,
)
from modules.materials.models import ImportBatch, InventoryMovement, Material
from modules.materials.schemas import ImportResult, ImportRowError


def _decode_content(raw: bytes) -> str:
    if raw.startswith(b"\xef\xbb\xbf"):
        return raw.decode("utf-8-sig")
    for encoding in ("utf-8", "latin-1"):
        try:
            return raw.decode(encoding)
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", errors="replace")


def import_materials_csv(db: Session, filename: str, content: bytes) -> ImportResult:
    text = _decode_content(content)
    reader = csv.DictReader(io.StringIO(text), delimiter=",")
    if not reader.fieldnames:
        return ImportResult(
            filename=filename,
            errors=[ImportRowError(row=1, message="El archivo no tiene encabezados.")],
        )

    field_map = {name: normalize_header(name) for name in reader.fieldnames if name}
    required = {"categoria", "cantidad_kg"}
    present = set(field_map.values())
    missing = required - present
    if missing:
        return ImportResult(
            filename=filename,
            errors=[
                ImportRowError(
                    row=1,
                    message=f"Faltan columnas: {', '.join(sorted(missing))}",
                )
            ],
        )

    batch = ImportBatch(filename=filename)
    db.add(batch)
    db.flush()

    result = ImportResult(filename=filename, batch_id=batch.id)
    now = datetime.now(timezone.utc)
    row_num = 1

    for raw_row in reader:
        row_num += 1
        row: dict[str, str] = {}
        for original, canonical in field_map.items():
            row[canonical] = (raw_row.get(original) or "").strip()

        categoria = normalize_category(row.get("categoria"))
        tipo = row.get("tipo", "").strip()
        marca = row.get("marca", "").strip()
        qty_kg = parse_decimal(row.get("cantidad_kg"))
        sacos = parse_decimal(row.get("unidades_sacos"))
        proveedor = row.get("proveedor", "").strip() or None
        contenedor = row.get("nro_contenedor", "").strip() or None

        if not any([categoria, tipo, marca, qty_kg]):
            continue

        if categoria:
            tipo, marca = normalize_material_fields(categoria, tipo, marca)

        row_error = validate_material_row(categoria, tipo, marca)
        if row_error:
            result.errors.append(ImportRowError(row=row_num, message=row_error))
            result.skipped += 1
            continue
        if qty_kg is None or qty_kg <= 0:
            result.errors.append(ImportRowError(row=row_num, message="Cantidad_kg inválida."))
            result.skipped += 1
            continue

        if sacos is None and qty_kg % KG_PER_SACO == 0:
            sacos = qty_kg / KG_PER_SACO

        sku = build_sku(tipo, marca, contenedor, row_num)
        existing = db.query(Material).filter(Material.sku == sku).first()
        name = build_name(tipo, marca)

        if existing:
            existing.name = name
            existing.inventory_area = categoria
            existing.product_type = tipo
            existing.brand = marca
            existing.quantity_on_hand = qty_kg
            existing.units_count = sacos
            existing.supplier_name = proveedor
            existing.container_number = contenedor
            existing.import_batch_id = batch.id
            material = existing
            result.updated += 1
        else:
            material = Material(
                sku=sku,
                name=name,
                inventory_area=categoria,
                product_type=tipo,
                brand=marca,
                unit="kg",
                quantity_on_hand=qty_kg,
                units_count=sacos,
                supplier_name=proveedor,
                container_number=contenedor,
                import_batch_id=batch.id,
            )
            db.add(material)
            db.flush()
            result.created += 1

        movement = InventoryMovement(
            material_id=material.id,
            movement_type="excel_import",
            quantity=qty_kg,
            reference_type="import_batch",
            reference_id=batch.id,
            occurred_at=now,
            reason=f"Importación Excel: {filename}",
        )
        db.add(movement)

    db.commit()
    return result
