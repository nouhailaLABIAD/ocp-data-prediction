try:
    from fastapi import APIRouter
except ModuleNotFoundError:  # pragma: no cover (tests fallback)
    class APIRouter:
        def get(self, *_args, **_kwargs):
            def decorator(fn):
                return fn
            return decorator

        def post(self, *_args, **_kwargs):
            def decorator(fn):
                return fn
            return decorator

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