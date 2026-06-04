import pandas as pd
import pytest

from models.anomaly import detect_anomalies, _niveau


def test_niveau_inconnu_si_prevud_zero():
    assert _niveau(0, 123.0) == "INCONNU"


def test_niveau_attention_20pct():
    # prevu=100 realise=80 => ecart = 20%
    assert _niveau(100.0, 80.0) == "ATTENTION"


def test_niveau_critique_40pct():
    # prevu=100 realise=60 => ecart = 40%
    assert _niveau(100.0, 60.0) == "CRITIQUE"


def test_detect_anomalies_typical_returns_list_of_dicts():
    # Données: plusieurs lignes avec ecart
    df = pd.DataFrame(
        [
            {"date": "2024-01-01", "poste": "Energie", "mois": "Janvier", "realiseJour": 100, "prevuJour": 90, "ecartJour": 10},
            {"date": "2024-01-02", "poste": "Energie", "mois": "Janvier", "realiseJour": 110, "prevuJour": 95, "ecartJour": 15},
            {"date": "2024-01-03", "poste": "Maintenance", "mois": "Janvier", "realiseJour": 50, "prevuJour": 50, "ecartJour": 0},
            {"date": "2024-01-04", "poste": "Maintenance", "mois": "Janvier", "realiseJour": 20, "prevuJour": 50, "ecartJour": -30},
        ]
    )

    results = detect_anomalies(df)
    assert isinstance(results, list)
    # Chaque item doit contenir les clés attendues
    for item in results:
        assert set(item.keys()) == {"date", "poste", "mois", "realise", "prevu", "ecart", "niveau"}


def test_detect_anomalies_empty_dataframe_returns_empty_list():
    df = pd.DataFrame(
        columns=["date", "poste", "mois", "realiseJour", "prevuJour", "ecartJour"]
    )
    with pytest.raises(ValueError):
        # IsolationForest ne peut pas être entraîné sur 0 échantillon
        detect_anomalies(df)


def test_detect_anomalies_missing_columns_raises_keyerror():
    df = pd.DataFrame(
        [
            {"date": "2024-01-01", "poste": "Energie", "mois": "Janvier", "realiseJour": 10, "prevuJour": 5},
        ]
    )
    with pytest.raises(KeyError):
        detect_anomalies(df)

