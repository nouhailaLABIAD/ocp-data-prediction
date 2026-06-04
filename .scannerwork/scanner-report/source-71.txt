# database.py

import pandas as pd

try:
    from sqlalchemy import create_engine, text
    from sqlalchemy.orm import sessionmaker
except ModuleNotFoundError:  # pragma: no cover (tests fallback)
    create_engine = None
    text = None
    sessionmaker = None


# ─────────────────────────────────────────────
# Connexion PostgreSQL
# ─────────────────────────────────────────────

DB_URL = "postgresql+psycopg2://postgres:1234@localhost:5432/ocp_prediction"

if create_engine is not None and sessionmaker is not None:
    engine = create_engine(DB_URL)

    SessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine
    )
else:
    engine = None
    SessionLocal = None


# ─────────────────────────────────────────────
# Session DB
# ─────────────────────────────────────────────

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ─────────────────────────────────────────────
# LOAD CHARGES
# ─────────────────────────────────────────────

def load_charges(mois: str = None, annee: int = None) -> pd.DataFrame:

    query = """
        SELECT
            pc.date,
            pc.mois,
            pc.categorie,
            pc.poste,

            pc."prevuJour",
            pc."realiseJour",
            pc."ecartJour",
            pc."tauxRP",
            pc."cumulPrevu",
            pc."cumulRealise",

            fe.annee

        FROM poste_charge pc

        JOIN fichier_excel fe
        ON pc."fichierId" = fe.id

        WHERE 1=1
    """

    params = {}

    if mois:
        query += " AND pc.mois = :mois"
        params["mois"] = mois

    if annee:
        query += " AND fe.annee = :annee"
        params["annee"] = annee

    query += " ORDER BY pc.date, pc.poste"

    with engine.connect() as conn:
        df = pd.read_sql(
            text(query),
            conn,
            params=params
        )

    return df

# ─────────────────────────────────────────────
# LOAD PRODUCTION
# ─────────────────────────────────────────────

def load_production(mois: str = None, annee: int = None) -> pd.DataFrame:

    query = """
        SELECT
            dp.date,
            dp.mois,
            dp.activite,
            dp.zone,

            dp."prevuT",
            dp."realiseT",
            dp."tauxRP",
            dp."cumulPrevuT",
            dp."cumulRealiseT",

            fe.annee

        FROM donnee_production dp

        JOIN fichier_excel fe
        ON dp."fichierId" = fe.id

        WHERE 1=1
    """

    params = {}

    if mois:
        query += " AND dp.mois = :mois"
        params["mois"] = mois

    if annee:
        query += " AND fe.annee = :annee"
        params["annee"] = annee

    query += " ORDER BY dp.date, dp.activite"

    with engine.connect() as conn:
        df = pd.read_sql(
            text(query),
            conn,
            params=params
        )

    return df