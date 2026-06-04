import pandas as pd
import pytest

from services.aggregation import aggregate_charges, aggregate_production


def test_aggregate_charges_groups_by_mois_and_poste_and_computes_ecart_and_taux():
    df = pd.DataFrame(
        [
            {"mois": "Janvier", "poste": "Energie", "prevuJour": 10, "realiseJour": 12},
            {"mois": "Janvier", "poste": "Energie", "prevuJour": 5, "realiseJour": 7},
            {"mois": "Janvier", "poste": "Maintenance", "prevuJour": 10, "realiseJour": 8},
        ]
    )
    monthly = aggregate_charges(df)

    assert set(monthly.columns) >= {"mois", "poste", "prevu_total", "cout_total", "ecart", "taux"}
    # 2 group keys
    assert len(monthly) == 2

    row_e = monthly[(monthly["mois"] == "Janvier") & (monthly["poste"] == "Energie")].iloc[0]
    assert row_e["prevu_total"] == 15
    assert row_e["cout_total"] == 19
    assert row_e["ecart"] == 4


def test_aggregate_charges_handles_zero_prevud_without_divide_by_zero():
    df = pd.DataFrame(
        [
            {"mois": "Janvier", "poste": "Energie", "prevuJour": 0, "realiseJour": 10},
        ]
    )
    monthly = aggregate_charges(df)
    assert monthly.iloc[0]["ecart"] == 10
    assert monthly.iloc[0]["taux"] == 1000.0  # 10/1 * 100


def test_aggregate_charges_raises_when_missing_columns():
    df = pd.DataFrame([
        {"mois": "Janvier", "poste": "Energie", "prevuJour": 1}
    ])
    with pytest.raises(KeyError):
        aggregate_charges(df)


def test_aggregate_production_groups_and_computes_ecart_and_taux():
    df = pd.DataFrame(
        [
            {"mois": "Janvier", "activite": "A", "prevuT": 100, "realiseT": 110},
            {"mois": "Janvier", "activite": "A", "prevuT": 50, "realiseT": 40},
            {"mois": "Janvier", "activite": "B", "prevuT": 10, "realiseT": 20},
        ]
    )
    monthly = aggregate_production(df)
    assert len(monthly) == 2

    row_a = monthly[(monthly["mois"] == "Janvier") & (monthly["activite"] == "A")].iloc[0]
    assert row_a["prevu_total"] == 150
    assert row_a["tonnage_realise"] == 150
    assert row_a["ecart"] == 0


def test_aggregate_production_handles_zero_prevud_without_divide_by_zero():
    df = pd.DataFrame([
        {"mois": "Janvier", "activite": "A", "prevuT": 0, "realiseT": 10},
    ])
    monthly = aggregate_production(df)
    assert monthly.iloc[0]["ecart"] == 10
    assert monthly.iloc[0]["taux"] == 1000.0

