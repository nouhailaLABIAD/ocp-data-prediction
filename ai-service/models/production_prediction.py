# models/production_prediction.py
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from models.prediction import MOIS_ORDER, MOIS_NAMES


def predict_production(df: pd.DataFrame):
    df = df.copy()
    df["mois_num"] = df["mois"].map(MOIS_ORDER)
    df = df.sort_values("mois_num")

    # ── Prédiction par activité
    activites = df["activite"].unique()
    predictions = []

    for activite in activites:
        df_act = df[df["activite"] == activite].copy()

        if len(df_act) < 2:
            continue

        X = df_act[["mois_num"]].values
        y = df_act["tonnage_realise"].values     # ← colonne maintenant correcte

        model = LinearRegression()
        model.fit(X, y)

        last_month = int(df_act["mois_num"].max())

        for month in range(last_month + 1, 13):
            pred = float(model.predict([[month]])[0])
            predictions.append({
                "mois":          MOIS_NAMES[month],
                "activite":      activite,
                "tonnage_prevu": round(max(pred, 0), 2),
            })

    return predictions