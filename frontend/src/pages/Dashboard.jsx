// Dashboard.jsx — OCP Portail RH · Analytics + Modification profil contrôleur
import '../styles/Dashboard.css';
import ocpLogo from '../assets/ocp-logo.png';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import UploadBox from '../components/UploadBox';
import AIChatbot from '../components/AIChatbot';

const API_AI   = 'http://localhost:8000';
const API_AUTH = 'http://localhost:3000';

const G = {
  dark:   '#0f2d10', main:   '#1a5c1c', mid:    '#2d7a30',
  light:  '#4caf50', pale:   '#e8f5e9', bg:     '#f0f7f0',
  border: '#b2dfb4', red:    '#d32f2f', amber:  '#f57f17',
  white:  '#ffffff', text:   '#1a2e1a', muted:  '#5a7a5c',
};

const MOIS_ORDER = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const sortByMois = arr => [...arr].sort((a,b)=>MOIS_ORDER.indexOf(a.mois)-MOIS_ORDER.indexOf(b.mois));

const inputStyle = {
  width:'100%', padding:'10px 14px', borderRadius:10,
  border:`1.5px solid #b2dfb4`, background:'#f0f7f0',
  fontFamily:'Nunito, sans-serif', fontSize:14, color:'#1a2e1a',
  outline:'none', transition:'180ms', boxSizing:'border-box',
};

// ═══════════════════════════════════════════════════════════════
// EXPORT HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Dynamically load jsPDF + autotable from CDN then call cb(jsPDF).
 */
function loadJsPDF(cb) {
  if (window.jspdf?.jsPDF) { cb(window.jspdf.jsPDF); return; }
  const s1 = document.createElement('script');
  s1.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  s1.onload = () => {
    const s2 = document.createElement('script');
    s2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js';
    s2.onload = () => cb(window.jspdf.jsPDF);
    document.head.appendChild(s2);
  };
  document.head.appendChild(s1);
}

/**
 * Dynamically load SheetJS from CDN then call cb(XLSX).
 */
function loadXLSX(cb) {
  if (window.XLSX) { cb(window.XLSX); return; }
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  s.onload = () => cb(window.XLSX);
  document.head.appendChild(s);
}

/**
 * Format a number for PDF cells: uses fr-FR locale then replaces
 * the non-breaking space (\u00A0) that jsPDF renders as "/" with a
 * regular space so thousands separators display correctly.
 */
function fmtNum(value) {
  if (value == null) return '';
  return Number(value).toLocaleString('fr-FR').replace(/\u00A0/g, ' ');
}

/**
 * Generic PDF export.
 * @param {string} title       - Document title shown at top
 * @param {string[]} columns   - Header labels
 * @param {any[][]} rows       - 2D array of cell values
 * @param {string} filename    - Output filename (without extension)
 */
function exportPDF(title, columns, rows, filename) {
  loadJsPDF(jsPDF => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

    // Header banner
    doc.setFillColor(15, 45, 16);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 44, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('OCP — PORTAIL RH', 32, 28);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(title, 32, 40);

    // Date
    doc.setTextColor(90, 122, 92);
    doc.setFontSize(8);
    doc.text(`Exporté le ${new Date().toLocaleDateString('fr-FR', {day:'2-digit',month:'long',year:'numeric'})}`,
      doc.internal.pageSize.getWidth() - 32, 40, { align: 'right' });

    doc.autoTable({
      startY: 56,
      head: [columns],
      body: rows,
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 6 },
      headStyles: { fillColor: [26, 92, 28], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      alternateRowStyles: { fillColor: [240, 247, 240] },
      tableLineColor: [178, 223, 180],
      tableLineWidth: 0.5,
    });

    doc.save(`${filename}.pdf`);
  });
}

/**
 * Generic Excel export.
 * @param {string} sheetName   - Sheet tab name
 * @param {string[]} columns   - Header labels
 * @param {any[][]} rows       - 2D array of cell values
 * @param {string} filename    - Output filename (without extension)
 */
