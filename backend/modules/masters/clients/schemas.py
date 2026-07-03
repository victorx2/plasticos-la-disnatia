from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class ClientBase(BaseModel):
    name: str
    active: bool = True
    rif: str | None = None
    state: str | None = None
    city: str | None = None
    address: str | None = None
    email: str | None = None
    phone: str | None = None
    vendor_id: int | None = None
    photo_url: str | None = None


class ClientCreate(ClientBase):
    model_config = ConfigDict(extra="ignore")

    no_rif: bool | None = None


class ClientUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str | None = None
    active: bool | None = None
    no_rif: bool | None = None
    rif: str | None = None
    state: str | None = None
    city: str | None = None
    address: str | None = None
    email: str | None = None
    phone: str | None = None
    vendor_id: int | None = None


class ClientRead(ClientBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vendor_name: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class PaginatedClients(BaseModel):
    data: list[ClientRead]
    total: int
    current_page: int
    per_page: int
    last_page: int
    from_: int | None = Field(serialization_alias="from")
    to: int | None = None

    model_config = ConfigDict(populate_by_name=True)
