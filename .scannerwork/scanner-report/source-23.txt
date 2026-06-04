// services/aiService.js
const AI_URL = "http://localhost:8000";

export const getPrevisionCharges = async () => {
  const res = await fetch(`${AI_URL}/prediction/charges`);
  return res.json();
};

export const getPrevisionProduction = async () => {
  const res = await fetch(`${AI_URL}/prediction/production`);
  return res.json();
};

export const getAnomalies = async () => {
  const res = await fetch(`${AI_URL}/anomalies`);
  return res.json();
};

export const sendChat = async (messages, mois = null, annee = null) => {
  const res = await fetch(`${AI_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, mois, annee }),
  });
  return res.json(); // { reply: "..." }
};