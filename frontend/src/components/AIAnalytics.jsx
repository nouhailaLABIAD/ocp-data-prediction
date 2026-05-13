// AIAnalytics.jsx — OCP Portail · Tableaux de bord IA
// Consomme : GET /prediction/charges · /prediction/production · /anomalies
import { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell,
} from 'recharts';

const API = 'http://localhost:8000'; // URL de ton FastAPI

// ─── palette OCP ───────────────────────────────────────────
const G = {
  dark:  '#1e4d20',
  main:  '#2d6a2f',
  mid:   '#3a7d3c',
  light: '#4caf50',
  pale:  '#e8f5e9',
  bg:    '#f4faf4',
  border:'#c8e6c9',
  red:   '#e53935',
  amber: '#f9a825',
};

// ─── helpers ───────────────────────────────────────────────
const MOIS_ORDER = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];
const sortByMois = (arr, key = 'mois') =>
  [...arr].sort((a, b) => MOIS_ORDER.indexOf(a[key]) - MOIS_ORDER.indexOf(b[key]));

const niveauColor = (n) =>
  n === 'CRITIQUE' ? G.red : n === 'ATTENTION' ? G.amber : G.light;

// ─── Custom tooltip ────────────────────────────────────────
const OcpTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff', border: `1px solid ${G.border}`,
      borderRadius: 10, padding: '10px 14px',
      boxShadow: '0 4px 16px rgba(45,106,47,0.15)',
      fontFamily: 'Nunito, sans-serif', fontSize: 13,
    }}>
      <p style={{ fontWeight: 800, color: G.main, marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 600, margin: '2px 0' }}>
          {p.name} : <strong>{typeof p.value === 'number' ? p.value.toLocaleString('fr-FR') : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

// ─── Composant carte ───────────────────────────────────────
function Card({ title, icon, badge, children, loading, error }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16,
      border: `1px solid ${G.border}`,
      boxShadow: '0 2px 12px rgba(45,106,47,0.10)',
      padding: '28px 28px 24px', marginBottom: 28,
      fontFamily: 'Nunito, sans-serif',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22,
        paddingBottom: 16, borderBottom: `1px solid ${G.pale}` }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ fontWeight: 800, fontSize: 11, letterSpacing: 2,
          textTransform: 'uppercase', color: G.main }}>{title}</span>
        {badge != null && (
          <span style={{
            marginLeft: 'auto', background: G.pale, color: G.main,
            fontSize: 11, fontWeight: 800, padding: '3px 10px',
            borderRadius: 99, border: `1px solid ${G.border}`,
          }}>{badge}</span>
        )}
      </div>
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: G.mid }}>
          <div style={{ display: 'inline-block', width: 28, height: 28,
            border: `3px solid ${G.pale}`, borderTopColor: G.main,
            borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ marginTop: 12, fontSize: 13, fontWeight: 600 }}>Chargement…</p>
        </div>
      )}
      {error && !loading && (
        <div style={{ background: '#fdecea', border: '1px solid #f5c6c6',
          borderRadius: 10, padding: '14px 16px', color: '#c0392b',
          fontSize: 13, fontWeight: 600 }}>✕ {error}</div>
      )}
      {!loading && !error && children}
    </div>
  );
}

