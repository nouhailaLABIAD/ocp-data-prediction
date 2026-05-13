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