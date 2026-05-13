# models/anomaly.py
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest


def detect_anomalies(df: pd.DataFrame):
    # Vrais noms : 'realiseJour', 'prevuJour', 'ecartJour'
    features = df[["realiseJour", "prevuJour", "ecartJour"]].fillna(0)

    model = IsolationForest(
        contamination=0.1,
        random_state=42,
    )
    model.fit(features)

    df = df.copy()
    df["anomaly"] = model.predict(features)
    anomalies = df[df["anomaly"] == -1]

    results = []
    for _, row in anomalies.iterrows():
        results.append({
            "date":    str(row["date"]),
            "poste":   row["poste"],
            "mois":    row["mois"],
            "realise": float(row["realiseJour"]),
            "prevu":   float(row["prevuJour"]),
            "ecart":   float(row["ecartJour"]),
            "niveau":  _niveau(float(row["prevuJour"]), float(row["realiseJour"])),
        })

    return results


def _niveau(prevu: float, realise: float) -> str:
    if prevu == 0:
        return "INCONNU"
    ecart_pct = abs((realise - prevu) / prevu) * 100
    if ecart_pct <= 20:
        return "ATTENTION"
    elif ecart_pct <= 40:
        return "CRITIQUE"
    else:
        return "CRITIQUE"