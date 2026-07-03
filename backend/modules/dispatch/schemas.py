from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class BobinaAvailableRead(BaseModel):
    id: int
    coil_code: str
    work_order_id: int | None = None
    client_order_code: str | None = None
    work_order_code: str | None = None
    client_name: str | None = None
    tp_code: str | None = None
    kg: str
    shift: str | None = None
    recorded_at: datetime | None = None


class DispatchCoilWeightInput(BaseModel):
    coil_id: int
    kg: str | float | int
    shift: str | None = None


class DispatchPalletLineInput(BaseModel):
    coil_id: int


class DispatchPalletCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    client_name: str | None = None
    destination: str | None = None
    notes: str | None = None
    coil_ids: list[int] | None = None
    coils: list[DispatchCoilWeightInput] | None = None
    product_name: str | None = None
    measurements: str | None = None


class DispatchPalletCoilRead(BaseModel):
    coil_id: int
    coil_code: str
    kg: str
    shift: str | None = None
    client_order_code: str | None = None
    work_order_code: str | None = None


class DispatchPalletRead(BaseModel):
    id: int
    code: str
    pallet_number: int | None = None
    display_label: str | None = None
    dispatch_batch_id: str | None = None
    total_kg: str
    client_name: str | None = None
    destination: str | None = None
    notes: str | None = None
    product_name: str | None = None
    measurements: str | None = None
    coil_codes: list[str] = Field(default_factory=list)
    coils: list[DispatchPalletCoilRead] = Field(default_factory=list)
    created_at: datetime | None = None


class DispatchPalletCoilSummary(BaseModel):
    coil_code: str
    kg: str
    shift: str | None = None


class DispatchPalletListRead(BaseModel):
    id: int
    code: str
    pallet_number: int | None = None
    display_label: str | None = None
    dispatch_batch_id: str | None = None
    total_kg: str
    client_name: str | None = None
    destination: str | None = None
    product_name: str | None = None
    measurements: str | None = None
    coil_count: int = 0
    coils: list[DispatchPalletCoilSummary] = Field(default_factory=list)
    created_at: datetime | None = None


class DispatchPalletBatchCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    dispatch_batch_id: str | None = None
    pallets: list[DispatchPalletCreate] = Field(min_length=1)


class BolsonesPendingRead(BaseModel):
    item_key: str
    entry_kind: str
    work_order_id: int | None = None
    manual_entry_id: int | None = None
    description: str | None = None
    measure: str | None = None
    work_order_code: str | None = None
    client_order_code: str | None = None
    client_name: str | None = None
    produced_kg: str
    production_kg: str = "0"
    manual_kg: str = "0"
    dispatched_kg: str
    pending_kg: str


class BolsonesEntryInput(BaseModel):
    measure: str = Field(min_length=1, max_length=128)
    kg: str | float | int
    description: str | None = None
    notes: str | None = None


class BolsonesEntryRead(BaseModel):
    id: int
    description: str
    measure: str | None = None
    kg: str
    notes: str | None = None
    created_at: datetime | None = None


class BolsonesDispatchInput(BaseModel):
    measure: str = Field(min_length=1, max_length=128)
    kg: str | float | int
    notes: str | None = None


class BolsonesDispatchRead(BaseModel):
    id: int
    measure: str | None = None
    work_order_id: int | None = None
    manual_entry_id: int | None = None
    kg: str
    notes: str | None = None
    created_at: datetime | None = None


class DesperdicioPendingRead(BaseModel):
    item_key: str
    entry_kind: str
    work_order_id: int | None = None
    manual_entry_id: int | None = None
    description: str | None = None
    work_order_code: str | None = None
    client_order_code: str | None = None
    client_name: str | None = None
    refil_kg: str
    transparente_kg: str
    produced_kg: str
    dispatched_kg: str
    pending_kg: str


class DesperdicioEntryInput(BaseModel):
    description: str = Field(min_length=1, max_length=255)
    kg: str | float | int
    waste_type: str | None = Field(default=None, max_length=32)
    notes: str | None = None


class DesperdicioEntryRead(BaseModel):
    id: int
    description: str
    kg: str
    waste_type: str | None = None
    notes: str | None = None
    created_at: datetime | None = None


class DesperdicioDispatchInput(BaseModel):
    work_order_id: int | None = Field(default=None, ge=1)
    manual_entry_id: int | None = Field(default=None, ge=1)
    kg: str | float | int
    notes: str | None = None

    @model_validator(mode="after")
    def validate_target(self) -> "DesperdicioDispatchInput":
        has_wo = self.work_order_id is not None
        has_manual = self.manual_entry_id is not None
        if has_wo == has_manual:
            raise ValueError("Indique orden de producción o entrada manual, no ambas")
        return self


class DesperdicioDispatchRead(BaseModel):
    id: int
    work_order_id: int | None = None
    manual_entry_id: int | None = None
    kg: str
    notes: str | None = None
    created_at: datetime | None = None


class FallasPendingRead(BaseModel):
    item_key: str
    entry_kind: str
    work_order_id: int | None = None
    manual_entry_id: int | None = None
    description: str | None = None
    work_order_code: str | None = None
    client_order_code: str | None = None
    client_name: str | None = None
    extrusion_kg: str
    returns_kg: str
    produced_kg: str
    sent_to_materials_kg: str
    pending_kg: str


class FallasMaterialsInput(BaseModel):
    work_order_id: int | None = Field(default=None, ge=1)
    manual_entry_id: int | None = Field(default=None, ge=1)
    kg: str | float | int
    notes: str | None = None

    @model_validator(mode="after")
    def validate_target(self) -> "FallasMaterialsInput":
        has_wo = self.work_order_id is not None
        has_manual = self.manual_entry_id is not None
        if has_wo == has_manual:
            raise ValueError("Indique orden de producción o entrada manual, no ambas")
        return self


class FallasMaterialsRead(BaseModel):
    id: int
    work_order_id: int | None = None
    manual_entry_id: int | None = None
    inventory_return_id: int | None = None
    kg: str
    status: str
    notes: str | None = None
    created_at: datetime | None = None


class FallasMaterialsAcceptInput(BaseModel):
    reason: str | None = None


class SubproductInDispatchRead(BaseModel):
    item_key: str
    work_order_id: int | None = None
    manual_entry_id: int | None = None
    description: str | None = None
    measure: str | None = None
    work_order_code: str | None = None
    client_order_code: str | None = None
    client_name: str | None = None
    in_dispatch_kg: str
    shipped_kg: str
    released_kg: str


class SubproductReleaseInput(BaseModel):
    work_order_id: int | None = Field(default=None, ge=1)
    manual_entry_id: int | None = Field(default=None, ge=1)
    measure: str | None = Field(default=None, min_length=1, max_length=128)
    kg: str | float | int
    notes: str | None = None

    @model_validator(mode="after")
    def validate_target(self) -> "SubproductReleaseInput":
        targets = [
            self.work_order_id is not None,
            self.manual_entry_id is not None,
            bool(self.measure and self.measure.strip()),
        ]
        if sum(targets) != 1:
            raise ValueError("Indique orden, entrada manual o medida")
        return self


class SubproductReleaseRead(BaseModel):
    id: int
    work_order_id: int | None = None
    manual_entry_id: int | None = None
    measure: str | None = None
    kg: str
    notes: str | None = None
    created_at: datetime | None = None
