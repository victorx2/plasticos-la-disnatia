from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    JSON,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Client(Base):
    __tablename__ = "clients"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255))
    rif: Mapped[str | None] = mapped_column(String(64), nullable=True)
    state: Mapped[str | None] = mapped_column(String(128), nullable=True)
    city: Mapped[str | None] = mapped_column(String(128), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(64), nullable=True)
    vendor_id: Mapped[int | None] = mapped_column(ForeignKey("vendors.id"), nullable=True, index=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    photo_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    vendor: Mapped["Vendor | None"] = relationship(back_populates="clients")
    orders: Mapped[list["ClientOrder"]] = relationship(back_populates="client")


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    client_id: Mapped[int | None] = mapped_column(ForeignKey("clients.id"), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    barcode: Mapped[str | None] = mapped_column(String(128), nullable=True)
    cpe: Mapped[str | None] = mapped_column(String(64), nullable=True)
    mps: Mapped[str | None] = mapped_column(String(64), nullable=True)
    print_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    structure: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    client: Mapped["Client | None"] = relationship()


class Vendor(Base):
    __tablename__ = "vendors"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255))
    phone_primary: Mapped[str | None] = mapped_column(String(64), nullable=True)
    phone_secondary: Mapped[str | None] = mapped_column(String(64), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    photo_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    clients: Mapped[list["Client"]] = relationship(back_populates="vendor")


class Supplier(Base):
    __tablename__ = "suppliers"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255))
    rif: Mapped[str | None] = mapped_column(String(64), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(64), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    supplier_id: Mapped[int] = mapped_column(ForeignKey("suppliers.id"), index=True)
    code: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    status: Mapped[str] = mapped_column(String(32), default="open", index=True)
    ordered_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    tax_applies: Mapped[bool] = mapped_column(Boolean, default=False)
    change_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    supplier: Mapped[Supplier] = relationship()
    lines: Mapped[list["PurchaseOrderLine"]] = relationship(
        back_populates="purchase_order", cascade="all, delete-orphan"
    )
    receipts: Mapped[list["PurchaseReceipt"]] = relationship(back_populates="purchase_order")


class PurchaseOrderLine(Base):
    __tablename__ = "purchase_order_lines"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    purchase_order_id: Mapped[int] = mapped_column(ForeignKey("purchase_orders.id"), index=True)
    material_id: Mapped[int | None] = mapped_column(ForeignKey("materials.id"), nullable=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    quantity_ordered: Mapped[Decimal] = mapped_column(Numeric(14, 3))
    quantity_received: Mapped[Decimal] = mapped_column(Numeric(14, 3), default=0)
    unit: Mapped[str | None] = mapped_column(String(32), nullable=True)
    unit_price: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)

    purchase_order: Mapped[PurchaseOrder] = relationship(back_populates="lines")
    material: Mapped["Material | None"] = relationship()  # noqa: F821
    receipt_lines: Mapped[list["PurchaseReceiptLine"]] = relationship(back_populates="purchase_order_line")


class PurchaseReceipt(Base):
    __tablename__ = "purchase_receipts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    purchase_order_id: Mapped[int | None] = mapped_column(
        ForeignKey("purchase_orders.id"), nullable=True, index=True
    )
    without_purchase_order: Mapped[bool] = mapped_column(Boolean, default=False)
    supplier_id: Mapped[int] = mapped_column(ForeignKey("suppliers.id"), index=True)
    supplier_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    invoice_number: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    purchase_order_reference: Mapped[str | None] = mapped_column(String(64), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    purchase_order: Mapped[PurchaseOrder | None] = relationship(back_populates="receipts")
    supplier: Mapped[Supplier] = relationship()
    lines: Mapped[list["PurchaseReceiptLine"]] = relationship(
        back_populates="purchase_receipt", cascade="all, delete-orphan"
    )


class PurchaseReceiptLine(Base):
    __tablename__ = "purchase_receipt_lines"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    purchase_receipt_id: Mapped[int] = mapped_column(ForeignKey("purchase_receipts.id"), index=True)
    purchase_order_line_id: Mapped[int | None] = mapped_column(
        ForeignKey("purchase_order_lines.id"), nullable=True, index=True
    )
    material_id: Mapped[int] = mapped_column(ForeignKey("materials.id"), index=True)
    item_type: Mapped[str] = mapped_column(String(32))
    quantity: Mapped[Decimal] = mapped_column(Numeric(14, 3))
    unit: Mapped[str] = mapped_column(String(32), default="kg")
    micras: Mapped[Decimal | None] = mapped_column(Numeric(14, 3), nullable=True)
    ancho_mm: Mapped[Decimal | None] = mapped_column(Numeric(14, 3), nullable=True)

    purchase_receipt: Mapped[PurchaseReceipt] = relationship(back_populates="lines")
    purchase_order_line: Mapped[PurchaseOrderLine | None] = relationship(back_populates="receipt_lines")
    material: Mapped["Material"] = relationship()  # noqa: F821


class ProductionBatch(Base):
    __tablename__ = "production_batches"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    client_orders: Mapped[list["ClientOrder"]] = relationship(back_populates="batch")


class ClientOrder(Base):
    __tablename__ = "client_orders"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    batch_id: Mapped[int | None] = mapped_column(
        ForeignKey("production_batches.id"), nullable=True, index=True
    )
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), index=True)
    code: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    status: Mapped[str] = mapped_column(String(32), default="open")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    ordered_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    sale_for: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    batch: Mapped["ProductionBatch | None"] = relationship(back_populates="client_orders")
    client: Mapped[Client] = relationship(back_populates="orders")
    lines: Mapped[list["ClientOrderLine"]] = relationship(
        back_populates="client_order", cascade="all, delete-orphan"
    )
    work_orders: Mapped[list["WorkOrder"]] = relationship(back_populates="client_order")


