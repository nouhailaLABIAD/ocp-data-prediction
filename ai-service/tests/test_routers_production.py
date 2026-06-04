from unittest.mock import patch

import pandas as pd

from routers.production import prediction_production


@patch("routers.production.predict_production")
@patch("routers.production.aggregate_production")
@patch("routers.production.load_production")
def test_get_prediction_production_happy_path(load_production_mock, aggregate_mock, predict_mock):
    df = pd.DataFrame([
        {"mois": "Janvier", "activite": "A", "prevuT": 100, "realiseT": 110},
    ])
    load_production_mock.return_value = df

    monthly = pd.DataFrame([
        {"mois": "Janvier", "activite": "A", "prevu_total": 100, "tonnage_realise": 110, "ecart": 10, "taux": 110},
    ])
    aggregate_mock.return_value = monthly
    predict_mock.return_value = [{"mois": "Mars", "activite": "A", "tonnage_prevu": 120.0}]

    res = prediction_production()

    load_production_mock.assert_called_once()
    aggregate_mock.assert_called_once_with(df)
    predict_mock.assert_called_once_with(monthly)
    assert res["type"] == "production"
    assert res["predictions"] == predict_mock.return_value


@patch("routers.production.predict_production")
@patch("routers.production.aggregate_production")
@patch("routers.production.load_production")
def test_get_prediction_production_returns_empty_when_predict_returns_empty(load_production_mock, aggregate_mock, predict_mock):
    load_production_mock.return_value = pd.DataFrame([])
    aggregate_mock.return_value = pd.DataFrame([])
    predict_mock.return_value = []

    res = prediction_production()
    assert res["type"] == "production"
    assert res["predictions"] == []


@patch("routers.production.load_production")
def test_get_prediction_production_propagates_load_error(load_production_mock):
    load_production_mock.side_effect = RuntimeError("db error")
    try:
        prediction_production()
        assert False, "should have raised"
    except RuntimeError as e:
        assert "db error" in str(e)