function exportExcel(sheetName, columns, rows, filename) {
  loadXLSX(XLSX => {
    const wsData = [columns, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}.xlsx`);
  });
}

/** Small reusable export toolbar placed at the bottom of a section. */
function ExportBar({ onPDF, onExcel }) {
  const btnBase = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '6px 16px', borderRadius: 8, fontSize: 11, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'Nunito, sans-serif', transition: '150ms',
    border: '1.5px solid',
  };
  return (
    <div style={{ display:'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16, paddingTop: 12, borderTop: `1px solid ${G.border}` }}>
      <button
        onClick={onExcel}
        style={{ ...btnBase, background: '#e8f5e9', color: '#1a5c1c', borderColor: '#b2dfb4' }}
        onMouseEnter={e => e.currentTarget.style.background = '#c8e6c9'}
        onMouseLeave={e => e.currentTarget.style.background = '#e8f5e9'}
      >
        <span style={{ fontSize: 13 }}>📊</span> Exporter Excel
      </button>
      <button
        onClick={onPDF}
        style={{ ...btnBase, background: '#fdecea', color: '#c62828', borderColor: '#ef9a9a' }}
        onMouseEnter={e => e.currentTarget.style.background = '#ffcdd2'}
        onMouseLeave={e => e.currentTarget.style.background = '#fdecea'}
      >
        <span style={{ fontSize: 13 }}>📄</span> Exporter PDF
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MODAL MODIFICATION PROFIL
// ═══════════════════════════════════════════════════════════════
function ProfileModal({ user, onClose, onSaved }) {
  const token = localStorage.getItem('token');
  const [form, setForm] = useState({
    fullname: user?.fullname ?? '', email: user?.email ?? '',
    password: '', confirm: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState('');
  const overlayRef = useRef(null);

  const handleChange = e => { setForm({...form,[e.target.name]:e.target.value}); setError(''); };

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password && form.password !== form.confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (form.password && form.password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return; }
    setLoading(true);
    try {
      const payload = {
        fullname: form.fullname, email: form.email,
        ...(form.password.trim() !== '' && { password: form.password }),
      };
      const res = await fetch(`${API_AUTH}/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message ?? 'Erreur mise à jour'); }
      const updated = { ...user, fullname: form.fullname, email: form.email };
      localStorage.setItem('user', JSON.stringify(updated));
      setSuccess(true);
      setTimeout(() => { onSaved(updated); onClose(); }, 1300);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div ref={overlayRef} onClick={e => e.target===overlayRef.current && onClose()} style={{
      position:'fixed', inset:0, zIndex:1000,
      background:'rgba(15,45,16,0.55)', backdropFilter:'blur(4px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:16, animation:'fadeIn 0.2s ease both',
    }}>
      <div style={{
        background:G.white, borderRadius:20, border:`1px solid ${G.border}`,
        boxShadow:'0 24px 64px rgba(15,45,16,0.28)',
        width:'100%', maxWidth:460, fontFamily:'Nunito, sans-serif',
        animation:'slideUp 0.25s ease both', overflow:'hidden',
      }}>
        {/* Header */}
        <div style={{ background:G.dark, padding:'20px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:'50%', background:G.light, color:G.dark,
              display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:14 }}>
              {user?.fullname?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}
            </div>
            <div>
              <p style={{ color:G.white, fontWeight:800, fontSize:14, margin:0 }}>Mon profil</p>
              <p style={{ color:'#ffffff70', fontSize:11, margin:0 }}>Modifier mes informations</p>
            </div>
          </div>
          <button onClick={onClose} style={{
            background:'#ffffff20', border:'none', borderRadius:8, color:G.white,
            width:32, height:32, cursor:'pointer', display:'flex', alignItems:'center',
            justifyContent:'center', fontSize:16, transition:'150ms',
          }}
            onMouseEnter={e=>e.currentTarget.style.background='#ffffff35'}
            onMouseLeave={e=>e.currentTarget.style.background='#ffffff20'}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{ padding:'24px 24px 28px' }}>
          {success ? (
            <div style={{ textAlign:'center', padding:'32px 16px', animation:'fadeIn 0.3s ease both' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
              <p style={{ fontWeight:800, fontSize:16, color:G.main }}>Profil mis à jour !</p>
              <p style={{ fontSize:13, color:G.muted, marginTop:4 }}>Vos informations ont été enregistrées.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{ background:'#fdecea', border:'1px solid #f5c6c6', borderRadius:10,
                  padding:'10px 14px', marginBottom:18, color:G.red, fontSize:13, fontWeight:600 }}>
                  ⚠ {error}
                </div>
              )}

              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:800, letterSpacing:1.2,
                  textTransform:'uppercase', color:G.mid, marginBottom:6 }}>Nom complet</label>
                <input type="text" name="fullname" value={form.fullname}
                  onChange={handleChange} required style={inputStyle} placeholder="Prénom Nom"/>
              </div>

              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:800, letterSpacing:1.2,
                  textTransform:'uppercase', color:G.mid, marginBottom:6 }}>Adresse email</label>
                <input type="email" name="email" value={form.email}
                  onChange={handleChange} required style={inputStyle} placeholder="prenom.nom@ocpgroup.ma"/>
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:10, margin:'20px 0 16px' }}>
                <div style={{ flex:1, height:1, background:G.border }}/>
                <span style={{ fontSize:11, fontWeight:700, color:G.muted, whiteSpace:'nowrap' }}>
                  Changer le mot de passe (optionnel)
                </span>
                <div style={{ flex:1, height:1, background:G.border }}/>
              </div>

              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:800, letterSpacing:1.2,
                  textTransform:'uppercase', color:G.mid, marginBottom:6 }}>Nouveau mot de passe</label>
                <input type="password" name="password" value={form.password}
                  onChange={handleChange} style={inputStyle} placeholder="Laisser vide pour ne pas changer"/>
              </div>

              <div style={{ marginBottom:24 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:800, letterSpacing:1.2,
                  textTransform:'uppercase', color:G.mid, marginBottom:6 }}>Confirmer le mot de passe</label>
                <input type="password" name="confirm" value={form.confirm} onChange={handleChange}
                  style={{ ...inputStyle, borderColor: form.password&&form.confirm&&form.password!==form.confirm?G.red:G.border }}
                  placeholder="••••••••"/>
                {form.password&&form.confirm&&form.password!==form.confirm&&(
                  <p style={{ color:G.red, fontSize:11, marginTop:4, fontWeight:600 }}>
                    Les mots de passe ne correspondent pas
                  </p>
                )}
              </div>

              <div style={{ display:'flex', gap:10 }}>
                <button type="button" onClick={onClose} style={{
                  flex:1, padding:'11px', borderRadius:10, border:`1.5px solid ${G.border}`,
                  background:G.white, color:G.muted, fontSize:13, fontWeight:700,
                  cursor:'pointer', fontFamily:'Nunito, sans-serif', transition:'150ms',
                }}
                  onMouseEnter={e=>e.currentTarget.style.background=G.pale}
                  onMouseLeave={e=>e.currentTarget.style.background=G.white}
                >Annuler</button>

                <button type="submit" disabled={loading} style={{
                  flex:2, padding:'11px', borderRadius:10, border:'none',
                  background: loading?G.mid:G.main, color:G.white,
                  fontSize:13, fontWeight:800, cursor: loading?'not-allowed':'pointer',
                  fontFamily:'Nunito, sans-serif', transition:'150ms',
                  boxShadow:`0 4px 14px ${G.main}40`,
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                }}>
                  {loading ? (
                    <>
                      <div style={{ width:14, height:14, border:`2px solid #ffffff50`,
                        borderTopColor:G.white, borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
                      Enregistrement…
                    </>
                  ) : '💾  Sauvegarder'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ── KPI Card ─────────────────────────────────────────────────
function KpiCard({ label, value, icon, color, bg, trend }) {
  return (
    <div style={{ background:bg||G.white, borderRadius:16, border:`1.5px solid ${color}33`,
      padding:'20px 24px', display:'flex', flexDirection:'column', gap:6,
      boxShadow:`0 4px 20px ${color}15`, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', right:-12, top:-12, width:64, height:64,
        borderRadius:'50%', background:`${color}15`, display:'flex',
        alignItems:'center', justifyContent:'center', fontSize:26 }}>{icon}</div>
      <span style={{ fontSize:11, fontWeight:800, letterSpacing:1.5, textTransform:'uppercase', color }}>{label}</span>
      <span style={{ fontSize:32, fontWeight:900, color:G.dark, lineHeight:1 }}>{value}</span>
      {trend&&<span style={{ fontSize:12, color:G.muted, fontWeight:600 }}>{trend}</span>}
    </div>
  );
}

function SvgLineChart({ data, dataKey, color }) {
  if (!data.length) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:200,color:G.muted,fontSize:13}}>Aucune donnée disponible</div>;
  const W=520,H=200,padL=60,padR=20,padT=16,padB=36;
  const vals=data.map(d=>d[dataKey]||0), max=Math.max(...vals,1);
  const toX=i=>padL+(i/(data.length-1))*(W-padL-padR), toY=v=>padT+((max-v)/max)*(H-padT-padB);
  const pts=data.map((_,i)=>`${toX(i)},${toY(vals[i])}`).join(' ');
  const area=[`${toX(0)},${H-padB}`,...data.map((_,i)=>`${toX(i)},${toY(vals[i])}`),,`${toX(data.length-1)},${H-padB}`].join(' ');
  const ticks=Array.from({length:5},(_,i)=>Math.round(max*i/4));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:200}}>
      <defs><linearGradient id={`lg-${dataKey}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.25"/><stop offset="100%" stopColor={color} stopOpacity="0.01"/></linearGradient></defs>
      {ticks.map((t,i)=>{const y=toY(t);return(<g key={i}><line x1={padL} y1={y} x2={W-padR} y2={y} stroke={G.border} strokeWidth={1} strokeDasharray="4 4"/><text x={padL-6} y={y+4} textAnchor="end" fontSize={9} fill={G.muted} fontFamily="Nunito">{t.toLocaleString('fr-FR')}</text></g>);})}
      <polygon points={area} fill={`url(#lg-${dataKey})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round"/>
      {data.map((d,i)=>{const x=toX(i),y=toY(vals[i]);return(<g key={i}><circle cx={x} cy={y} r={4} fill={color} stroke={G.white} strokeWidth={2}/>{(data.length<=6||i%2===0)&&<text x={x} y={H-padB+14} textAnchor="middle" fontSize={9} fill={G.muted} fontFamily="Nunito">{d.mois?.slice(0,3)}</text>}</g>);})}
      <line x1={padL} y1={padT} x2={padL} y2={H-padB} stroke={G.border} strokeWidth={1}/>
      <line x1={padL} y1={H-padB} x2={W-padR} y2={H-padB} stroke={G.border} strokeWidth={1}/>
    </svg>
  );
}

