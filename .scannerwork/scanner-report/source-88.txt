from unittest.mock import patch

import pandas as pd

from routers.anomalie import anomalies


@patch("routers.anomalie.detect_anomalies")
@patch("routers.anomalie.load_charges")
def test_get_anomalies_calls_load_and_detect(load_charges_mock, detect_mock):
    df = pd.DataFrame([
        {"date": "2024-01-01", "poste": "Energie", "mois": "Janvier", "realiseJour": 10, "prevuJour": 8, "ecartJour": 2},
    ])
    load_charges_mock.return_value = df
    detect_mock.return_value = [
        {"date": "2024-01-01", "poste": "Energie", "mois": "Janvier", "realise": 10.0, "prevu": 8.0, "ecart": 2.0, "niveau": "CRITIQUE"}
    ]

    res = anomalies()

    load_charges_mock.assert_called_once()
    detect_mock.assert_called_once_with(df)
    assert res["total"] == 1
    assert len(res["anomalies"]) == 1


@patch("routers.anomalie.detect_anomalies")
@patch("routers.anomalie.load_charges")
def test_get_anomalies_returns_empty_when_detect_returns_empty(load_charges_mock, detect_mock):
    load_charges_mock.return_value = pd.DataFrame([])
    detect_mock.return_value = []

    res = anomalies()

    assert res == {"total": 0, "anomalies": []}


@patch("routers.anomalie.load_charges")
def test_get_anomalies_propagates_load_charges_error(load_charges_mock):
    load_charges_mock.side_effect = RuntimeError("db error")

    try:
        anomalies()
        assert False, "should have raised"
    except RuntimeError as e:
        assert "db error" in str(e)

