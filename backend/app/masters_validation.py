import re

from fastapi import HTTPException

_PHONE_ERROR = "Teléfono inválido. Use solo números, espacios o guiones (7–15 dígitos)."


def validate_rif(rif: str | None) -> None:
    if rif is None:
        return
    raw = rif.strip().upper()
    if not raw:
        return
    if not re.match(r"^[JVEGPC]-\d{7,8}-\d$", raw):
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Datos inválidos",
                "errors": {"rif": ["Si no marca «Sin RIF», debe completar el RIF."]},
            },
        )


def validate_contact(email: str | None, phone: str | None) -> None:
    errors: dict[str, list[str]] = {}
    if email is not None and email.strip():
        raw_email = email.strip()
        if not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", raw_email):
            errors["email"] = ["Correo inválido."]
    if phone is not None and phone.strip():
        raw_phone = phone.strip()
        if not re.match(r"^[+]?[0-9\s\-()]+$", raw_phone):
            errors["phone"] = [_PHONE_ERROR]
        else:
            digits = len(re.findall(r"\d", raw_phone))
            if digits < 7 or digits > 15:
                errors["phone"] = [_PHONE_ERROR]
    if errors:
        raise HTTPException(status_code=422, detail={"message": "Datos inválidos", "errors": errors})


def normalize_no_rif_payload(data: dict) -> dict:
    if data.pop("no_rif", None):
        data["rif"] = None
    return data
