from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import (
    prediction,
    production,
    anomalie,
    chat,          # ← nouveau
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(prediction.router)
app.include_router(production.router)
app.include_router(anomalie.router)
app.include_router(chat.router)   # ← nouveau


@app.get("/")
def root():
    return {"service": "OCP AI", "status": "running"}