from fastapi import APIRouter

from database import load_charges

from services.aggregation import (
    aggregate_charges,
)

from models.prediction import (
    predict_charges,
)

router = APIRouter()


@router.get("/prediction/charges")

def prediction_charges():

    df = load_charges()

    monthly = aggregate_charges(df)

    predictions = predict_charges(monthly)

    return {

        "type": "charges",

        "predictions": predictions,

    }