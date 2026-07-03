import re
import unicodedata
from decimal import Decimal

CATEGORY_MAP = {
    "resina": "resina",
    "pigmento": "pigmento",
    "miscelaneo": "miscelaneo",
    "misceláneo": "miscelaneo",
    "miscelaneos": "miscelaneo",
    "misceláneos": "miscelaneo",
    "deslizante": "deslizante",
    "core": "core",
    "cores": "core",
    "eva": "miscelaneo",
}

KG_PER_SACO = Decimal("25")

HEADER_ALIASES: dict[str, str] = {
    "fecha": "fecha",
    "categoria": "categoria",
    "categoría": "categoria",
    "cat": "categoria",
    "tipo": "tipo",
    "marca": "marca",
    "cantidad_kg": "cantidad_kg",
    "cantidadkg": "cantidad_kg",
    "cantidad": "cantidad_kg",
    "cantidad_de_kilos": "cantidad_kg",
    "unidades_sacos": "unidades_sacos",
    "unidades": "unidades_sacos",
    "unidades_saco": "unidades_sacos",
    "proveedor": "proveedor",
    "nro_contenedor": "nro_contenedor",
    "nrocontenedor": "nro_contenedor",
    "numero_contenedor": "nro_contenedor",
    "nrc": "nro_contenedor",
    "nro_control": "nro_contenedor",
    "nrc_numerde_control": "nro_contenedor",
    "numerde_control": "nro_contenedor",
}


def normalize_header(value: str) -> str:
    text = value.strip().lower()
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    text = re.sub(r"[^a-z0-9]+", "_", text).strip("_")
    return HEADER_ALIASES.get(text, text)


def slugify(value: str) -> str:
    text = value.strip().lower()
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text


def parse_decimal(value: str | None) -> Decimal | None:
    if value is None:
        return None
    raw = str(value).strip()
    if not raw:
        return None
    raw = raw.replace(" ", "").replace("kg", "").replace("Kg", "")
    if "," in raw and "." in raw:
        if raw.rfind(",") > raw.rfind("."):
            raw = raw.replace(".", "").replace(",", ".")
        else:
            raw = raw.replace(",", "")
    elif "," in raw:
        parts = raw.split(",")
        if len(parts) == 2 and len(parts[1]) == 3 and parts[0].isdigit():
            raw = raw.replace(",", "")
        else:
            raw = raw.replace(",", ".")
    elif "." in raw:
        parts = raw.split(".")
        if len(parts) == 2 and len(parts[1]) == 3 and parts[0].isdigit():
            raw = raw.replace(".", "")
    try:
        return Decimal(raw)
    except Exception:
        return None


def normalize_category(value: str | None) -> str | None:
    if not value or not value.strip():
        return None
    key = value.strip().lower()
    key = unicodedata.normalize("NFD", key)
    key = "".join(c for c in key if unicodedata.category(c) != "Mn")
    return CATEGORY_MAP.get(key)


def normalize_material_fields(categoria: str, tipo: str, marca: str) -> tuple[str, str]:
    """Ajusta tipo/marca según reglas del almacén Acarigua."""
    tipo = tipo.strip()
    marca = marca.strip()

    if categoria == "pigmento" and tipo and not marca:
        marca = tipo
    if categoria == "deslizante":
        if not tipo:
            tipo = "General"
        if not marca:
            marca = "General"
    return tipo, marca


def validate_material_row(categoria: str | None, tipo: str, marca: str) -> str | None:
    if not categoria:
        return "Categoría inválida o vacía."
    if categoria == "deslizante":
        return None
    if categoria == "pigmento":
        if not tipo:
            return "Tipo vacío (color del pigmento)."
        return None
    if not tipo:
        return "Tipo vacío."
    if not marca:
        return "Marca vacía."
    return None


def build_sku(product_type: str, brand: str, container: str | None, row: int) -> str:
    base = slugify(product_type)
    marca = slugify(brand) if brand.strip() else "sin-marca"
    if container and container.strip():
        return f"{base}-{marca}-{slugify(container)}"
    return f"{base}-{marca}-r{row}"


def build_name(product_type: str, brand: str) -> str:
    tipo = product_type.strip()
    marca = brand.strip()
    if tipo and marca:
        return f"{tipo} {marca}"
    return tipo or marca or "Material"