function SvgBarChart({ data, dataKey, color }) {
  if (!data.length) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:200,color:G.muted,fontSize:13}}>Aucune donnée disponible</div>;
  const W=520,H=200,padL=60,padR=20,padT=16,padB=36;
  const vals=data.map(d=>d[dataKey]||0),max=Math.max(...vals,1);
  const gap=(W-padL-padR)/data.length,barW=Math.max(gap*0.6,4);
  const toX=i=>padL+i*gap+gap/2,toY=v=>padT+((max-v)/max)*(H-padT-padB),toH=v=>(v/max)*(H-padT-padB);
  const ticks=Array.from({length:5},(_,i)=>Math.round(max*i/4));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:200}}>
      <defs><linearGradient id={`bg-${dataKey}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="1"/><stop offset="100%" stopColor={color} stopOpacity="0.5"/></linearGradient></defs>
      {ticks.map((t,i)=>{const y=toY(t);return(<g key={i}><line x1={padL} y1={y} x2={W-padR} y2={y} stroke={G.border} strokeWidth={1} strokeDasharray="4 4"/><text x={padL-6} y={y+4} textAnchor="end" fontSize={9} fill={G.muted} fontFamily="Nunito">{t.toLocaleString('fr-FR')}</text></g>);})}
      {data.map((d,i)=>{const x=toX(i),bH=toH(vals[i]),y=H-padB-bH;return(<g key={i}><rect x={x-barW/2} y={y} width={barW} height={bH} rx={4} fill={`url(#bg-${dataKey})`}/>{(data.length<=8||i%2===0)&&<text x={x} y={H-padB+14} textAnchor="middle" fontSize={9} fill={G.muted} fontFamily="Nunito">{d.mois?.slice(0,3)}</text>}</g>);})}
      <line x1={padL} y1={padT} x2={padL} y2={H-padB} stroke={G.border} strokeWidth={1}/>
      <line x1={padL} y1={H-padB} x2={W-padR} y2={H-padB} stroke={G.border} strokeWidth={1}/>
    </svg>
  );
}

