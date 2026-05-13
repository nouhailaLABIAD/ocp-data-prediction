// AIChatbot.jsx — OCP Portail · Assistant IA contextuel
// Utilise l'API Anthropic avec contexte OCP (charges, production, anomalies)
import { useState, useRef, useEffect } from 'react';

const API_FASTAPI = 'http://localhost:8000';

// ─── Couleurs OCP ──────────────────────────────────────────
const G = {
  dark:  '#1e4d20',
  main:  '#2d6a2f',
  mid:   '#3a7d3c',
  light: '#4caf50',
  pale:  '#e8f5e9',
  bg:    '#f4faf4',
  border:'#c8e6c9',
};

// ─── Suggestions rapides ───────────────────────────────────
const SUGGESTIONS = [
  'Quelles sont les anomalies critiques ce mois ?',
  'Quelle activité a le meilleur tonnage prévu ?',
  'Quels postes dépassent le budget prévu ?',
  'Résume les prédictions de charges pour ce trimestre.',
  'Quels postes nécessitent une attention immédiate ?',
];

// ─── Fetch données OCP pour le contexte ────────────────────
async function fetchOcpContext() {
  const results = await Promise.allSettled([
    fetch(`${API_FASTAPI}/prediction/charges`).then(r => r.json()),
    fetch(`${API_FASTAPI}/prediction/production`).then(r => r.json()),
    fetch(`${API_FASTAPI}/anomalies`).then(r => r.json()),
  ]);

  const charges    = results[0].status === 'fulfilled' ? results[0].value : null;
  const production = results[1].status === 'fulfilled' ? results[1].value : null;
  const anomalies  = results[2].status === 'fulfilled' ? results[2].value : null;

  let ctx = `Tu es l'assistant IA du Portail de Contrôle OCP (Office Chérifien des Phosphates).
Tu analyses les données de production et de charges minières en temps réel.
Réponds toujours en français, de façon concise et professionnelle.
Utilise des chiffres précis quand tu en as. Si une anomalie est critique, signale-la clairement.

=== DONNÉES EN TEMPS RÉEL ===\n`;

  if (charges?.predictions?.length) {
    const sample = charges.predictions.slice(0, 15);
    ctx += `\n📈 PRÉDICTIONS CHARGES (${charges.predictions.length} entrées) :\n`;
    sample.forEach(p =>
      ctx += `  • ${p.poste} / ${p.mois} → coût prévu : ${p.cout_prevu?.toLocaleString('fr-FR')} MAD\n`
    );
    if (charges.predictions.length > 15) ctx += `  …et ${charges.predictions.length - 15} autres entrées\n`;
  } else {
    ctx += `\n📈 PRÉDICTIONS CHARGES : aucune donnée disponible\n`;
  }

  if (production?.predictions?.length) {
    const sample = production.predictions.slice(0, 15);
    ctx += `\n🏭 PRÉDICTIONS PRODUCTION (${production.predictions.length} entrées) :\n`;
    sample.forEach(p =>
      ctx += `  • ${p.activite} / ${p.mois} → tonnage prévu : ${p.tonnage_prevu?.toLocaleString('fr-FR')} T\n`
    );
    if (production.predictions.length > 15) ctx += `  …et ${production.predictions.length - 15} autres entrées\n`;
  } else {
    ctx += `\n🏭 PRÉDICTIONS PRODUCTION : aucune donnée disponible\n`;
  }

  if (anomalies?.anomalies?.length) {
    const critiques = anomalies.anomalies.filter(a => a.niveau === 'CRITIQUE');
    const attention = anomalies.anomalies.filter(a => a.niveau === 'ATTENTION');
    ctx += `\n🔍 ANOMALIES DÉTECTÉES : ${anomalies.total} au total\n`;
    ctx += `  • Critiques : ${critiques.length}\n`;
    ctx += `  • Attention : ${attention.length}\n`;
    if (critiques.length > 0) {
      ctx += `  Top anomalies critiques :\n`;
      critiques.slice(0, 5).forEach(a =>
        ctx += `    - ${a.poste} (${a.mois}, ${a.date?.slice(0,10)}) : réalisé=${a.realise?.toLocaleString('fr-FR')} / prévu=${a.prevu?.toLocaleString('fr-FR')} / écart=${a.ecart?.toLocaleString('fr-FR')}\n`
      );
    }
  } else {
    ctx += `\n🔍 ANOMALIES : aucune anomalie détectée\n`;
  }

  return ctx;
}

