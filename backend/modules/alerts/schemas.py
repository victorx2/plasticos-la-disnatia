from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class OperationalAlertRead(BaseModel):
    id: int
    alert_key: str
    category: str
    severity: str
    title: str
    body: str
    href_path: str
    is_read: bool
    read_at: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class PaginatedAlerts(BaseModel):
    data: list[OperationalAlertRead]
    total: int
    current_page: int
    per_page: int
    last_page: int
    from_: int | None = Field(serialization_alias="from")
    to: int | None = None
    unread_total: int

    model_config = ConfigDict(populate_by_name=True)


class AlertsUnreadCountRead(BaseModel):
    count: int


class AlertsSyncRead(BaseModel):
    synced: int
    unread_count: int
