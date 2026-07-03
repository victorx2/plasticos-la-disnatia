from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class VendorBase(BaseModel):
    name: str
    phone_primary: str | None = None
    phone_secondary: str | None = None
    active: bool = True
    photo_url: str | None = None


class VendorCreate(VendorBase):
    model_config = ConfigDict(extra="ignore")


class VendorUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str | None = None
    phone_primary: str | None = None
    phone_secondary: str | None = None
    active: bool | None = None


class VendorRead(VendorBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    clients_count: int = 0
    created_at: datetime | None = None
    updated_at: datetime | None = None


class PaginatedVendors(BaseModel):
    data: list[VendorRead]
    total: int
    current_page: int
    per_page: int
    last_page: int
    from_: int | None = Field(serialization_alias="from")
    to: int | None = None

    model_config = ConfigDict(populate_by_name=True)
