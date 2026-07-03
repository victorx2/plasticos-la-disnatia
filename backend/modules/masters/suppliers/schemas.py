from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SupplierBase(BaseModel):
    name: str
    active: bool = True
    photo_url: str | None = None
    rif: str | None = None
    email: str | None = None
    phone: str | None = None
    address: str | None = None


class SupplierCreate(SupplierBase):
    model_config = ConfigDict(extra="ignore")

    no_rif: bool | None = None


class SupplierUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str | None = None
    rif: str | None = None
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    no_rif: bool | None = None
    active: bool | None = None


class SupplierRead(SupplierBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime | None = None
    updated_at: datetime | None = None


class PaginatedSuppliers(BaseModel):
    data: list[SupplierRead]
    total: int
    current_page: int
    per_page: int
    last_page: int
    from_: int | None = Field(serialization_alias="from")
    to: int | None = None

    model_config = ConfigDict(populate_by_name=True)
