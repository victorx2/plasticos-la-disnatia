from sqlalchemy.orm import Session

from modules.auth.password import hash_password
from modules.production.models import Client, Product, User

DEFAULT_USERS: list[tuple[str, str, str, str, str]] = [
    ("admin", "password", "Administrador", "admin@dinastia.local", "administrador"),
    ("inventario", "inventario", "Inventario", "inventario@dinastia.local", "inventario"),
    ("produccion", "produccion", "Producción", "produccion@dinastia.local", "produccion"),
    ("despacho", "despacho", "Despacho", "despacho@dinastia.local", "despacho"),
    ("ordenes", "ordenes", "Órdenes de producción", "ordenes@dinastia.local", "produccion"),
]


def seed_users(db: Session) -> None:
    for username, password, name, email, role in DEFAULT_USERS:
        existing = db.query(User).filter(User.username == username).first()
        if existing:
            if existing.email and "@axones.local" in existing.email:
                existing.email = email
            continue
        db.add(
            User(
                username=username,
                password_hash=hash_password(password),
                name=name,
                email=email,
                role=role,
                active=True,
            )
        )
    db.commit()


def seed_demo_data(db: Session) -> None:
    seed_users(db)

    if db.query(Client).count() > 0:
        return
    client = Client(
        name="Cliente demo Santoni",
        rif="J-12345678-9",
        state="Portuguesa",
        city="Acarigua",
        address="Zona industrial",
        email="demo@example.com",
        phone="0255-0000000",
    )
    db.add(client)
    db.flush()
    product = Product(
        name="MICROPERFORADO 80X0.65",
        structure="50%3003+25%11PG1+25%DE ALTA",
        client_id=client.id,
    )
    db.add(product)
    db.commit()
