// pages/Previsions.jsx
import { useEffect, useState } from "react";
import {
  getPrevisionCharges,
  getAnomalies,
} from "../services/aiService";

export default function Previsions() {
  const [charges,   setCharges]   = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      getPrevisionCharges(),
      getAnomalies(),
    ]).then(([chData, anData]) => {
      setCharges(chData.predictions);
      setAnomalies(anData.anomalies);
      setLoading(false);
    });
  }, []);

  if (loading) return <p>Chargement...</p>;

  // Garder uniquement les CRITIQUES pour affichage prioritaire
  const critiques = anomalies.filter(a => a.niveau === "CRITIQUE");

  // Grouper les prévisions par poste (pour graphique)
  const postes = [...new Set(charges.map(c => c.poste))];

  return (
    <div className="previsions-page">

      {/* ── KPI ANOMALIES ── */}
      <div className="kpi-row">
        <div className="kpi-card red">
          <span className="kpi-num">{critiques.length}</span>
          <span className="kpi-label">Anomalies critiques</span>
        </div>
        <div className="kpi-card orange">
          <span className="kpi-num">
            {anomalies.filter(a => a.niveau === "ATTENTION").length}
          </span>
          <span className="kpi-label">À surveiller</span>
        </div>
        <div className="kpi-card blue">
          <span className="kpi-num">{postes.length}</span>
          <span className="kpi-label">Postes analysés</span>
        </div>
      </div>

      {/* ── ANOMALIES CRITIQUES ── */}
      <section className="section">
        <h2>Anomalies détectées — Top critiques</h2>
        <table className="anomalie-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Poste</th>
              <th>Mois</th>
              <th>Réalisé (DH)</th>
              <th>Prévu (DH)</th>
              <th>Écart (DH)</th>
              <th>Niveau</th>
            </tr>
          </thead>
          <tbody>
            {critiques.slice(0, 20).map((a, i) => (
              <tr key={i}>
                <td>{a.date}</td>
                <td><strong>{a.poste}</strong></td>
                <td>{a.mois}</td>
                <td>{a.realise.toLocaleString("fr-MA")} DH</td>
                <td>{a.prevu.toLocaleString("fr-MA")} DH</td>
                <td className={a.ecart > 0 ? "red" : "green"}>
                  {a.ecart > 0 ? "+" : ""}
                  {a.ecart.toLocaleString("fr-MA")} DH
                </td>
                <td>
                  <span className={`badge ${a.niveau.toLowerCase()}`}>
                    {a.niveau}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── PRÉVISIONS PAR POSTE ── */}
      <section className="section">
        <h2>Prévisions des charges — Mai → Décembre</h2>
        {postes.slice(0, 5).map(poste => {
          const data = charges.filter(c => c.poste === poste);
          return (
            <div key={poste} className="prevision-card">
              <h3>{poste}</h3>
              <div className="mois-row">
                {data.map((d, i) => (
                  <div key={i} className="mois-item">
                    <span className="mois-label">{d.mois}</span>
                    <span className="mois-val">
                      {(d.cout_prevu / 1e6).toFixed(2)} MDH
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>

    </div>
  );
}