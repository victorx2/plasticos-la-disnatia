#!/usr/bin/env python3
"""Smoke test: datos maestros (clientes, vendedores, proveedores, productos)."""
from __future__ import annotations

import os
import sys
import tempfile
from io import BytesIO
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
os.chdir(BACKEND)
sys.path.insert(0, str(BACKEND))

_fd, _db_path = tempfile.mkstemp(suffix=".db")
os.close(_fd)
os.environ["DATABASE_URL"] = f"sqlite:///{_db_path}"
os.environ["API_REQUIRE_AUTH"] = "true"
os.environ["JWT_SECRET"] = "test-secret-key-for-smoke-tests-min-32-chars"

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


def _login(client: TestClient) -> dict[str, str]:
    resp = client.post("/api/auth/login", json={"login": "admin", "password": "password"})
    if resp.status_code >= 400:
        raise AssertionError(f"login: HTTP {resp.status_code} — {resp.text}")
    token = resp.json()["token"]
    return {"Authorization": f"Bearer {token}"}


def _check(resp, step: str) -> dict:
    if resp.status_code >= 400:
        raise AssertionError(f"{step}: HTTP {resp.status_code} — {resp.text}")
    return resp.json()


def _jpeg_bytes() -> bytes:
    return b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01" + b"\x00" * 200


def main() -> None:
    print("Smoke test: datos maestros")
    with TestClient(app) as client:
        headers = _login(client)

        vendor = _check(
            client.post(
                "/api/vendors",
                headers=headers,
                json={"name": "Vendedor Smoke"},
            ),
            "crear vendedor",
        )
        vendor_id = vendor["id"]
        print(f"  OK Vendedor #{vendor_id}")

        upload = _check(
            client.post(
                f"/api/vendors/{vendor_id}/photo",
                headers=headers,
                files={"file": ("avatar.jpg", BytesIO(_jpeg_bytes()), "image/jpeg")},
            ),
            "subir foto vendedor",
        )
        assert upload.get("photo_url"), "photo_url debe quedar asignada"
        print(f"  OK Foto vendedor: {upload['photo_url']}")

        removed = _check(
            client.delete(f"/api/vendors/{vendor_id}/photo", headers=headers),
            "quitar foto vendedor",
        )
        assert removed.get("photo_url") is None
        print("  OK Foto vendedor eliminada")

        bad_email = client.post(
            "/api/clients",
            headers=headers,
            json={"name": "Cliente Bad Email", "email": "no-es-correo", "no_rif": True},
        )
        assert bad_email.status_code == 422, "email inválido debe rechazarse"
        print("  OK Email cliente inválido rechazado (422)")

        good_client = _check(
            client.post(
                "/api/clients",
                headers=headers,
                json={"name": "Cliente Smoke", "no_rif": True},
            ),
            "crear cliente sin RIF",
        )
        assert good_client.get("rif") is None
        client_id = good_client["id"]
        print(f"  OK Cliente #{client_id} sin RIF")

        supplier = _check(
            client.post(
                "/api/suppliers",
                headers=headers,
                json={"name": "Proveedor Smoke", "no_rif": True},
            ),
            "crear proveedor",
        )
        supplier_id = supplier["id"]
        print(f"  OK Proveedor #{supplier_id}")

        deactivated = _check(
            client.patch(
                f"/api/suppliers/{supplier_id}",
                headers=headers,
                json={"active": False},
            ),
            "desactivar proveedor",
        )
        assert deactivated["active"] is False
        inactive_list = _check(
            client.get("/api/suppliers?active=0", headers=headers),
            "listar proveedores inactivos",
        )
        assert any(row["id"] == supplier_id for row in inactive_list["data"])
        print("  OK Proveedor inactivo en listado ?active=0")

        product = _check(
            client.post(
                "/api/products",
                headers=headers,
                json={"client_id": client_id, "name": "Producto Smoke"},
            ),
            "crear producto con cliente activo",
        )
        print(f"  OK Producto #{product['id']}")

        _check(
            client.patch(
                f"/api/clients/{client_id}",
                headers=headers,
                json={"active": False},
            ),
            "desactivar cliente",
        )
        bad_inactive = client.post(
            "/api/products",
            headers=headers,
            json={"client_id": client_id, "name": "Producto cliente inactivo"},
        )
        assert bad_inactive.status_code == 422, "cliente inactivo debe rechazarse en producto"
        print("  OK Producto con cliente inactivo rechazado (422)")

    print("Smoke test OK")


if __name__ == "__main__":
    main()