function Selector({ items, selected, onChange }) {
  return (
    <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>
      {items.map(it=>(
        <button key={it} onClick={()=>onChange(it)} style={{
          padding:'4px 14px',borderRadius:99,fontSize:11,fontWeight:700,
          border:`1.5px solid ${selected===it?G.main:G.border}`,
          background:selected===it?G.main:G.white,color:selected===it?G.white:G.muted,
          cursor:'pointer',transition:'180ms',fontFamily:'Nunito, sans-serif',
        }}>{it}</button>
      ))}
    </div>
  );
}

function Section({ title, icon, badge, children, loading, error, accentColor }) {
  const color=accentColor||G.main;
  return (
    <div style={{ background:G.white,borderRadius:20,border:`1px solid ${G.border}`,
      boxShadow:'0 2px 16px rgba(26,92,28,0.08)',padding:'28px 32px 24px',marginBottom:24,fontFamily:'Nunito, sans-serif' }}>
      <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:20,paddingBottom:16,borderBottom:`1.5px solid ${G.pale}` }}>
        <div style={{ width:36,height:36,borderRadius:10,background:`${color}18`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18 }}>{icon}</div>
        <span style={{ fontWeight:900,fontSize:13,letterSpacing:1,textTransform:'uppercase',color:G.dark }}>{title}</span>
        {badge!=null&&<span style={{ marginLeft:'auto',background:`${color}15`,color,fontSize:11,fontWeight:800,padding:'3px 12px',borderRadius:99,border:`1px solid ${color}30` }}>{badge}</span>}
      </div>
      {loading&&<div style={{textAlign:'center',padding:'48px 0',color:G.muted}}><div style={{display:'inline-block',width:32,height:32,border:`3px solid ${G.pale}`,borderTopColor:color,borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/><p style={{marginTop:12,fontSize:13,fontWeight:600}}>Chargement…</p></div>}
      {error&&!loading&&<div style={{background:'#fdecea',border:'1px solid #f5c6c6',borderRadius:10,padding:'14px 18px',color:G.red,fontSize:13,fontWeight:600}}>⚠ {error}</div>}
      {!loading&&!error&&children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTIONS WITH EXPORT
// ═══════════════════════════════════════════════════════════════

function ChargesSection() {
  const [data,setData]=useState([]),[postes,setPostes]=useState([]),[poste,setPoste]=useState('');
  const [loading,setLoading]=useState(true),[error,setError]=useState(null),[chartType,setChartType]=useState('line');
  useEffect(()=>{fetch(`${API_AI}/prediction/charges`).then(r=>r.json()).then(j=>{const p=j.predictions??[];const u=[...new Set(p.map(x=>x.poste))];setPostes(u);setPoste(u[0]??'');setData(p);setLoading(false);}).catch(()=>{setError('Impossible de contacter /prediction/charges');setLoading(false);});},[]);
  const filtered=sortByMois(data.filter(d=>d.poste===poste));
  const total=filtered.reduce((s,d)=>s+(d.cout_prevu||0),0);

  const COLS = ['Poste', 'Mois', 'Coût prévu (MAD)'];
  const rows  = () => filtered.map(d => [d.poste, d.mois, fmtNum(d.cout_prevu)]);

  const handlePDF   = () => exportPDF(`Prédiction des charges — ${poste}`, COLS, rows(), `charges_${poste}`);
  const handleExcel = () => exportExcel('Charges', COLS, filtered.map(d=>[d.poste, d.mois, d.cout_prevu ?? 0]), `charges_${poste}`);

  return (
    <Section title="Prédiction des charges" icon="📈" badge={`${data.length} prédictions`} loading={loading} error={error} accentColor={G.main}>
      <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:12,marginBottom:16}}>
        <Selector items={postes} selected={poste} onChange={setPoste}/>
        <div style={{display:'flex',gap:6}}>
          {['line','bar'].map(t=><button key={t} onClick={()=>setChartType(t)} style={{padding:'4px 12px',borderRadius:8,fontSize:11,fontWeight:700,border:`1.5px solid ${chartType===t?G.main:G.border}`,background:chartType===t?G.main:G.white,color:chartType===t?G.white:G.muted,cursor:'pointer',fontFamily:'Nunito'}}>{t==='line'?'〰 Ligne':'▬ Barres'}</button>)}
        </div>
      </div>
      {chartType==='line'?<SvgLineChart data={filtered} dataKey="cout_prevu" color={G.main}/>:<SvgBarChart data={filtered} dataKey="cout_prevu" color={G.main}/>}
      <div style={{marginTop:12,display:'flex',alignItems:'center'}}>
        <span style={{fontSize:11,color:G.muted,fontStyle:'italic'}}>Régression linéaire · Projection sur les mois restants</span>
        {filtered.length>0&&<span style={{marginLeft:'auto',fontWeight:800,fontSize:13,color:G.main}}>Total prévu : {total.toLocaleString('fr-FR')} MAD</span>}
      </div>
      <ExportBar onPDF={handlePDF} onExcel={handleExcel}/>
    </Section>
  );
}

function ProductionSection() {
  const [data,setData]=useState([]),[activites,setActivites]=useState([]),[activite,setActivite]=useState('');
  const [loading,setLoading]=useState(true),[error,setError]=useState(null),[chartType,setChartType]=useState('bar');
  useEffect(()=>{fetch(`${API_AI}/prediction/production`).then(r=>r.json()).then(j=>{const p=j.predictions??[];const u=[...new Set(p.map(x=>x.activite))];setActivites(u);setActivite(u[0]??'');setData(p);setLoading(false);}).catch(()=>{setError('Impossible de contacter /prediction/production');setLoading(false);});},[]);
  const filtered=sortByMois(data.filter(d=>d.activite===activite));
  const total=filtered.reduce((s,d)=>s+(d.tonnage_prevu||0),0);

  const COLS = ['Activité', 'Mois', 'Tonnage prévu (T)'];
  const rows  = () => filtered.map(d => [d.activite, d.mois, fmtNum(d.tonnage_prevu)]);

  const handlePDF   = () => exportPDF(`Prédiction de production — ${activite}`, COLS, rows(), `production_${activite}`);
  const handleExcel = () => exportExcel('Production', COLS, filtered.map(d=>[d.activite, d.mois, d.tonnage_prevu ?? 0]), `production_${activite}`);

  return (
    <Section title="Prédiction de production" icon="⚙️" badge={`${data.length} prédictions`} loading={loading} error={error} accentColor="#1565c0">
      <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:12,marginBottom:16}}>
        <Selector items={activites} selected={activite} onChange={setActivite}/>
        <div style={{display:'flex',gap:6}}>
          {['bar','line'].map(t=><button key={t} onClick={()=>setChartType(t)} style={{padding:'4px 12px',borderRadius:8,fontSize:11,fontWeight:700,border:`1.5px solid ${chartType===t?'#1565c0':G.border}`,background:chartType===t?'#1565c0':G.white,color:chartType===t?G.white:G.muted,cursor:'pointer',fontFamily:'Nunito'}}>{t==='line'?'〰 Ligne':'▬ Barres'}</button>)}
        </div>
      </div>
      {chartType==='line'?<SvgLineChart data={filtered} dataKey="tonnage_prevu" color="#1565c0"/>:<SvgBarChart data={filtered} dataKey="tonnage_prevu" color="#1565c0"/>}
      <div style={{marginTop:12,display:'flex',alignItems:'center'}}>
        <span style={{fontSize:11,color:G.muted,fontStyle:'italic'}}>Régression linéaire · Projection sur les mois restants</span>
        {filtered.length>0&&<span style={{marginLeft:'auto',fontWeight:800,fontSize:13,color:'#1565c0'}}>Total prévu : {total.toLocaleString('fr-FR')} T</span>}
      </div>
      <ExportBar onPDF={handlePDF} onExcel={handleExcel}/>
    </Section>
  );
}

