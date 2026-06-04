import pandas as pd
import pytest

from models.production_prediction import predict_production


def test_predict_production_returns_empty_when_only_one_point_per_activite():
    df = pd.DataFrame(
        [
            {"mois": "Janvier", "activite": "Creusement", "tonnage_realise": 1000},
        ]
    )
    assert predict_production(df) == []


def test_predict_production_predicts_months_after_last_month_for_each_activite():
    df = pd.DataFrame(
        [
            {"mois": "Janvier", "activite": "A", "tonnage_realise": 10},
            {"mois": "Février", "activite": "A", "tonnage_realise": 20},
            {"mois": "Janvier", "activite": "B", "tonnage_realise": 5},
            {"mois": "Février", "activite": "B", "tonnage_realise": 7},
        ]
    )
    res = predict_production(df)

    # last_month=2 => predictions mois 3..12 => 10 per activite => 20
    assert len(res) == 20
    assert all("mois" in r and "activite" in r and "tonnage_prevu" in r for r in res)
    assert {r["activite"] for r in res} == {"A", "B"}


def test_predict_production_clamps_negative_predictions_to_zero():
    df = pd.DataFrame(
        [
            {"mois": "Janvier", "activite": "A", "tonnage_realise": 10},
            {"mois": "Février", "activite": "A", "tonnage_realise": -5},
        ]
    )
    res = predict_production(df)
    assert len(res) > 0
    assert all(r["tonnage_prevu"] >= 0 for r in res)


def test_predict_production_raises_keyerror_when_missing_required_columns():
    df = pd.DataFrame([
        {"mois": "Janvier", "activite": "A"}
    ])
    with pytest.raises(KeyError):
        predict_production(df)


def test_predict_production_handles_unsorted_input_and_returns_valid_month_names():
    df = pd.DataFrame(
        [
            {"mois": "Mars", "activite": "A", "tonnage_realise": 30},
            {"mois": "Janvier", "activite": "A", "tonnage_realise": 10},
            {"mois": "Février", "activite": "A", "tonnage_realise": 20},
        ]
    )
    res = predict_production(df)
    # last_month=3 => months 4..12 => 9
    assert len(res) == 9
    assert set(r["mois"] for r in res).issubset({
        "Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"
    })