// ─── Appel API Anthropic ───────────────────────────────────
async function callClaude(messages, systemPrompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    }),
  });
  const data = await response.json();
  const text = data.content?.map(b => b.text || '').join('') ?? '';
  if (!text) throw new Error(data.error?.message ?? 'Erreur API');
  return text;
}

// ─── Formatage message avec markdown simple ────────────────
function renderMessage(text) {
  // Bold **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  );
}

// ─── Bulle de message ──────────────────────────────────────
function Bubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{
      display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 12, animation: 'bubbleIn 0.2s ease both',
    }}>
      {/* Avatar IA */}
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: `linear-gradient(135deg, ${G.main}, ${G.light})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, flexShrink: 0, marginRight: 10, marginTop: 4,
          boxShadow: '0 2px 8px rgba(45,106,47,0.3)',
        }}>🤖</div>
      )}

      <div style={{
        maxWidth: '75%',
        background: isUser
          ? `linear-gradient(135deg, ${G.main}, ${G.mid})`
          : '#fff',
        color: isUser ? '#fff' : '#1a2e1a',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        padding: '12px 16px',
        fontSize: 13.5, lineHeight: 1.6, fontWeight: 500,
        boxShadow: isUser
          ? '0 2px 10px rgba(45,106,47,0.25)'
          : '0 2px 10px rgba(0,0,0,0.08)',
        border: isUser ? 'none' : `1px solid ${G.border}`,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {msg.role === 'assistant'
          ? renderMessage(msg.content)
          : msg.content}
      </div>

      {/* Avatar user */}
      {isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'rgba(45,106,47,0.15)',
          border: `2px solid ${G.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, flexShrink: 0, marginLeft: 10, marginTop: 4,
        }}>👤</div>
      )}
    </div>
  );
}