function AnomaliesSection({ onKpiLoad }) {
  const [data,setData]=useState([]),[total,setTotal]=useState(0);
  const [loading,setLoading]=useState(true),[error,setError]=useState(null);
  const [filtre,setFiltre]=useState('TOUS'),[page,setPage]=useState(0);
  const PER_PAGE=6;
  useEffect(()=>{fetch(`${API_AI}/anomalies`).then(r=>r.json()).then(j=>{setData(j.anomalies??[]);setTotal(j.total??0);onKpiLoad&&onKpiLoad(j.anomalies??[],j.total??0);setLoading(false);}).catch(()=>{setError('Impossible de contacter /anomalies');setLoading(false);});},[]);
  const niveaux=['TOUS',...new Set(data.map(d=>d.niveau))];
  const filtered=filtre==='TOUS'?data:data.filter(d=>d.niveau===filtre);
  const paged=filtered.slice(page*PER_PAGE,(page+1)*PER_PAGE);
  const pages=Math.ceil(filtered.length/PER_PAGE);
  const ns=n=>({CRITIQUE:{bg:'#fdecea',color:G.red,border:'#f5c6c666',label:'🔴 CRITIQUE'},ATTENTION:{bg:'#fff8e1',color:G.amber,border:'#f9a82566',label:'🟡 ATTENTION'},INCONNU:{bg:G.pale,color:G.muted,border:G.border,label:'⚪ INCONNU'}}[n]||{bg:G.pale,color:G.muted,border:G.border,label:n});

  const COLS = ['Date', 'Poste', 'Mois', 'Réalisé', 'Prévu', 'Écart', 'Niveau'];
  const exportRows = () => filtered.map(a => [
    a.date?.slice(0,10) ?? '',
    a.poste ?? '',
    a.mois ?? '',
    fmtNum(a.realise),
    fmtNum(a.prevu),
    fmtNum(a.ecart),
    a.niveau ?? '',
  ]);

  const handlePDF   = () => exportPDF(`Anomalies — Isolation Forest (filtre : ${filtre})`, COLS, exportRows(), `anomalies_${filtre}`);
  const handleExcel = () => exportExcel('Anomalies', COLS, exportRows(), `anomalies_${filtre}`);

  return (
    <Section title="Anomalies — Isolation Forest" icon="🔍" badge={`${total} total`} loading={loading} error={error} accentColor={G.red}>
      {!loading&&!error&&(<>
        <Selector items={niveaux} selected={filtre} onChange={v=>{setFiltre(v);setPage(0);}}/>
        <div style={{overflowX:'auto',borderRadius:12,border:`1px solid ${G.border}`}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontFamily:'Nunito',fontSize:13}}>
            <thead><tr style={{background:G.pale}}>{['Date','Poste','Mois','Réalisé','Prévu','Écart','Niveau'].map(h=><th key={h} style={{padding:'10px 14px',textAlign:'left',fontWeight:900,fontSize:10,letterSpacing:1.5,textTransform:'uppercase',color:G.main,borderBottom:`1.5px solid ${G.border}`}}>{h}</th>)}</tr></thead>
            <tbody>
              {paged.length===0?<tr><td colSpan={7} style={{textAlign:'center',padding:'32px',color:G.muted}}>Aucune anomalie pour ce filtre.</td></tr>
                :paged.map((a,i)=>{const s=ns(a.niveau);return(<tr key={i} style={{borderBottom:`1px solid ${G.border}`,background:i%2===0?G.white:'#fafef9',transition:'150ms'}} onMouseEnter={e=>e.currentTarget.style.background=G.pale} onMouseLeave={e=>e.currentTarget.style.background=i%2===0?G.white:'#fafef9'}>
                  <td style={{padding:'10px 14px',color:G.muted,fontSize:12}}>{a.date?.slice(0,10)}</td>
                  <td style={{padding:'10px 14px',fontWeight:800,color:G.dark}}>{a.poste}</td>
                  <td style={{padding:'10px 14px',color:G.muted}}>{a.mois}</td>
                  <td style={{padding:'10px 14px',fontWeight:700}}>{a.realise?.toLocaleString('fr-FR')}</td>
                  <td style={{padding:'10px 14px'}}>{a.prevu?.toLocaleString('fr-FR')}</td>
                  <td style={{padding:'10px 14px',fontWeight:700,color:a.ecart<0?G.red:G.light}}>{a.ecart>0?'+':''}{a.ecart?.toLocaleString('fr-FR')}</td>
                  <td style={{padding:'10px 14px'}}><span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'3px 10px',borderRadius:99,fontSize:11,fontWeight:800,background:s.bg,color:s.color,border:`1px solid ${s.border}`}}>{s.label}</span></td>
                </tr>);})}
            </tbody>
          </table>
        </div>
        {pages>1&&<div style={{display:'flex',justifyContent:'center',gap:6,marginTop:16}}>{Array.from({length:pages},(_,i)=><button key={i} onClick={()=>setPage(i)} style={{width:32,height:32,borderRadius:8,border:`1.5px solid ${page===i?G.main:G.border}`,background:page===i?G.main:G.white,color:page===i?G.white:G.muted,fontWeight:800,fontSize:13,cursor:'pointer',fontFamily:'Nunito'}}>{i+1}</button>)}</div>}
        <ExportBar onPDF={handlePDF} onExcel={handleExcel}/>
      </>)}
    </Section>
  );
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD PRINCIPAL
// ═══════════════════════════════════════════════════════════════
const TABS = [
  { id:'dashboard', label:'Tableau de bord', icon:'📊' },
  { id:'upload',    label:'Import données',  icon:'↑'  },
];

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('user')));
  const navigate = useNavigate();
  const [tab,        setTab]        = useState('dashboard');
  const [kpiData,    setKpiData]    = useState({ total:0, critique:0, attention:0 });
  const [showProfile,setShowProfile]= useState(false);

  const initials = currentUser?.fullname?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) ?? 'OC';

  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/'); };
  const handleKpiLoad = (anomalies, total) => setKpiData({ total, critique: anomalies.filter(d=>d.niveau==='CRITIQUE').length, attention: anomalies.filter(d=>d.niveau==='ATTENTION').length });
  const handleProfileSaved = updated => setCurrentUser(updated);

  const hour = new Date().getHours();
  const greeting = hour<12?'Bonjour':hour<18?'Bon après-midi':'Bonsoir';

  return (
    <div style={{ minHeight:'100vh', background:G.bg, fontFamily:'Nunito, sans-serif' }}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        @keyframes slideUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
      `}</style>

      {/* TOP BAR */}
      <nav style={{ background:G.dark, borderBottom:`3px solid ${G.light}`, padding:'0 32px',
        height:60, display:'flex', alignItems:'center', justifyContent:'space-between',
        position:'sticky', top:0, zIndex:100, boxShadow:'0 4px 24px rgba(0,0,0,0.25)' }}>

        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <img src={ocpLogo} alt="OCP" style={{ height:32, filter:'brightness(0) invert(1)' }}/>
          <div style={{ width:1, height:28, background:'#ffffff30' }}/>
          <span style={{ color:'#ffffffcc', fontSize:13, fontWeight:700, letterSpacing:1 }}>PORTAIL RH</span>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {/* Bouton avatar → ouvre le profil */}
          <button onClick={()=>setShowProfile(true)} title="Modifier mon profil" style={{
            display:'flex', alignItems:'center', gap:10,
            background:'#ffffff15', border:`1.5px solid #ffffff30`, borderRadius:10,
            padding:'5px 12px 5px 6px', cursor:'pointer', transition:'180ms',
          }}
            onMouseEnter={e=>e.currentTarget.style.background='#ffffff25'}
            onMouseLeave={e=>e.currentTarget.style.background='#ffffff15'}
          >
            <div style={{ width:34, height:34, borderRadius:'50%', background:G.light, color:G.dark,
              display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:12 }}>
              {initials}
            </div>
            <div style={{ textAlign:'left' }}>
              <div style={{ color:G.white, fontSize:12, fontWeight:700 }}>{currentUser?.fullname}</div>
              <div style={{ color:'#ffffff70', fontSize:10, fontWeight:600 }}>✏️ Modifier le profil</div>
            </div>
          </button>

          <button onClick={handleLogout} style={{
            background:'transparent', border:`1.5px solid #ffffff40`, color:'#ffffffcc',
            borderRadius:8, padding:'6px 14px', fontSize:11, fontWeight:700,
            cursor:'pointer', letterSpacing:0.5, transition:'180ms', fontFamily:'Nunito, sans-serif',
          }}
            onMouseEnter={e=>{e.currentTarget.style.background='#ffffff20';e.currentTarget.style.borderColor=G.light;}}
            onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor='#ffffff40';}}
          >Déconnexion</button>
        </div>
      </nav>

      {/* MAIN */}
      <main style={{ maxWidth:1100, margin:'0 auto', padding:'32px 24px 80px' }}>

        <div style={{ marginBottom:28, animation:'fadeUp 0.4s ease both' }}>
          <p style={{ fontSize:11, fontWeight:800, letterSpacing:2, textTransform:'uppercase', color:G.mid, marginBottom:4 }}>Espace contrôleur</p>
          <h1 style={{ fontSize:26, fontWeight:900, color:G.dark, margin:0 }}>
            {greeting}, <span style={{ color:G.main }}>{currentUser?.fullname}</span>
          </h1>
          <p style={{ color:G.muted, fontSize:13, marginTop:4 }}>
            {new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
          </p>
        </div>

        <div style={{ display:'flex', gap:4, marginBottom:28, borderBottom:`2px solid ${G.border}`, animation:'fadeUp 0.4s 0.05s ease both' }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              display:'flex', alignItems:'center', gap:8, padding:'10px 20px',
              background:'none', border:'none', cursor:'pointer', fontFamily:'Nunito, sans-serif',
              fontSize:13, fontWeight:800,
              color: tab===t.id?G.main:G.muted,
              borderBottom: `2px solid ${tab===t.id?G.main:'transparent'}`,
              marginBottom:-2, letterSpacing:0.5, transition:'150ms',
            }}><span>{t.icon}</span> {t.label}</button>
          ))}
        </div>

        {tab==='upload'&&<div style={{animation:'fadeUp 0.3s ease both'}}><UploadBox/></div>}

        {tab==='dashboard'&&(
          <div style={{animation:'fadeUp 0.3s ease both'}}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16, marginBottom:28 }}>
              <KpiCard label="Anomalies totales" value={kpiData.total} icon="🔍" color={G.main} bg={G.pale} trend="Détectées par Isolation Forest"/>
              <KpiCard label="Critiques" value={kpiData.critique} icon="🔴" color={G.red} bg="#fdecea" trend="Nécessitent une action immédiate"/>
              <KpiCard label="Attention" value={kpiData.attention} icon="🟡" color={G.amber} bg="#fff8e1" trend="À surveiller de près"/>
              <KpiCard label="Modèles IA actifs" value={3} icon="🤖" color="#1565c0" bg="#e3f2fd" trend="Régression · IsoForest · LLaMA"/>
            </div>
            <ChargesSection/>
            <ProductionSection/>
            <AnomaliesSection onKpiLoad={handleKpiLoad}/>
          </div>
        )}
      </main>

      {/* Modal profil */}
      {showProfile&&<ProfileModal user={currentUser} onClose={()=>setShowProfile(false)} onSaved={handleProfileSaved}/>}

      <AIChatbot/>
    </div>
  );
}