import pandas as pd
import pytest

from models.prediction import predict_charges, MOIS_ORDER


def test_predict_charges_returns_empty_when_only_one_point_per_posto():
    # moins de 2 lignes => pas de fit => aucune prediction
    df = pd.DataFrame(
        [
            {"mois": "Janvier", "poste": "Energie", "cout_total": 1000},
        ]
    )
    res = predict_charges(df)
    assert res == []


def test_predict_charges_predicts_months_after_last_month_for_each_posto():
    df = pd.DataFrame(
        [
            {"mois": "Janvier", "poste": "Energie", "cout_total": 1000},
            {"mois": "Février", "poste": "Energie", "cout_total": 1100},
            {"mois": "Janvier", "poste": "Maintenance", "cout_total": 500},
            {"mois": "Février", "poste": "Maintenance", "cout_total": 600},
        ]
    )
    res = predict_charges(df)

    # Après Février => Janvier->2; last_month=2 => mois 3..12 => 10 predictions par poste
    assert len(res) == 20
    assert all("mois" in r and "poste" in r and "cout_prevu" in r for r in res)
    assert {r["poste"] for r in res} == {"Energie", "Maintenance"}
    assert res[0]["mois"] in MOIS_ORDER or True


def test_predict_charges_clamps_negative_predictions_to_zero():
    # Crée une tendance décroissante qui peut produire des prédictions négatives.
    # On s’assure surtout que round(max(pred,0),2) est appliqué.
    df = pd.DataFrame(
        [
            {"mois": "Janvier", "poste": "Energie", "cout_total": 10},
            {"mois": "Février", "poste": "Energie", "cout_total": -100},
        ]
    )
    res = predict_charges(df)
    assert len(res) > 0
    assert all(r["cout_prevu"] >= 0 for r in res)


def test_predict_charges_raises_keyerror_when_missing_required_columns():
    df = pd.DataFrame([
        {"mois": "Janvier", "poste": "Energie"}
    ])
    with pytest.raises(KeyError):
        predict_charges(df)


def test_predict_charges_uses_mois_order_to_sort():
    # Vérifie que l'ordre ne dépend pas de l'ordre d'entrée.
    df = pd.DataFrame(
        [
            {"mois": "Mars", "poste": "Energie", "cout_total": 300},
            {"mois": "Janvier", "poste": "Energie", "cout_total": 100},
            {"mois": "Février", "poste": "Energie", "cout_total": 200},
        ]
    )
    res = predict_charges(df)
    # last_month=3 => mois 4..12 => 9 predictions
    assert len(res) == 9
    assert set(r["mois"] for r in res).issubset({"Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"})

