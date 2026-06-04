# services/aggregation.py
import pandas as pd


def aggregate_production(df: pd.DataFrame) -> pd.DataFrame:
    # Vrais noms : 'prevuT', 'realiseT'
    monthly = (
        df.groupby(["mois", "activite"])
        .agg(
            prevu_total=("prevuT", "sum"),
            tonnage_realise=("realiseT", "sum"),
        )
        .reset_index()
    )
    monthly["ecart"] = monthly["tonnage_realise"] - monthly["prevu_total"]
    monthly["taux"]  = (
        monthly["tonnage_realise"] /
        monthly["prevu_total"].replace(0, 1)
    ) * 100
    return monthly


def aggregate_charges(df: pd.DataFrame) -> pd.DataFrame:
    # Vrais noms : 'prevuJour', 'realiseJour'
    monthly = (
        df.groupby(["mois", "poste"])
        .agg(
            prevu_total=("prevuJour", "sum"),
            cout_total=("realiseJour", "sum"),
        )
        .reset_index()
    )
    monthly["ecart"] = monthly["cout_total"] - monthly["prevu_total"]
    monthly["taux"]  = (
        monthly["cout_total"] /
        monthly["prevu_total"].replace(0, 1)
    ) * 100
    return monthly