// ─── Sélecteur de postes / activités ──────────────────────
function Selector({ items, selected, onChange, color = G.main }) {
  if (!items.length) return null;
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
      {items.map(it => (
        <button key={it} onClick={() => onChange(it)} style={{
          padding: '5px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700,
          border: `1.5px solid ${selected === it ? color : G.border}`,
          background: selected === it ? color : '#fff',
          color: selected === it ? '#fff' : G.mid,
          cursor: 'pointer', transition: '200ms',
          fontFamily: 'Nunito, sans-serif',
        }}>{it}</button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SECTION 1 · Prédiction des charges
// ═══════════════════════════════════════════════════════════
function ChargesChart() {
  const [data,    setData]    = useState([]);
  const [postes,  setPostes]  = useState([]);
  const [poste,   setPoste]   = useState('');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    fetch(`${API}/prediction/charges`)
      .then(r => r.json())
      .then(json => {
        const preds = json.predictions ?? [];
        const uniquePostes = [...new Set(preds.map(p => p.poste))];
        setPostes(uniquePostes);
        setPoste(uniquePostes[0] ?? '');
        setData(preds);
        setLoading(false);
      })
      .catch(() => {
        setError('Impossible de contacter le serveur (/prediction/charges)');
        setLoading(false);
      });
  }, []);

  const filtered = sortByMois(data.filter(d => d.poste === poste));

  return (
    <Card title="Prédiction des charges" icon="📈"
      badge={`${data.length} prédictions`} loading={loading} error={error}>
      <Selector items={postes} selected={poste} onChange={setPoste} />
      {filtered.length > 0 ? (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={filtered} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={G.pale} />
            <XAxis dataKey="mois" tick={{ fontSize: 11, fontFamily: 'Nunito', fill: G.mid }}
              tickLine={false} axisLine={{ stroke: G.border }} />
            <YAxis tick={{ fontSize: 11, fontFamily: 'Nunito', fill: G.mid }}
              tickLine={false} axisLine={false}
              tickFormatter={v => v.toLocaleString('fr-FR')} />
            <Tooltip content={<OcpTooltip />} />
            <Line type="monotone" dataKey="cout_prevu" name="Coût prévu"
              stroke={G.main} strokeWidth={2.5} dot={{ r: 4, fill: G.main }}
              activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p style={{ color: G.mid, fontSize: 13, textAlign: 'center', padding: '30px 0' }}>
          Aucune donnée disponible pour ce poste.
        </p>
      )}
      <p style={{ fontSize: 11, color: G.mid, marginTop: 12, fontStyle: 'italic' }}>
        Régression linéaire · Projection sur les mois restants de l'année
      </p>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════
// SECTION 2 · Prédiction de production
// ═══════════════════════════════════════════════════════════
function ProductionChart() {
  const [data,      setData]      = useState([]);
  const [activites, setActivites] = useState([]);
  const [activite,  setActivite]  = useState('');
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    fetch(`${API}/prediction/production`)
      .then(r => r.json())
      .then(json => {
        const preds = json.predictions ?? [];
        const uniqueActs = [...new Set(preds.map(p => p.activite))];
        setActivites(uniqueActs);
        setActivite(uniqueActs[0] ?? '');
        setData(preds);
        setLoading(false);
      })
      .catch(() => {
        setError('Impossible de contacter le serveur (/prediction/production)');
        setLoading(false);
      });
  }, []);

  const filtered = sortByMois(data.filter(d => d.activite === activite));

  return (
    <Card title="Prédiction de production (tonnage)" icon="🏭"
      badge={`${data.length} prédictions`} loading={loading} error={error}>
      <Selector items={activites} selected={activite} onChange={setActivite} color={G.mid} />
      {filtered.length > 0 ? (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={filtered} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={G.pale} vertical={false} />
            <XAxis dataKey="mois" tick={{ fontSize: 11, fontFamily: 'Nunito', fill: G.mid }}
              tickLine={false} axisLine={{ stroke: G.border }} />
            <YAxis tick={{ fontSize: 11, fontFamily: 'Nunito', fill: G.mid }}
              tickLine={false} axisLine={false}
              tickFormatter={v => v.toLocaleString('fr-FR') + ' T'} />
            <Tooltip content={<OcpTooltip />} />
            <Bar dataKey="tonnage_prevu" name="Tonnage prévu" radius={[6, 6, 0, 0]}
              fill={G.light}>
              {filtered.map((_, i) => (
                <Cell key={i}
                  fill={`hsl(122, ${40 + (i / filtered.length) * 30}%, ${35 + (i / filtered.length) * 15}%)`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p style={{ color: G.mid, fontSize: 13, textAlign: 'center', padding: '30px 0' }}>
          Aucune donnée disponible pour cette activité.
        </p>
      )}
      <p style={{ fontSize: 11, color: G.mid, marginTop: 12, fontStyle: 'italic' }}>
        Régression linéaire · Projection sur les mois restants de l'année
      </p>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════
// SECTION 3 · Anomalies détectées
// ═══════════════════════════════════════════════════════════
const NIVEAU_LABEL = { CRITIQUE: '🔴 CRITIQUE', ATTENTION: '🟡 ATTENTION', INCONNU: '⚪ INCONNU' };

function AnomaliesTable() {
  const [data,    setData]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [filtre,  setFiltre]  = useState('TOUS');
  const [page,    setPage]    = useState(0);
  const PER_PAGE = 8;

  useEffect(() => {
    fetch(`${API}/anomalies`)
      .then(r => r.json())
      .then(json => {
        setData(json.anomalies ?? []);
        setTotal(json.total ?? 0);
        setLoading(false);
      })
      .catch(() => {
        setError('Impossible de contacter le serveur (/anomalies)');
        setLoading(false);
      });
  }, []);

  const niveaux = ['TOUS', ...new Set(data.map(d => d.niveau))];
  const filtered = filtre === 'TOUS' ? data : data.filter(d => d.niveau === filtre);
  const paged = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const pages = Math.ceil(filtered.length / PER_PAGE);

  // KPI cards
  const critique  = data.filter(d => d.niveau === 'CRITIQUE').length;
  const attention = data.filter(d => d.niveau === 'ATTENTION').length;

  return (
    <Card title="Anomalies détectées (Isolation Forest)" icon="🔍"
      badge={`${total} total`} loading={loading} error={error}>

      {/* KPIs */}
      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total',     value: total,    color: G.main,  bg: G.pale },
            { label: 'Critiques', value: critique,  color: G.red,   bg: '#fdecea' },
            { label: 'Attention', value: attention, color: G.amber, bg: '#fff8e1' },
          ].map(k => (
            <div key={k.label} style={{
              background: k.bg, borderRadius: 10, padding: '14px 16px',
              border: `1px solid ${k.color}22`,
            }}>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5,
                textTransform: 'uppercase', color: k.color, marginBottom: 4 }}>{k.label}</p>
              <p style={{ fontSize: 26, fontWeight: 800, color: k.color }}>{k.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filtre niveau */}
      {!loading && !error && (
        <>
          <Selector items={niveaux} selected={filtre}
            onChange={v => { setFiltre(v); setPage(0); }} color={G.dark} />

          {/* Tableau */}
          <div style={{ overflowX: 'auto', borderRadius: 10, border: `1px solid ${G.border}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse',
              fontFamily: 'Nunito, sans-serif', fontSize: 13 }}>
              <thead>
                <tr style={{ background: G.pale }}>
                  {['Date','Poste','Mois','Réalisé','Prévu','Écart','Niveau'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left',
                      fontWeight: 800, fontSize: 11, letterSpacing: 1.2,
                      textTransform: 'uppercase', color: G.main,
                      borderBottom: `1px solid ${G.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '24px',
                      color: G.mid, fontSize: 13 }}>
                      Aucune anomalie pour ce filtre.
                    </td>
                  </tr>
                ) : paged.map((a, i) => (
                  <tr key={i} style={{
                    borderBottom: `1px solid ${G.border}`,
                    background: i % 2 === 0 ? '#fff' : G.bg,
                    transition: '150ms',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = G.pale}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : G.bg}
                  >
                    <td style={{ padding: '10px 14px', color: G.mid }}>{a.date?.slice(0,10)}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: G.dark }}>{a.poste}</td>
                    <td style={{ padding: '10px 14px', color: G.mid }}>{a.mois}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700 }}>
                      {a.realise?.toLocaleString('fr-FR')}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {a.prevu?.toLocaleString('fr-FR')}
                    </td>
                    <td style={{ padding: '10px 14px',
                      color: a.ecart < 0 ? G.red : G.light, fontWeight: 700 }}>
                      {a.ecart > 0 ? '+' : ''}{a.ecart?.toLocaleString('fr-FR')}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 800,
                        background: niveauColor(a.niveau) + '22',
                        color: niveauColor(a.niveau), border: `1px solid ${niveauColor(a.niveau)}44`,
                      }}>
                        {NIVEAU_LABEL[a.niveau] ?? a.niveau}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
              {Array.from({ length: pages }, (_, i) => (
                <button key={i} onClick={() => setPage(i)} style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: `1.5px solid ${page === i ? G.main : G.border}`,
                  background: page === i ? G.main : '#fff',
                  color: page === i ? '#fff' : G.mid,
                  fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  fontFamily: 'Nunito, sans-serif',
                }}>{i + 1}</button>
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════
// EXPORT PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default function AIAnalytics() {
  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{
        fontFamily: 'Nunito, sans-serif',
        animation: 'fadeUp 0.4s ease both',
      }}>
        {/* Section header */}
        <div style={{ marginBottom: 28 }}>
          <p style={{
            fontSize: 11, fontWeight: 800, letterSpacing: 2,
            textTransform: 'uppercase', color: '#3a7d3c', marginBottom: 6,
          }}>Analyse IA</p>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a2e1a', marginBottom: 4 }}>
            Tableaux de bord prédictifs
          </h2>
          <p style={{ fontSize: 13, color: '#6a8f6b' }}>
            Prédictions par régression linéaire · Détection d'anomalies par Isolation Forest
          </p>
        </div>

        <ChargesChart />
        <ProductionChart />
        <AnomaliesTable />
      </div>
    </>
  );
}