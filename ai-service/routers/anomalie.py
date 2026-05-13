from fastapi import APIRouter

from database import load_charges

from models.anomaly import (
    detect_anomalies,
)

router = APIRouter()


@router.get("/anomalies")

def anomalies():

    df = load_charges()

    results = detect_anomalies(df)

    return {

        "total": len(results),

        "anomalies": results,

    }