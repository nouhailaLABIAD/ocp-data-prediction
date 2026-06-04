from unittest.mock import patch

import pandas as pd

from routers.prediction import prediction_charges


@patch("routers.prediction.predict_charges")
@patch("routers.prediction.aggregate_charges")
@patch("routers.prediction.load_charges")
def test_get_prediction_charges_happy_path(load_charges_mock, aggregate_mock, predict_mock):
    df = pd.DataFrame([
        {"mois": "Janvier", "poste": "Energie", "prevuJour": 10, "realiseJour": 12, "ecartJour": 2},
    ])
    load_charges_mock.return_value = df
    monthly = pd.DataFrame([
        {"mois": "Janvier", "poste": "Energie", "prevu_total": 10, "cout_total": 12, "ecart": 2, "taux": 120},
    ])
    aggregate_mock.return_value = monthly
    predict_mock.return_value = [{"mois": "Mars", "poste": "Energie", "cout_prevu": 15.0}]

    res = prediction_charges()

    load_charges_mock.assert_called_once()
    aggregate_mock.assert_called_once_with(df)
    predict_mock.assert_called_once_with(monthly)
    assert res["type"] == "charges"
    assert res["predictions"] == predict_mock.return_value


@patch("routers.prediction.predict_charges")
@patch("routers.prediction.aggregate_charges")
@patch("routers.prediction.load_charges")
def test_get_prediction_charges_returns_empty_predictions_when_predict_returns_empty(load_charges_mock, aggregate_mock, predict_mock):
    load_charges_mock.return_value = pd.DataFrame([])
    aggregate_mock.return_value = pd.DataFrame([])
    predict_mock.return_value = []

    res = prediction_charges()
    assert res["type"] == "charges"
    assert res["predictions"] == []


@patch("routers.prediction.load_charges")
def test_get_prediction_charges_propagates_load_charges_error(load_charges_mock):
    load_charges_mock.side_effect = RuntimeError("db error")

    try:
        prediction_charges()
        assert False, "should have raised"
    except RuntimeError as e:
        assert "db error" in str(e)