class ClientOrderLine(Base):
    __tablename__ = "client_order_lines"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    client_order_id: Mapped[int] = mapped_column(ForeignKey("client_orders.id"), index=True)
    product_id: Mapped[int | None] = mapped_column(ForeignKey("products.id"), nullable=True)
    material_id: Mapped[int | None] = mapped_column(ForeignKey("materials.id"), nullable=True)
    quantity: Mapped[Decimal] = mapped_column(Numeric(14, 3))
    unit: Mapped[str | None] = mapped_column(String(32), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    client_order: Mapped[ClientOrder] = relationship(back_populates="lines")
    product: Mapped[Product | None] = relationship()


class WorkOrder(Base):
    __tablename__ = "work_orders"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    client_order_id: Mapped[int] = mapped_column(ForeignKey("client_orders.id"), index=True)
    client_order_line_id: Mapped[int | None] = mapped_column(
        ForeignKey("client_order_lines.id"), nullable=True, index=True
    )
    code: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    status: Mapped[str] = mapped_column(String(32), default="open")
    board_stage: Mapped[str] = mapped_column(String(32), default="nueva", index=True)
    scheduling_status: Mapped[str] = mapped_column(String(32), default="scheduled")
    production_route: Mapped[str | None] = mapped_column(String(32), nullable=True, index=True)
    document_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    product_id: Mapped[int | None] = mapped_column(ForeignKey("products.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    client_order: Mapped[ClientOrder] = relationship(back_populates="work_orders")
    client_order_line: Mapped["ClientOrderLine | None"] = relationship()
    product: Mapped[Product | None] = relationship()


class TintaMixture(Base):
    __tablename__ = "tinta_mixtures"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    work_order_id: Mapped[int | None] = mapped_column(ForeignKey("work_orders.id"), index=True)
    output_sku: Mapped[str] = mapped_column(String(128))
    output_name: Mapped[str] = mapped_column(String(255))
    output_inventory_area: Mapped[str | None] = mapped_column(String(64), nullable=True)
    output_tinta_subarea: Mapped[str | None] = mapped_column(String(64), nullable=True)
    unit: Mapped[str | None] = mapped_column(String(16), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    creator_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    mixture_kind: Mapped[str] = mapped_column(String(32), default="manual", index=True)
    parent_mixture_id: Mapped[int | None] = mapped_column(
        ForeignKey("tinta_mixtures.id"), nullable=True, index=True
    )
    material_request_id: Mapped[int | None] = mapped_column(
        ForeignKey("material_requests.id"), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    work_order: Mapped[WorkOrder | None] = relationship()
    parent_mixture: Mapped["TintaMixture | None"] = relationship(
        "TintaMixture", remote_side="TintaMixture.id", foreign_keys=[parent_mixture_id]
    )
    components: Mapped[list["TintaMixtureComponent"]] = relationship(
        back_populates="mixture", cascade="all, delete-orphan"
    )


class TintaMixtureComponent(Base):
    __tablename__ = "tinta_mixture_components"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    tinta_mixture_id: Mapped[int] = mapped_column(ForeignKey("tinta_mixtures.id"), index=True)
    material_id: Mapped[int] = mapped_column(ForeignKey("materials.id"), index=True)
    quantity: Mapped[Decimal] = mapped_column(Numeric(14, 3))

    mixture: Mapped[TintaMixture] = relationship(back_populates="components")
    material: Mapped["Material"] = relationship()  # noqa: F821


class MaterialRequest(Base):
    __tablename__ = "material_requests"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    status: Mapped[str] = mapped_column(String(32), default="pending", index=True)
    originating_area: Mapped[str | None] = mapped_column(String(64), nullable=True)
    destination_areas: Mapped[list | None] = mapped_column(JSON, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    document_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    work_order_id: Mapped[int | None] = mapped_column(ForeignKey("work_orders.id"), index=True)
    authorized_by: Mapped[int | None] = mapped_column(nullable=True)
    kg_authorized: Mapped[Decimal | None] = mapped_column(Numeric(14, 3), nullable=True)
    kg_dispatched: Mapped[Decimal | None] = mapped_column(Numeric(14, 3), nullable=True)
    kg_remaining: Mapped[Decimal | None] = mapped_column(Numeric(14, 3), nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    counter_proposal_lines: Mapped[list | None] = mapped_column(JSON, nullable=True)
    requester_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    request_flow: Mapped[str] = mapped_column(String(32), default="outbound", index=True)
    is_replenishment: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    work_order: Mapped[WorkOrder | None] = relationship()
    lines: Mapped[list["MaterialRequestLine"]] = relationship(
        back_populates="material_request", cascade="all, delete-orphan"
    )
    area_request: Mapped["AreaRequest | None"] = relationship(back_populates="material_request")


class MaterialRequestLine(Base):
    __tablename__ = "material_request_lines"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    material_request_id: Mapped[int] = mapped_column(ForeignKey("material_requests.id"), index=True)
    material_id: Mapped[int | None] = mapped_column(ForeignKey("materials.id"), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    quantity_requested: Mapped[Decimal] = mapped_column(Numeric(14, 3))
    quantity_dispatched: Mapped[Decimal] = mapped_column(Numeric(14, 3), default=0)
    unit: Mapped[str | None] = mapped_column(String(32), nullable=True)

    material_request: Mapped[MaterialRequest] = relationship(back_populates="lines")
    material: Mapped["Material | None"] = relationship()  # noqa: F821


class AreaRequest(Base):
    __tablename__ = "area_requests"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    area: Mapped[str] = mapped_column(String(64), default="almacen", index=True)
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="pending", index=True)
    material_request_id: Mapped[int] = mapped_column(ForeignKey("material_requests.id"), index=True)
    work_order_id: Mapped[int | None] = mapped_column(ForeignKey("work_orders.id"), nullable=True)
    requester_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    insumos_origin: Mapped[str] = mapped_column(String(32), default="manual")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    material_request: Mapped[MaterialRequest] = relationship(back_populates="area_request")
    work_order: Mapped["WorkOrder | None"] = relationship(foreign_keys=[work_order_id])


class ExtrusionRun(Base):
    __tablename__ = "extrusion_runs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    work_order_id: Mapped[int] = mapped_column(ForeignKey("work_orders.id"), index=True)
    reassigned_work_order_id: Mapped[int | None] = mapped_column(
        ForeignKey("work_orders.id"), nullable=True, index=True
    )
    mixture_source_work_order_id: Mapped[int | None] = mapped_column(
        ForeignKey("work_orders.id"), nullable=True, index=True
    )
    shift: Mapped[str] = mapped_column(String(32), default="sesion")
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    recorded_date: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    effective_minutes: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    total_effective_minutes: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    machine: Mapped[str | None] = mapped_column(String(128), nullable=True)
    production_format: Mapped[str | None] = mapped_column(String(64), nullable=True)
    target_kg: Mapped[Decimal | None] = mapped_column(Numeric(14, 3), nullable=True)
    total_kg: Mapped[Decimal] = mapped_column(Numeric(14, 3), default=0)
    bolsones_kg: Mapped[Decimal] = mapped_column(Numeric(14, 3), default=0)
    fallas_kg: Mapped[Decimal] = mapped_column(Numeric(14, 3), default=0)
    core_kg: Mapped[Decimal] = mapped_column(Numeric(14, 3), default=0)
    status: Mapped[str] = mapped_column(String(32), default="completed", index=True)
    mixture_production_run_id: Mapped[int | None] = mapped_column(
        ForeignKey("mixture_production_runs.id"), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    work_order: Mapped[WorkOrder] = relationship(foreign_keys=[work_order_id])
    reassigned_work_order: Mapped[WorkOrder | None] = relationship(foreign_keys=[reassigned_work_order_id])
    mixture_source_work_order: Mapped[WorkOrder | None] = relationship(
        foreign_keys=[mixture_source_work_order_id]
    )
    segments: Mapped[list["ExtrusionShiftSegment"]] = relationship(
        back_populates="extrusion_run", cascade="all, delete-orphan", order_by="ExtrusionShiftSegment.id"
    )
    coils: Mapped[list["ExtrusionCoil"]] = relationship(
        back_populates="extrusion_run", cascade="all, delete-orphan"
    )
    waste_lines: Mapped[list["ExtrusionWaste"]] = relationship(
        back_populates="extrusion_run", cascade="all, delete-orphan"
    )


class ExtrusionShiftSegment(Base):
    __tablename__ = "extrusion_shift_segments"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    extrusion_run_id: Mapped[int] = mapped_column(ForeignKey("extrusion_runs.id"), index=True)
    shift: Mapped[str] = mapped_column(String(32))
    operator_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    effective_minutes: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    production_format: Mapped[str | None] = mapped_column(String(64), nullable=True)
    machine: Mapped[str | None] = mapped_column(String(128), nullable=True)
    total_kg: Mapped[Decimal] = mapped_column(Numeric(14, 3), default=0)
    bolsones_kg: Mapped[Decimal] = mapped_column(Numeric(14, 3), default=0)
    fallas_kg: Mapped[Decimal] = mapped_column(Numeric(14, 3), default=0)
    core_kg: Mapped[Decimal] = mapped_column(Numeric(14, 3), default=0)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    extrusion_run: Mapped[ExtrusionRun] = relationship(back_populates="segments")
    coils: Mapped[list["ExtrusionCoil"]] = relationship(
        back_populates="segment", cascade="all, delete-orphan"
    )
    waste_lines: Mapped[list["ExtrusionWaste"]] = relationship(
        back_populates="segment", cascade="all, delete-orphan"
    )


class ExtrusionCoil(Base):
    __tablename__ = "extrusion_coils"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    extrusion_run_id: Mapped[int] = mapped_column(ForeignKey("extrusion_runs.id"), index=True)
    segment_id: Mapped[int | None] = mapped_column(
        ForeignKey("extrusion_shift_segments.id"), nullable=True, index=True
    )
    microns: Mapped[list] = mapped_column(JSON)
    kg: Mapped[Decimal] = mapped_column(Numeric(14, 3))
    coil_code: Mapped[str | None] = mapped_column(String(64), nullable=True, unique=True)
    pallet_id: Mapped[int | None] = mapped_column(ForeignKey("dispatch_pallets.id"), nullable=True)
    dispatch_shift: Mapped[str | None] = mapped_column(String(32), nullable=True)

    extrusion_run: Mapped[ExtrusionRun] = relationship(back_populates="coils")
    segment: Mapped["ExtrusionShiftSegment | None"] = relationship(back_populates="coils")


class ExtrusionWaste(Base):
    __tablename__ = "extrusion_waste"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    extrusion_run_id: Mapped[int] = mapped_column(ForeignKey("extrusion_runs.id"), index=True)
    segment_id: Mapped[int | None] = mapped_column(
        ForeignKey("extrusion_shift_segments.id"), nullable=True, index=True
    )
    waste_type: Mapped[str] = mapped_column(String(32))
    waste_kg: Mapped[Decimal] = mapped_column(Numeric(14, 3))

    extrusion_run: Mapped[ExtrusionRun] = relationship(back_populates="waste_lines")
    segment: Mapped["ExtrusionShiftSegment | None"] = relationship(back_populates="waste_lines")


class InventoryReturn(Base):
    __tablename__ = "inventory_returns"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    material_id: Mapped[int | None] = mapped_column(ForeignKey("materials.id"), nullable=True, index=True)
    work_order_id: Mapped[int | None] = mapped_column(ForeignKey("work_orders.id"), nullable=True, index=True)
    extrusion_run_id: Mapped[int | None] = mapped_column(
        ForeignKey("extrusion_runs.id"), nullable=True, index=True
    )
    extrusion_coil_id: Mapped[int | None] = mapped_column(
        ForeignKey("extrusion_coils.id"), nullable=True, index=True
    )
    product_type: Mapped[str | None] = mapped_column(String(32), nullable=True)
    shift: Mapped[str | None] = mapped_column(String(32), nullable=True)
    quantity_units: Mapped[int | None] = mapped_column(nullable=True)
    destination_area: Mapped[str] = mapped_column(String(64), index=True)
    quantity: Mapped[Decimal] = mapped_column(Numeric(14, 3))
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="pending", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    material: Mapped["Material | None"] = relationship()  # noqa: F821
    work_order: Mapped[WorkOrder | None] = relationship()
    extrusion_run: Mapped[ExtrusionRun | None] = relationship()
    extrusion_coil: Mapped["ExtrusionCoil | None"] = relationship()


class MixtureProductionRun(Base):
    __tablename__ = "mixture_production_runs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    tinta_mixture_id: Mapped[int] = mapped_column(ForeignKey("tinta_mixtures.id"), index=True)
    work_order_id: Mapped[int] = mapped_column(ForeignKey("work_orders.id"), index=True)
    status: Mapped[str] = mapped_column(String(32), default="in_progress")
    fully_used: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    remaining_kg: Mapped[Decimal | None] = mapped_column(Numeric(14, 3), nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    used_in_work_order_id: Mapped[int | None] = mapped_column(ForeignKey("work_orders.id"), nullable=True)
    produced_kg: Mapped[Decimal | None] = mapped_column(Numeric(14, 3), nullable=True)
    extrusion_run_id: Mapped[int | None] = mapped_column(ForeignKey("extrusion_runs.id"), nullable=True)
    inbound_material_request_id: Mapped[int | None] = mapped_column(
        ForeignKey("material_requests.id"), nullable=True
    )
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    mixture: Mapped[TintaMixture] = relationship(foreign_keys=[tinta_mixture_id])
    work_order: Mapped[WorkOrder] = relationship(foreign_keys=[work_order_id])
    used_in_work_order: Mapped[WorkOrder | None] = relationship(foreign_keys=[used_in_work_order_id])
    extrusion_run: Mapped["ExtrusionRun | None"] = relationship(foreign_keys=[extrusion_run_id])


class SealingRun(Base):
    __tablename__ = "sealing_runs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    work_order_id: Mapped[int] = mapped_column(ForeignKey("work_orders.id"), index=True)
    shift: Mapped[str] = mapped_column(String(32))
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    recorded_date: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    effective_minutes: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    total_units: Mapped[Decimal] = mapped_column(Numeric(14, 3), default=0)
    waste_kg: Mapped[Decimal] = mapped_column(Numeric(14, 3), default=0)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="completed", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    work_order: Mapped[WorkOrder] = relationship()
    bobina_lines: Mapped[list["SealingBobinaLine"]] = relationship(
        back_populates="sealing_run", cascade="all, delete-orphan"
    )


class SealingBobinaLine(Base):
    __tablename__ = "sealing_bobina_lines"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    sealing_run_id: Mapped[int] = mapped_column(ForeignKey("sealing_runs.id"), index=True)
    extrusion_coil_id: Mapped[int | None] = mapped_column(
        ForeignKey("extrusion_coils.id"), nullable=True, index=True
    )
    coil_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    measure: Mapped[str | None] = mapped_column(String(128), nullable=True)
    units: Mapped[Decimal] = mapped_column(Numeric(14, 3))
    production_kg: Mapped[Decimal | None] = mapped_column(Numeric(14, 3), nullable=True)
    waste_kg: Mapped[Decimal] = mapped_column(Numeric(14, 3), default=0)

    sealing_run: Mapped[SealingRun] = relationship(back_populates="bobina_lines")
    extrusion_coil: Mapped["ExtrusionCoil | None"] = relationship()


class DispatchPallet(Base):
    __tablename__ = "dispatch_pallets"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(64), unique=True)
    pallet_number: Mapped[int | None] = mapped_column(nullable=True, index=True)
    dispatch_batch_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    total_kg: Mapped[Decimal] = mapped_column(Numeric(14, 3), default=0)
    client_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    destination: Mapped[str | None] = mapped_column(String(255), nullable=True)
    product_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    measurements: Mapped[str | None] = mapped_column(String(128), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    coils: Mapped[list[ExtrusionCoil]] = relationship()


class BolsonesDispatchShipment(Base):
    __tablename__ = "bolsones_dispatch_shipments"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    work_order_id: Mapped[int | None] = mapped_column(ForeignKey("work_orders.id"), nullable=True, index=True)
    manual_entry_id: Mapped[int | None] = mapped_column(
        ForeignKey("bolsones_manual_entries.id"), nullable=True, index=True
    )
    measure: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    kg: Mapped[Decimal] = mapped_column(Numeric(14, 3))
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    work_order: Mapped[WorkOrder | None] = relationship()
    manual_entry: Mapped["BolsonesManualEntry | None"] = relationship()


class BolsonesManualEntry(Base):
    __tablename__ = "bolsones_manual_entries"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    work_order_id: Mapped[int | None] = mapped_column(ForeignKey("work_orders.id"), nullable=True, index=True)
    description: Mapped[str] = mapped_column(String(255))
    measure: Mapped[str | None] = mapped_column(String(128), nullable=True)
    kg: Mapped[Decimal] = mapped_column(Numeric(14, 3))
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    work_order: Mapped[WorkOrder | None] = relationship()


class DesperdicioManualEntry(Base):
    __tablename__ = "desperdicio_manual_entries"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    work_order_id: Mapped[int | None] = mapped_column(ForeignKey("work_orders.id"), nullable=True, index=True)
    description: Mapped[str] = mapped_column(String(255))
    waste_type: Mapped[str | None] = mapped_column(String(32), nullable=True)
    kg: Mapped[Decimal] = mapped_column(Numeric(14, 3))
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    work_order: Mapped[WorkOrder | None] = relationship()


class DesperdicioDispatchShipment(Base):
    __tablename__ = "desperdicio_dispatch_shipments"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    work_order_id: Mapped[int | None] = mapped_column(ForeignKey("work_orders.id"), nullable=True, index=True)
    manual_entry_id: Mapped[int | None] = mapped_column(
        ForeignKey("desperdicio_manual_entries.id"), nullable=True, index=True
    )
    kg: Mapped[Decimal] = mapped_column(Numeric(14, 3))
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    work_order: Mapped[WorkOrder | None] = relationship()
    manual_entry: Mapped["DesperdicioManualEntry | None"] = relationship()


class BolsonesDispatchRelease(Base):
    __tablename__ = "bolsones_dispatch_releases"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    work_order_id: Mapped[int | None] = mapped_column(ForeignKey("work_orders.id"), nullable=True, index=True)
    manual_entry_id: Mapped[int | None] = mapped_column(
        ForeignKey("bolsones_manual_entries.id"), nullable=True, index=True
    )
    measure: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    kg: Mapped[Decimal] = mapped_column(Numeric(14, 3))
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    work_order: Mapped[WorkOrder | None] = relationship()
    manual_entry: Mapped["BolsonesManualEntry | None"] = relationship()


class DesperdicioDispatchRelease(Base):
    __tablename__ = "desperdicio_dispatch_releases"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    work_order_id: Mapped[int | None] = mapped_column(ForeignKey("work_orders.id"), nullable=True, index=True)
    manual_entry_id: Mapped[int | None] = mapped_column(
        ForeignKey("desperdicio_manual_entries.id"), nullable=True, index=True
    )
    kg: Mapped[Decimal] = mapped_column(Numeric(14, 3))
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    work_order: Mapped[WorkOrder | None] = relationship()
    manual_entry: Mapped["DesperdicioManualEntry | None"] = relationship()


class FallasManualEntry(Base):
    __tablename__ = "fallas_manual_entries"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    work_order_id: Mapped[int | None] = mapped_column(ForeignKey("work_orders.id"), nullable=True, index=True)
    description: Mapped[str] = mapped_column(String(255))
    kg: Mapped[Decimal] = mapped_column(Numeric(14, 3))
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    work_order: Mapped[WorkOrder | None] = relationship()


class FallasMaterialsShipment(Base):
    __tablename__ = "fallas_materials_shipments"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    work_order_id: Mapped[int | None] = mapped_column(ForeignKey("work_orders.id"), nullable=True, index=True)
    manual_entry_id: Mapped[int | None] = mapped_column(
        ForeignKey("fallas_manual_entries.id"), nullable=True, index=True
    )
    inventory_return_id: Mapped[int | None] = mapped_column(
        ForeignKey("inventory_returns.id"), nullable=True, index=True
    )
    kg: Mapped[Decimal] = mapped_column(Numeric(14, 3))
    status: Mapped[str] = mapped_column(String(32), default="pending", index=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    work_order: Mapped[WorkOrder | None] = relationship()
    manual_entry: Mapped["FallasManualEntry | None"] = relationship()
    inventory_return: Mapped["InventoryReturn | None"] = relationship()


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(32), default="administrador", index=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class PurchaseOrderCodeSequence(Base):
    __tablename__ = "purchase_order_code_sequences"

    year: Mapped[int] = mapped_column(primary_key=True)
    last_number: Mapped[int] = mapped_column(default=0)


# Import Material for relationship resolution
from modules.materials.models import Material  # noqa: E402, F401
