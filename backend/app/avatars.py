from pathlib import Path

from fastapi import HTTPException, UploadFile

UPLOAD_ROOT = Path(__file__).resolve().parent.parent / "uploads"
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_BYTES = 2 * 1024 * 1024

_EXT_BY_TYPE = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


def ensure_upload_dirs() -> None:
    (UPLOAD_ROOT / "avatars" / "vendors").mkdir(parents=True, exist_ok=True)
    (UPLOAD_ROOT / "avatars" / "clients").mkdir(parents=True, exist_ok=True)
    (UPLOAD_ROOT / "avatars" / "suppliers").mkdir(parents=True, exist_ok=True)


def delete_avatar_file(photo_url: str | None) -> None:
    if not photo_url or not photo_url.startswith("/uploads/"):
        return
    path = UPLOAD_ROOT / photo_url.removeprefix("/uploads/")
    if path.is_file():
        path.unlink(missing_ok=True)
    for leftover in path.parent.glob(f"{path.stem}.*"):
        if leftover.is_file():
            leftover.unlink(missing_ok=True)


async def save_avatar(entity: str, entity_id: int, file: UploadFile, old_url: str | None) -> str:
    ensure_upload_dirs()
    content_type = file.content_type or ""
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Datos inválidos",
                "errors": {"photo": ["Use JPG, PNG o WebP."]},
            },
        )

    data = await file.read()
    if not data:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Datos inválidos",
                "errors": {"photo": ["Seleccione una imagen."]},
            },
        )
    if len(data) > MAX_BYTES:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Datos inválidos",
                "errors": {"photo": ["La imagen no puede superar 2 MB."]},
            },
        )

    delete_avatar_file(old_url)
    ext = _EXT_BY_TYPE.get(content_type, ".jpg")
    rel = f"/uploads/avatars/{entity}/{entity_id}{ext}"
    dest = UPLOAD_ROOT / "avatars" / entity / f"{entity_id}{ext}"
    dest.write_bytes(data)
    return rel
