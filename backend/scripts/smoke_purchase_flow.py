#!/usr/bin/env python3
"""Smoke test: proveedor → OC → recepción → inventario."""
from __future__ import annotations

import os
import sys
import tempfile
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


def main() -> None:
    print("Smoke test: flujo compras (proveedor -> OC -> recepcion -> inventario)")
    with TestClient(app) as client:
        headers = _login(client)

        next_code = _check(
            client.get("/api/purchase-orders/next-code", headers=headers),
            "obtener código OC",
        )
        print(f"  OK Código sugerido: {next_code['code']}")

        supplier = _check(
            client.post(
                "/api/suppliers",
                headers=headers,
                json={"name": "Proveedor Smoke S.A.", "rif": "J-99999999-9"},
            ),
            "crear proveedor",
        )
        supplier_id = supplier["id"]
        print(f"  OK Proveedor #{supplier_id}")

        material = _check(
            client.post(
                "/api/materials",
                headers=headers,
                json={
                    "name": "Resina smoke",
                    "sku": "SMOKE-RES-001",
                    "inventory_area": "materia_prima",
                    "unit": "kg",
                    "quantity_on_hand": "0",
                },
            ),
            "crear material",
        )
        material_id = material["id"]
        qty_before = float(material["quantity_on_hand"])
        print(f"  OK Material #{material_id} (stock inicial {qty_before})")

        order = _check(
            client.post(
                "/api/purchase-orders",
                headers=headers,
                json={
                    "supplier_id": supplier_id,
                    "code": next_code["code"],
                    "ordered_at": "2026-06-20",
                    "tax_applies": False,
                    "lines": [
                        {
                            "material_id": material_id,
                            "description": "Resina smoke",
                            "quantity_ordered": "100",
                            "unit": "kg",
                        }
                    ],
                },
            ),
            "crear orden de compra",
        )
        order_id = order["id"]
        po_line_id = order["lines"][0]["id"]
        print(f"  OK OC #{order_id} ({order['code']})")

        order_edit = _check(
            client.patch(
                f"/api/purchase-orders/{order_id}",
                headers=headers,
                json={
                    "notes": "Nota actualizada en smoke test",
                    "change_reason": "Ajuste de notas en prueba automatizada",
                },
            ),
            "editar orden de compra (change_reason)",
        )
        assert order_edit.get("change_reason") == "Ajuste de notas en prueba automatizada"
        print(f"  OK change_reason guardado: {order_edit['change_reason']!r}")

        bad_edit = client.patch(
            f"/api/purchase-orders/{order_id}",
            headers=headers,
            json={"notes": "Sin motivo", "change_reason": "abc"},
        )
        assert bad_edit.status_code == 422, "change_reason corto debe rechazarse"
        print("  OK change_reason corto rechazado (422)")

        receipt = _check(
            client.post(
                "/api/purchase-receipts",
                headers=headers,
                json={
                    "purchase_order_id": order_id,
                    "without_purchase_order": False,
                    "supplier_id": supplier_id,
                    "invoice_number": "FAC-SMOKE-001",
                    "received_at": "2026-06-20",
                    "lines": [
                        {
                            "purchase_order_line_id": po_line_id,
                            "material_id": material_id,
                            "item_type": "miscelaneo",
                            "quantity": "50",
                            "unit": "kg",
                        }
                    ],
                },
            ),
            "registrar recepción parcial",
        )
        print(f"  OK Recepción #{receipt['id']}")

        order_after = _check(
            client.get(f"/api/purchase-orders/{order_id}", headers=headers),
            "consultar OC tras recepción",
        )
        assert order_after["status"] == "partial", f"estado esperado partial, got {order_after['status']}"
        assert (order_after.get("receipts_count") or 0) >= 1
        print(f"  OK OC status={order_after['status']}, receipts={order_after['receipts_count']}")

        material_after = _check(
            client.get(f"/api/materials/{material_id}", headers=headers),
            "consultar inventario material",
        )
        qty_after = float(material_after["quantity_on_hand"])
        assert qty_after == qty_before + 50, f"stock esperado {qty_before + 50}, got {qty_after}"
        print(f"  OK Inventario actualizado: {qty_after} kg")

        unauth = client.get("/api/clients")
        assert unauth.status_code == 401, "API debe rechazar peticiones sin token"
        print("  OK API protegida sin token (401)")

    print("Smoke test OK")


if __name__ == "__main__":
    main()
