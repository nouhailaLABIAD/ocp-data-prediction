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


from models.anomaly import (
    detect_anomalies,
)

router = APIRouter()


@router.get("/anomalies")

def anomalies():

    df = load_charges()

    results = detect_anomalies(df)

    return {

        "total": len(results) if hasattr(results, "__len__") else 1,

        "anomalies": results,

    }