// ─── Indicateur de frappe ──────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: `linear-gradient(135deg, ${G.main}, ${G.light})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
      }}>🤖</div>
      <div style={{
        background: '#fff', border: `1px solid ${G.border}`,
        borderRadius: '18px 18px 18px 4px', padding: '12px 18px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: '50%',
            background: G.light,
            animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default function AIChatbot() {
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [system,    setSystem]    = useState('');
  const [ctxLoaded, setCtxLoaded] = useState(false);
  const [open,      setOpen]      = useState(false);
  const [error,     setError]     = useState(null);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Charger le contexte OCP au premier clic
  useEffect(() => {
    if (open && !ctxLoaded) {
      fetchOcpContext()
        .then(ctx => {
          setSystem(ctx);
          setCtxLoaded(true);
          setMessages([{
            role: 'assistant',
            content: '👋 Bonjour ! Je suis votre assistant IA OCP.\n\nJ\'ai chargé vos données en temps réel : prédictions de charges, production et anomalies détectées.\n\nComment puis-je vous aider ?',
          }]);
        })
        .catch(() => {
          setSystem("Tu es l'assistant IA du Portail OCP. Réponds en français. Les données ne sont pas disponibles pour le moment.");
          setCtxLoaded(true);
          setMessages([{
            role: 'assistant',
            content: '👋 Bonjour ! Je suis votre assistant IA OCP.\n\n⚠️ Je n\'ai pas pu charger les données en temps réel. Je reste disponible pour répondre à vos questions générales.',
          }]);
        });
    }
  }, [open, ctxLoaded]);

  // Scroll automatique
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text) => {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;

    setInput('');
    setError(null);
    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setLoading(true);

    // On envoie uniquement les messages user/assistant (pas system)
    const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));

    try {
      const reply = await callClaude(apiMessages, system);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setError('Erreur lors de la communication avec l\'IA. Vérifiez votre connexion.');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Désolé, une erreur s\'est produite. Veuillez réessayer.',
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: '🔄 Conversation réinitialisée. Comment puis-je vous aider ?',
    }]);
    setError(null);
  };

  return (
    <>
      <style>{`
        @keyframes bubbleIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30%            { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes chatOpen {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(45,106,47,0.4); }
          50%       { box-shadow: 0 0 0 8px rgba(45,106,47,0); }
        }
        .chat-input:focus { outline: none; border-color: #2d6a2f !important;
          box-shadow: 0 0 0 3px rgba(45,106,47,0.12) !important; }
        .send-btn:hover:not(:disabled) { background: #1e4d20 !important; transform: scale(1.05); }
        .send-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .sugg-chip:hover { background: #e8f5e9 !important; border-color: #2d6a2f !important; }
        .clear-btn:hover { color: #c0392b !important; }
        .close-btn:hover { background: rgba(255,255,255,0.2) !important; }
      `}</style>

      {/* ── Bouton flottant ─────────────────────────────── */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 999,
          width: 56, height: 56, borderRadius: '50%',
          background: `linear-gradient(135deg, ${G.main}, ${G.light})`,
          border: 'none', cursor: 'pointer', fontSize: 24,
          boxShadow: '0 4px 20px rgba(45,106,47,0.4)',
          animation: open ? 'none' : 'pulse 2.5s ease infinite',
          transition: 'transform 200ms, box-shadow 200ms',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        title="Assistant IA OCP"
      >
        {open ? '✕' : '🤖'}
      </button>

      {/* ── Fenêtre de chat ─────────────────────────────── */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 96, right: 28, zIndex: 998,
          width: 380, height: 560,
          background: '#fff', borderRadius: 20,
          boxShadow: '0 8px 40px rgba(45,106,47,0.25)',
          border: `1px solid ${G.border}`,
          display: 'flex', flexDirection: 'column',
          animation: 'chatOpen 0.25s ease both',
          fontFamily: 'Nunito, sans-serif',
          overflow: 'hidden',
        }}>

          {/* ── Header ── */}
          <div style={{
            background: `linear-gradient(135deg, ${G.dark}, ${G.main})`,
            padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              border: '2px solid rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
            }}>🤖</div>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#fff', fontWeight: 800, fontSize: 14, margin: 0 }}>
                Assistant IA OCP
              </p>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, margin: 0 }}>
                {ctxLoaded ? '● Données chargées' : '○ Chargement…'}
              </p>
            </div>
            <button className="clear-btn" onClick={clearChat} title="Réinitialiser" style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.7)', fontSize: 16, padding: '4px 8px',
              borderRadius: 6, transition: '150ms',
            }}>🗑</button>
          </div>

          {/* ── Messages ── */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '16px',
            background: G.bg,
            scrollbarWidth: 'thin',
            scrollbarColor: `${G.border} transparent`,
          }}>
            {messages.length === 0 && !ctxLoaded && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: G.mid }}>
                <div style={{
                  width: 24, height: 24, margin: '0 auto 12px',
                  border: `3px solid ${G.pale}`, borderTopColor: G.main,
                  borderRadius: '50%', animation: 'typingDot 1s linear infinite',
                }} />
                <p style={{ fontSize: 13 }}>Chargement des données OCP…</p>
              </div>
            )}

            {messages.map((m, i) => <Bubble key={i} msg={m} />)}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* ── Suggestions rapides ── */}
          {messages.length <= 1 && ctxLoaded && (
            <div style={{
              padding: '8px 12px', borderTop: `1px solid ${G.border}`,
              background: '#fff', display: 'flex', gap: 6, flexWrap: 'wrap',
            }}>
              {SUGGESTIONS.slice(0, 3).map((s, i) => (
                <button key={i} className="sugg-chip" onClick={() => send(s)} style={{
                  fontSize: 11, fontWeight: 600, padding: '4px 10px',
                  borderRadius: 99, border: `1px solid ${G.border}`,
                  background: '#fff', color: G.mid, cursor: 'pointer',
                  fontFamily: 'Nunito, sans-serif', transition: '150ms',
                }}>{s}</button>
              ))}
            </div>
          )}

          {/* ── Erreur ── */}
          {error && (
            <div style={{
              padding: '8px 14px', background: '#fdecea',
              borderTop: '1px solid #f5c6c6',
              fontSize: 12, color: '#c0392b', fontWeight: 600,
            }}>✕ {error}</div>
          )}

          {/* ── Zone de saisie ── */}
          <div style={{
            padding: '12px 14px', borderTop: `1px solid ${G.border}`,
            background: '#fff', display: 'flex', gap: 8, alignItems: 'flex-end',
          }}>
            <textarea
              ref={inputRef}
              className="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Posez votre question…"
              rows={1}
              disabled={loading || !ctxLoaded}
              style={{
                flex: 1, resize: 'none', border: `1.5px solid ${G.border}`,
                borderRadius: 12, padding: '10px 12px',
                fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 500,
                color: '#1a2e1a', background: G.bg,
                transition: '200ms', lineHeight: 1.5,
                maxHeight: 100, overflowY: 'auto',
              }}
              onInput={e => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
              }}
            />
            <button
              className="send-btn"
              onClick={() => send()}
              disabled={loading || !input.trim() || !ctxLoaded}
              style={{
                width: 40, height: 40, borderRadius: 12, border: 'none',
                background: G.main, color: '#fff', cursor: 'pointer',
                fontSize: 16, flexShrink: 0,
                transition: '200ms', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}
              title="Envoyer (Entrée)"
            >↑</button>
          </div>
        </div>
      )}
    </>
  );
}