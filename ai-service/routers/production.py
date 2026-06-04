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

from database import load_production


from services.aggregation import (
    aggregate_production,
)

from models.production_prediction import (
    predict_production,
)

router = APIRouter()


@router.get("/prediction/production")

def prediction_production():

    df = load_production()

    monthly = aggregate_production(df)

    predictions = predict_production(monthly)

    return {

        "type": "production",

        "predictions": predictions,

    }