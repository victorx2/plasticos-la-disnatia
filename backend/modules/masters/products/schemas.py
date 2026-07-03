from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ClientBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class ProductBase(BaseModel):
    client_id: int | None = None
    name: str
    barcode: str | None = None
    cpe: str | None = None
    mps: str | None = None
    print_type: str | None = None
    structure: str | None = None


class ProductCreate(ProductBase):
    model_config = ConfigDict(extra="ignore")


class ProductUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    client_id: int | None = None
    name: str | None = None
    barcode: str | None = None
    cpe: str | None = None
    mps: str | None = None
    print_type: str | None = None
    structure: str | None = None


class ProductRead(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    client: ClientBrief | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class PaginatedProducts(BaseModel):
    data: list[ProductRead]
    total: int
    current_page: int
    per_page: int
    last_page: int
    from_: int | None = Field(serialization_alias="from")
    to: int | None = None

    model_config = ConfigDict(populate_by_name=True)
