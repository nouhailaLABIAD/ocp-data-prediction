# routers/chat.py  — version RAG
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List

from database import load_charges, load_production
from models.anomaly import detect_anomalies
from services.aggregation import aggregate_charges, aggregate_production

router = APIRouter()
GROQ_API_KEY = "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"



class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    mois: str = None      # ← contexte optionnel
    annee: int = None

# ── ÉTAPE 1 : Retrieve — construire le contexte depuis la DB
def build_context(mois: str = None, annee: int = None) -> str:
    lines = []

    # Charges agrégées
    df_charges = load_charges(mois=mois, annee=annee)
    if not df_charges.empty:
        agg = aggregate_charges(df_charges)
        top = agg.nlargest(10, "cout_total")[
            ["poste", "mois", "prevu_total", "cout_total", "ecart", "taux"]
        ]
        lines.append("=== CHARGES (top 10 postes) ===")
        lines.append(top.to_string(index=False))

    # Anomalies
    if not df_charges.empty:
        anomalies = detect_anomalies(df_charges)
        critiques = [a for a in anomalies if a["niveau"] == "CRITIQUE"]
        lines.append(f"\n=== ANOMALIES CRITIQUES ({len(critiques)}) ===")
        for a in critiques[:5]:
            lines.append(
                f"  - {a['poste']} | {a['date']} | "
                f"réalisé={a['realise']:.0f} prévu={a['prevu']:.0f} "
                f"écart={a['ecart']:.0f}"
            )

    # Production agrégée
    df_prod = load_production(mois=mois, annee=annee)
    if not df_prod.empty:
        agg_p = aggregate_production(df_prod)
        lines.append("\n=== PRODUCTION (par activité) ===")
        lines.append(
            agg_p[["activite", "mois", "prevu_total",
                   "tonnage_realise", "ecart", "taux"]]
            .to_string(index=False)
        )

    return "\n".join(lines)


# ── ÉTAPE 2 : Augment + Generate
@router.post("/chat")
async def chat(body: ChatRequest):
    # RAG : récupérer les données contextuelles
    context = build_context(mois=body.mois, annee=body.annee)

    system_prompt = f"""
Tu es un assistant analytique pour OCP (industrie minière).
Tu réponds en français, de façon précise et concise.
Tu t'appuies UNIQUEMENT sur les données ci-dessous pour répondre.
Si la donnée n'est pas dans le contexte, dis-le clairement.

{context}
"""

    messages = [{"role": "system", "content": system_prompt}]
    messages += [{"role": m.role, "content": m.content} for m in body.messages]

    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": messages,
        "max_tokens": 1000,
        "temperature": 0.3,   # ← plus bas = plus factuel
    }

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {GROQ_API_KEY}",
                     "Content-Type": "application/json"},
            json=payload,
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code,
                            detail=f"Erreur Groq : {resp.text}")

    return {"reply": resp.json()["choices"][0]["message"]["content"]}