#!/usr/bin/env python3
"""Ejecuta migraciones Alembic hasta head."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]


def main() -> int:
    result = subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=BACKEND,
        check=False,
    )
    if result.returncode == 0:
        print("Migraciones aplicadas: head")
    return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())
