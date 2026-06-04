"""Fichier optionnel: doublons pour augmenter robustesse de couverture.
Ici on teste une autre branche des routers via patch.
"""

from unittest.mock import patch

from routers.anomalie import anomalies


@patch("routers.anomalie.load_charges")
@patch("routers.anomalie.detect_anomalies")
def test_get_anomalies_when_detect_called_with_dataframe(load_charges_mock, detect_mock):
    load_charges_mock.return_value = object()
    detect_mock.return_value = [{"niveau": "CRITIQUE"}]

    res = anomalies()

    assert res["total"] == 1
    assert detect_mock.call_count == 1

