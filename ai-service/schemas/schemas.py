# schemas/schemas.py
from pydantic import BaseModel
from typing import Optional, List

class PrevisionRequest(BaseModel):
    mois:   str
    annee:  int
    poste:  Optional[str] = None   # si None → tous les postes
    zone:   Optional[str] = None

class PrevisionResult(BaseModel):
    poste:           str
    mois:            str
    annee:           int
    cumul_actuel:    float
    prevision_fin:   float
    budget_mois:     float
    ecart_prevu:     float
    ecart_pct:       float
    alerte:          bool
    niveau_alerte:   str   # OK / ATTENTION / CRITIQUE

class AnomalieRequest(BaseModel):
    mois:  str
    annee: int

class AnomalieResult(BaseModel):
    poste:          str
    mois:           str
    realise:        float
    prevu:          float
    ecart_pct:      float
    score_anomalie: float
    niveau:         str   # OK / ATTENTION / CRITIQUE
    est_anomalie:   bool