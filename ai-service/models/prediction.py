# models/prediction.py
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression

MOIS_ORDER = {
    "Janvier": 1, "Février": 2, "Mars": 3,
    "Avril": 4,   "Mai": 5,     "Juin": 6,
    "Juillet": 7, "Août": 8,    "Septembre": 9,
    "Octobre": 10,"Novembre": 11,"Décembre": 12,
}
MOIS_NAMES = {v: k for k, v in MOIS_ORDER.items()}


def predict_charges(df: pd.DataFrame):
    required = {"mois", "poste", "cout_total"}
    missing = required - set(df.columns)
    if missing:
        raise KeyError(f"Missing columns: {sorted(missing)}")

    df = df.copy()
    df["mois_num"] = df["mois"].map(MOIS_ORDER)
    df = df.sort_values("mois_num")


    # ── Prédiction par poste
    postes = df["poste"].unique()
    predictions = []

    for poste in postes:
        df_poste = df[df["poste"] == poste].copy()

        if len(df_poste) < 2:
            continue

        X = df_poste[["mois_num"]].values
        y = df_poste["cout_total"].values       # ← colonne maintenant correcte

        model = LinearRegression()
        model.fit(X, y)

        last_month = int(df_poste["mois_num"].max())

        for month in range(last_month + 1, 13):
            pred = float(model.predict([[month]])[0])
            predictions.append({
                "mois":       MOIS_NAMES[month],
                "poste":      poste,
                "cout_prevu": round(max(pred, 0), 2),
            })

    return predictions