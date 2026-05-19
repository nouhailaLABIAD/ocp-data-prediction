# routers/chat.py
# Proxy vers l'API Groq (gratuit) — modèle llama3

import os
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List

router = APIRouter()

GROQ_API_KEY = "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"

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    system: str = ""

@router.post("/chat")
async def chat(body: ChatRequest):
    messages = []
    if body.system:
        messages.append({"role": "system", "content": body.system})
    messages += [{"role": m.role, "content": m.content} for m in body.messages]

    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": messages,
        "max_tokens": 1000,
        "temperature": 0.7,
    }

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json=payload,
        )

    if resp.status_code != 200:
        raise HTTPException(
            status_code=resp.status_code,
            detail=f"Erreur Groq : {resp.text}"
        )

    data = resp.json()
    reply = data["choices"][0]["message"]["content"]
    return {"reply": reply}