// Dashboard.jsx — OCP Youssoufia · Tableau de bord complet
// Style original conservé · Nouvelles sections Analyse avec filtres sidebar
// Tous les émojis remplacés par des icônes react-icons

import '../styles/Dashboard.css';
import ocpLogo from '../assets/ocp-logo.png';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useState, useEffect, useRef, useMemo } from 'react';
import UploadBox from '../components/UploadBox';
import AIChatbot from '../components/AIChatbot';

// Import des icônes (sélection complète)
import { 
  FaMoneyBillWave, FaCogs, FaCheckCircle, FaExclamationTriangle, 
  FaSearch, FaChartBar, FaChartLine, FaUpload, FaRobot, 
  FaSignOutAlt, FaEdit, FaRegCalendarAlt, FaDollarSign, 
  FaBalanceScale, FaClipboardList, FaArrowUp, FaArrowDown, 
  FaTimes, FaSyncAlt, FaFilter, FaQuestionCircle,
  FaFileExcel, FaFilePdf, FaRegSave, FaEye, FaEyeSlash, FaLock
} from 'react-icons/fa';

const API_AI   = 'http://localhost:8000';
const API_AUTH = 'http://localhost:3000';

const G = {
  dark:   '#0f2d10', main:   '#1a5c1c', mid:    '#2d7a30',
  light:  '#4caf50', pale:   '#e8f5e9', bg:     '#f0f7f0',
  border: '#b2dfb4', red:    '#d32f2f', amber:  '#f57f17',
  white:  '#ffffff', text:   '#1a2e1a', muted:  '#5a7a5c',
  yellow: '#fdd835', pale2:  '#c8e6c9', blue:   '#1565c0', bluePale:'#e3f2fd',
};

const MOIS_ORDER = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const sortByMois = arr => [...arr].sort((a,b) => MOIS_ORDER.indexOf(a.mois) - MOIS_ORDER.indexOf(b.mois));
const fmt = (n, suf='') => {
  if (n==null||isNaN(n)) return '—';
  const a=Math.abs(n);
  if (a>=1e6) return `${(n/1e6).toFixed(2)}M${suf}`;
  if (a>=1e3) return `${(n/1e3).toFixed(1)}K${suf}`;
  return `${Number(n).toLocaleString('fr-FR')}${suf}`;
};
const fmtNum = v => v==null?'': Number(v).toLocaleString('fr-FR').replace(/\u00A0/g,' ');

// ─── log + export helpers ─────────────────────────────────────
async function logAction(action, module, details) {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;
    await fetch(`${API_AUTH}/logs`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},body:JSON.stringify({action,module,details})});
  } catch {}
}
function loadJsPDF(cb){if(window.jspdf?.jsPDF){cb(window.jspdf.jsPDF);return;}const s1=document.createElement('script');s1.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';s1.onload=()=>{const s2=document.createElement('script');s2.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js';s2.onload=()=>cb(window.jspdf.jsPDF);document.head.appendChild(s2);};document.head.appendChild(s1);}
function loadXLSX(cb){if(window.XLSX){cb(window.XLSX);return;}const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';s.onload=()=>cb(window.XLSX);document.head.appendChild(s);}
function exportPDF(title,columns,rows,filename){loadJsPDF(jsPDF=>{const doc=new jsPDF({orientation:'landscape',unit:'pt',format:'a4'});doc.setFillColor(15,45,16);doc.rect(0,0,doc.internal.pageSize.getWidth(),44,'F');doc.setTextColor(255,255,255);doc.setFontSize(14);doc.setFont('helvetica','bold');doc.text('OCP — YOUSSOUFIA',32,28);doc.setFontSize(10);doc.setFont('helvetica','normal');doc.text(title,32,40);doc.setTextColor(90,122,92);doc.setFontSize(8);doc.text(`Exporté le ${new Date().toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'})}`,doc.internal.pageSize.getWidth()-32,40,{align:'right'});doc.autoTable({startY:56,head:[columns],body:rows,styles:{font:'helvetica',fontSize:9,cellPadding:6},headStyles:{fillColor:[26,92,28],textColor:255,fontStyle:'bold',fontSize:9},alternateRowStyles:{fillColor:[240,247,240]},tableLineColor:[178,223,180],tableLineWidth:0.5});doc.save(`${filename}.pdf`);});logAction('EXPORT_PDF','Dashboard',`fichier=${filename}.pdf, titre=${title}`);}
function exportExcel(sheetName,columns,rows,filename){loadXLSX(XLSX=>{const wsData=[columns,...rows];const ws=XLSX.utils.aoa_to_sheet(wsData);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,sheetName);XLSX.writeFile(wb,`${filename}.xlsx`);});logAction('EXPORT_EXCEL','Dashboard',`fichier=${filename}.xlsx, feuille=${sheetName}`);}

// ═══════════════════════════════════════════════════════════════
// COMPOSANTS UI
// ═══════════════════════════════════════════════════════════════

function KpiCard({ label, value, icon, color = G.main, bg = G.pale, trend }) {
  return (
    <div style={{ background:bg, borderRadius:14, border:`1.5px solid ${color}22`,
      padding:'16px 18px', boxShadow:'0 2px 12px rgba(26,92,28,0.08)',
      fontFamily:'Nunito, sans-serif', minWidth:0, overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:7 }}>
        <span style={{ fontSize:18, flexShrink:0, lineHeight:1 }}>{icon}</span>
        <span style={{ fontSize:9.5, fontWeight:800, letterSpacing:1.4,
          textTransform:'uppercase', color:G.muted, lineHeight:1.3 }}>{label}</span>
      </div>
      <div style={{ fontSize:22, fontWeight:900, color, lineHeight:1.1, wordBreak:'break-word' }}>{value}</div>
      {trend && <div style={{ fontSize:10.5, color:G.muted, marginTop:5, lineHeight:1.4 }}>{trend}</div>}
    </div>
  );
}

function ExportBar({ onPDF, onExcel }) {
  const btnBase = {
    display:'inline-flex', alignItems:'center', gap:6,
    padding:'6px 16px', borderRadius:8, fontSize:11, fontWeight:700,
    cursor:'pointer', fontFamily:'Nunito, sans-serif', transition:'150ms',
    border:'1.5px solid',
  };
  return (
    <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:16,
      paddingTop:12, borderTop:`1px solid ${G.border}` }}>
      <button onClick={onExcel} style={{...btnBase,background:'#e8f5e9',color:G.main,borderColor:G.border}}
        onMouseEnter={e=>e.currentTarget.style.background='#c8e6c9'}
        onMouseLeave={e=>e.currentTarget.style.background='#e8f5e9'}>
        <FaFileExcel style={{ fontSize:13 }} /> Exporter Excel
      </button>
      <button onClick={onPDF} style={{...btnBase,background:'#fdecea',color:G.red,borderColor:'#ef9a9a'}}
        onMouseEnter={e=>e.currentTarget.style.background='#ffcdd2'}
        onMouseLeave={e=>e.currentTarget.style.background='#fdecea'}>
        <FaFilePdf style={{ fontSize:13 }} /> Exporter PDF
      </button>
    </div>
  );
}

function Section({ title, icon, badge, children, loading, error, accentColor, padContent=true }) {
  const color = accentColor || G.main;
  return (
    <div style={{ background:G.white, borderRadius:20, border:`1px solid ${G.border}`,
      boxShadow:'0 2px 16px rgba(26,92,28,0.08)', padding:'28px 0 24px',
      marginBottom:24, fontFamily:'Nunito, sans-serif', overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20,
        paddingBottom:16, borderBottom:`1.5px solid ${G.pale}`, paddingLeft:32, paddingRight:32 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:`${color}18`,
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{icon}</div>
        <span style={{ fontWeight:900, fontSize:13, letterSpacing:1,
          textTransform:'uppercase', color:G.dark }}>{title}</span>
        {badge!=null && <span style={{ marginLeft:'auto', background:`${color}15`, color,
          fontSize:11, fontWeight:800, padding:'3px 12px', borderRadius:99,
          border:`1px solid ${color}30` }}>{badge}</span>}
      </div>
      {loading && <div style={{textAlign:'center',padding:'48px 0',color:G.muted}}>
        <div style={{display:'inline-block',width:32,height:32,border:`3px solid ${G.pale}`,
          borderTopColor:color,borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
        <p style={{marginTop:12,fontSize:13,fontWeight:600}}>Chargement…</p>
      </div>}
      {error&&!loading && <div style={{background:'#fdecea',border:'1px solid #f5c6c6',
        borderRadius:10,padding:'14px 18px',color:G.red,fontSize:13,fontWeight:600,margin:'0 32px'}}>
        <FaExclamationTriangle style={{ marginRight:8, fontSize:14 }} /> {error}
      </div>}
      {!loading&&!error&&(
        padContent
          ? <div style={{padding:'0 32px'}}>{children}</div>
          : children
      )}
    </div>
  );
}

function Selector({ items, selected, onChange }) {
  return (
    <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>
      {items.map(it=>(
        <button key={it} onClick={()=>onChange(it)} style={{
          padding:'4px 14px', borderRadius:99, fontSize:11, fontWeight:700,
          border:`1.5px solid ${selected===it?G.main:G.border}`,
          background:selected===it?G.main:G.white,
          color:selected===it?G.white:G.muted,
          cursor:'pointer', transition:'180ms', fontFamily:'Nunito, sans-serif',
        }}>{it}</button>
      ))}
    </div>
  );
}

function CheckGroup({ title, items, selected, onChange }) {
  const toggle = val => {
    const next = selected.includes(val) ? selected.filter(x=>x!==val) : [...selected,val];
    onChange(next.length===0 ? [...items] : next);
  };
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontSize:10, fontWeight:800, letterSpacing:1.5, textTransform:'uppercase',
        color:G.mid, marginBottom:10, paddingBottom:6, borderBottom:`1px solid ${G.border}` }}>
        {title}
      </div>
      {items.map(item=>(
        <label key={item} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0',
          cursor:'pointer', fontSize:12, fontWeight:600, color:G.text, fontFamily:'Nunito, sans-serif' }}>
          <div onClick={()=>toggle(item)} style={{
            width:15, height:15, borderRadius:4,
            border:`2px solid ${selected.includes(item)?G.main:G.border}`,
            background:selected.includes(item)?G.main:G.white,
            display:'flex', alignItems:'center', justifyContent:'center',
            transition:'150ms', cursor:'pointer', flexShrink:0,
          }}>
            {selected.includes(item) && <FaCheckCircle style={{ color:G.white, fontSize:9 }} />}
          </div>
          {item}
        </label>
      ))}
    </div>
  );
}

function Legend({ items }) {
  return (
    <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:10}}>
      {items.map(({color,label,dash})=>(
        <div key={label} style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:G.muted}}>
          <svg width={14} height={10}>
            {dash
              ? <line x1={0} y1={5} x2={14} y2={5} stroke={color} strokeWidth={2} strokeDasharray="4,2"/>
              : <rect x={0} y={0} width={14} height={10} fill={color} rx={2}/>}
          </svg>
          {label}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// GRAPHIQUES SVG
// ═══════════════════════════════════════════════════════════════

function SvgBarChart({ data, dataKey, color=G.main }) {
  const W=520, H=200, padL=55, padR=20, padT=16, padB=36;
  const vals = data.map(d=>d[dataKey]||0);
  const maxV = Math.max(...vals,1);
  const minV = 0;
  const iH=H-padT-padB, iW=W-padL-padR;
  const toX=i=>padL+i*(iW/(data.length||1))+(iW/(data.length||1))/2;
  const toY=v=>padT+iH-((v-minV)/(maxV-minV||1))*iH;
  const toH=v=>((v-minV)/(maxV-minV||1))*iH;
  const barW=Math.max(8, iW/(data.length||1)*0.55);
  const ticks=[minV, maxV*0.25, maxV*0.5, maxV*0.75, maxV].map(v=>Math.round(v));
  if (!data.length) return <div style={{textAlign:'center',padding:'30px 0',color:G.muted,fontSize:12}}>Aucune donnée</div>;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:200}}>
      <defs><linearGradient id={`bg-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="1"/>
        <stop offset="100%" stopColor={color} stopOpacity="0.5"/>
      </linearGradient></defs>
      {ticks.map((t,i)=>{const y=toY(t);return(<g key={i}>
        <line x1={padL} y1={y} x2={W-padR} y2={y} stroke={G.border} strokeWidth={1} strokeDasharray="4 4"/>
        <text x={padL-6} y={y+4} textAnchor="end" fontSize={9} fill={G.muted} fontFamily="Nunito">{fmt(t)}</text>
      </g>);})}
      {data.map((d,i)=>{const x=toX(i),bH=toH(vals[i]),y=H-padB-bH;return(<g key={i}>
        <rect x={x-barW/2} y={y} width={barW} height={bH} rx={4} fill={`url(#bg-${dataKey})`}/>
        {(data.length<=8||i%2===0)&&<text x={x} y={H-padB+14} textAnchor="middle" fontSize={9} fill={G.muted} fontFamily="Nunito">{d.mois?.slice(0,3)}</text>}
      </g>);})}
      <line x1={padL} y1={padT} x2={padL} y2={H-padB} stroke={G.border} strokeWidth={1}/>
      <line x1={padL} y1={H-padB} x2={W-padR} y2={H-padB} stroke={G.border} strokeWidth={1}/>
    </svg>
  );
}

function SvgLineChart({ data, dataKey, color=G.main }) {
  const W=520, H=200, padL=55, padR=20, padT=16, padB=36;
  const vals=data.map(d=>d[dataKey]||0);
  const maxV=Math.max(...vals,1), minV=Math.min(...vals,0);
  const iH=H-padT-padB, iW=W-padL-padR;
  const toX=i=>padL+i*(iW/((data.length-1)||1));
  const toY=v=>padT+iH-((v-minV)/(maxV-minV||1))*iH;
  const ticks=[minV, minV+(maxV-minV)*0.25, minV+(maxV-minV)*0.5, minV+(maxV-minV)*0.75, maxV].map(v=>Math.round(v));
  const pts=data.map((d,i)=>`${toX(i)},${toY(vals[i])}`).join(' ');
  const fillPts=`${padL},${H-padB} ${pts} ${toX(data.length-1)},${H-padB}`;
  if (!data.length) return <div style={{textAlign:'center',padding:'30px 0',color:G.muted,fontSize:12}}>Aucune donnée</div>;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:200}}>
      <defs><linearGradient id={`fill-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.18"/>
        <stop offset="100%" stopColor={color} stopOpacity="0.01"/>
      </linearGradient></defs>
      {ticks.map((t,i)=>{const y=toY(t);return(<g key={i}>
        <line x1={padL} y1={y} x2={W-padR} y2={y} stroke={G.border} strokeWidth={1} strokeDasharray="4 4"/>
        <text x={padL-6} y={y+4} textAnchor="end" fontSize={9} fill={G.muted} fontFamily="Nunito">{fmt(t)}</text>
      </g>);})}
      <polygon points={fillPts} fill={`url(#fill-${dataKey})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round"/>
      {data.map((d,i)=><circle key={i} cx={toX(i)} cy={toY(vals[i])} r={3.5} fill={G.white} stroke={color} strokeWidth={2}/>)}
      {data.map((d,i)=><text key={i} x={toX(i)} y={H-padB+14} textAnchor="middle" fontSize={9} fill={G.muted} fontFamily="Nunito">{d.mois?.slice(0,3)}</text>)}
      <line x1={padL} y1={padT} x2={padL} y2={H-padB} stroke={G.border} strokeWidth={1}/>
      <line x1={padL} y1={H-padB} x2={W-padR} y2={H-padB} stroke={G.border} strokeWidth={1}/>
    </svg>
  );
}

function GroupedBarLineChart({ data, keyA, keyB, keyLine, colorA=G.dark, colorB=G.light, colorLine=G.yellow }) {
  if (!data.length) return <div style={{textAlign:'center',padding:'30px 0',color:G.muted,fontSize:12}}>Aucune donnée</div>;
  const W=500, H=200, pL=55, pR=20, pT=16, pB=40;
  const iW=W-pL-pR, iH=H-pT-pB;
  const maxV=Math.max(...data.flatMap(d=>[d[keyA]||0,d[keyB]||0]))*1.15||1;
  const lines=data.map(d=>d[keyLine]||0);
  const minL=Math.min(...lines), maxL=Math.max(...lines), rangeL=(maxL-minL)||1;
  const step=iW/data.length, bW=step*0.32;
  const yV=v=>pT+iH-(v/maxV)*iH;
  const yL=v=>pT+iH*0.1+(1-(v-minL)/rangeL)*iH*0.55;
  const ticks=4;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:200}}>
      {Array.from({length:ticks+1},(_,i)=>{
        const y=pT+(i/ticks)*iH; const v=maxV*(1-i/ticks);
        return <g key={i}>
          <line x1={pL} y1={y} x2={W-pR} y2={y} stroke={G.border} strokeWidth={0.5} strokeDasharray="3,3"/>
          <text x={pL-4} y={y+4} textAnchor="end" fontSize={8} fill={G.muted}>{fmt(v)}</text>
        </g>;
      })}
      {data.map((d,i)=>{
        const cx=pL+i*step+step/2;
        const hA=(d[keyA]||0)/maxV*iH, hB=(d[keyB]||0)/maxV*iH;
        return <g key={i}>
          <rect x={cx-bW-1} y={yV(d[keyA]||0)} width={bW} height={hA} fill={colorA} rx={3} opacity={0.9}/>
          <rect x={cx+1}   y={yV(d[keyB]||0)} width={bW} height={hB} fill={colorB} rx={3} opacity={0.75}/>
          <text x={cx} y={H-pB+13} textAnchor="middle" fontSize={8} fill={G.muted}>{d.mois?.slice(0,3)}</text>
        </g>;
      })}
      {data.length>1&&<polyline points={data.map((d,i)=>`${pL+i*step+step/2},${yL(d[keyLine]||0)}`).join(' ')} fill="none" stroke={colorLine} strokeWidth={2} strokeDasharray="5,2"/>}
      {data.map((d,i)=><circle key={i} cx={pL+i*step+step/2} cy={yL(d[keyLine]||0)} r={3} fill={colorLine}/>)}
      <line x1={pL} y1={pT} x2={pL} y2={H-pB} stroke={G.border} strokeWidth={1}/>
      <line x1={pL} y1={H-pB} x2={W-pR} y2={H-pB} stroke={G.border} strokeWidth={1}/>
    </svg>
  );
}

function GaugeChart({ value }) {
  const pct=Math.min(Math.max(value||0,0),150);
  const color=pct>=100?G.main:pct>=80?G.amber:G.red;
  const r=72, cx=110, cy=96;
  const toRad=d=>(d-180)*Math.PI/180;
  const angle=(Math.min(pct,100)/100)*180;
  const ax=cx+r*Math.cos(toRad(angle)), ay=cy+r*Math.sin(toRad(angle));
  return (
    <svg viewBox="0 0 220 118" style={{width:'100%',height:'auto',display:'block'}}>
      <path d={`M ${cx-r},${cy} A ${r},${r} 0 0,1 ${cx+r},${cy}`} fill="none" stroke={G.pale2} strokeWidth={20} strokeLinecap="round"/>
      {pct>0&&<path d={`M ${cx-r},${cy} A ${r},${r} 0 ${angle>180?1:0},1 ${ax},${ay}`} fill="none" stroke={color} strokeWidth={20} strokeLinecap="round"/>}
      {[0,25,50,75,100].map(t=>{
        const a=(t/100)*180, rad=toRad(a);
        return <line key={t} x1={cx+(r-12)*Math.cos(rad)} y1={cy+(r-12)*Math.sin(rad)} x2={cx+(r+4)*Math.cos(rad)} y2={cy+(r+4)*Math.sin(rad)} stroke={G.border} strokeWidth={1.5}/>;
      })}
      <text x={cx-r+4} y={cy+18} fontSize={8} fill={G.muted}>0 %</text>
      <text x={cx+r-4} y={cy+18} textAnchor="end" fontSize={8} fill={G.muted}>100 %</text>
      <text x={cx} y={cy-4} textAnchor="middle" fontSize={22} fontWeight="900" fill={color} fontFamily="Nunito,sans-serif">{pct.toFixed(1)}%</text>
      <text x={cx} y={cy+12} textAnchor="middle" fontSize={9} fill={G.muted} fontFamily="Nunito,sans-serif">Taux Exécution</text>
    </svg>
  );
}

function HBarGroupChart({ data }) {
  const rows = data.slice(0, 10);
  if (!rows.length) return <div style={{textAlign:'center',padding:'20px 0',color:G.muted,fontSize:12}}>Aucune donnée</div>;
  const maxV = Math.max(...rows.flatMap(d=>[d.cout_prevu||0,d.cout_realise||0]))*1.1||1;
  const H = rows.length*38 + 24, W = 450, pL = 110, pR = 70;
  const barW = W - pL - pR;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'auto',display:'block'}}>
      {rows.map((d,i)=>{
        const y = 12 + i*38;
        const wP = (d.cout_prevu||0)/maxV*barW;
        const wR = (d.cout_realise||0)/maxV*barW;
        return (
          <g key={i}>
            <text x={pL-8} y={y+14} textAnchor="end" fontSize={10} fill={G.text} fontWeight={600}>
              {d.poste?.length > 18 ? d.poste.slice(0,15)+'…' : d.poste}
            </text>
            <rect x={pL} y={y} width={wP} height={13} fill={G.light} rx={2} opacity={0.75}/>
            <rect x={pL} y={y+16} width={wR} height={13} fill={G.dark} rx={2} opacity={0.9}/>
            <text x={pL + Math.max(wP,wR) + 6} y={y+12} fontSize={9} fill={G.muted}>{fmt(d.cout_prevu)}</text>
            <text x={pL + Math.max(wP,wR) + 6} y={y+28} fontSize={9} fill={G.muted}>{fmt(d.cout_realise)}</text>
          </g>
        );
      })}
      <line x1={pL} y1={8} x2={pL} y2={H-4} stroke={G.border} strokeWidth={1}/>
    </svg>
  );
}

function DonutChart({ segments }) {
  const total = segments.reduce((s,x)=>s+x.value,0)||1;
  const r = 60, cx = 90, cy = 75;
  let angle = -90;
  const arcs = segments.map(seg => {
    const sweep = seg.value/total*360;
    const a1 = angle*Math.PI/180, a2 = (angle+sweep)*Math.PI/180;
    const x1 = cx + r*Math.cos(a1), y1 = cy + r*Math.sin(a1);
    const x2 = cx + r*Math.cos(a2), y2 = cy + r*Math.sin(a2);
    const large = sweep>180?1:0;
    angle += sweep;
    return {...seg, path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`};
  });
  return (
    <svg viewBox="0 0 340 160" style={{width:'100%',height:'auto',display:'block'}}>
      {arcs.map((a,i)=><path key={i} d={a.path} fill={a.color} opacity={0.88}/>)}
      <circle cx={cx} cy={cy} r={35} fill={G.white}/>
      <text x={cx} y={cy+5} textAnchor="middle" fontSize={12} fontWeight={800} fill={G.dark} fontFamily="Nunito,sans-serif">{fmt(total)}</text>
      {segments.map((s,i)=>(
        <g key={i}>
          <rect x={180} y={20+i*28} width={12} height={12} fill={s.color} rx={2}/>
          <text x={198} y={31+i*28} fontSize={10} fontWeight={600} fill={G.text} fontFamily="Nunito,sans-serif">{s.label}</text>
          <text x={198} y={45+i*28} fontSize={9} fill={G.muted} fontFamily="Nunito,sans-serif">{fmt(s.value)} ({(s.value/total*100).toFixed(1)}%)</text>
        </g>
      ))}
    </svg>
  );
}

function AreaChart({ data, keyA, keyB, colorA=G.dark, colorB=G.light }) {
  if (!data.length) return <div style={{textAlign:'center',padding:'20px 0',color:G.muted,fontSize:12}}>Aucune donnée</div>;
  const W=500, H=180, pL=50, pR=15, pT=12, pB=36;
  const iW=W-pL-pR, iH=H-pT-pB;
  const maxV=Math.max(...data.flatMap(d=>[d[keyA]||0,d[keyB]||0]))*1.15||1;
  const step=iW/(data.length-1||1);
  const yV=v=>pT+iH-(v/maxV)*iH;
  const pts=key=>data.map((d,i)=>`${pL+i*step},${yV(d[key]||0)}`).join(' ');
  const fill=key=>`${pts(key)} ${pL+(data.length-1)*step},${pT+iH} ${pL},${pT+iH}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:180}}>
      {[0,0.5,1].map((f,i)=>{
        const y=pT+(1-f)*iH;
        return <g key={i}><line x1={pL} y1={y} x2={W-pR} y2={y} stroke={G.border} strokeWidth={0.5} strokeDasharray="3,3"/><text x={pL-4} y={y+4} textAnchor="end" fontSize={8} fill={G.muted}>{fmt(maxV*f)}</text></g>;
      })}
      <polygon points={fill(keyB)} fill={colorB} opacity={0.18}/>
      <polygon points={fill(keyA)} fill={colorA} opacity={0.22}/>
      <polyline points={pts(keyB)} fill="none" stroke={colorB} strokeWidth={2}/>
      <polyline points={pts(keyA)} fill="none" stroke={colorA} strokeWidth={2.5}/>
      {data.map((d,i)=><text key={i} x={pL+i*step} y={H-pB+13} textAnchor="middle" fontSize={8} fill={G.muted}>{d.mois?.slice(0,3)}</text>)}
      <line x1={pL} y1={pT} x2={pL} y2={H-pB} stroke={G.border} strokeWidth={1}/>
      <line x1={pL} y1={H-pB} x2={W-pR} y2={H-pB} stroke={G.border} strokeWidth={1}/>
    </svg>
  );
}

function LineChartDouble({ data, keyA, keyB, colorA=G.dark, colorB=G.light }) {
  if (!data.length) return <div style={{textAlign:'center',padding:'20px 0',color:G.muted,fontSize:12}}>Aucune donnée</div>;
  const W=500, H=180, pL=50, pR=15, pT=12, pB=36;
  const iW=W-pL-pR, iH=H-pT-pB;
  const allVals=data.flatMap(d=>[d[keyA]||0,d[keyB]||0]);
  const maxV=Math.max(...allVals)*1.1||1, minV=Math.min(...allVals)*0.9;
  const range=maxV-minV||1;
  const step=iW/(data.length-1||1);
  const yV=v=>pT+iH-(v-minV)/range*iH;
  const pts=key=>data.map((d,i)=>`${pL+i*step},${yV(d[key]||0)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:180}}>
      {[0,0.5,1].map((f,i)=>{
        const v=minV+(maxV-minV)*f, y=yV(v);
        return <g key={i}><line x1={pL} y1={y} x2={W-pR} y2={y} stroke={G.border} strokeWidth={0.5} strokeDasharray="3,3"/><text x={pL-4} y={y+4} textAnchor="end" fontSize={8} fill={G.muted}>{fmt(v)}</text></g>;
      })}
      <polyline points={pts(keyB)} fill="none" stroke={colorB} strokeWidth={2}/>
      <polyline points={pts(keyA)} fill="none" stroke={colorA} strokeWidth={2.5}/>
      {data.map((d,i)=>(
        <g key={i}>
          <circle cx={pL+i*step} cy={yV(d[keyA]||0)} r={3} fill={colorA}/>
          <circle cx={pL+i*step} cy={yV(d[keyB]||0)} r={3} fill={colorB}/>
          <text x={pL+i*step} y={H-pB+13} textAnchor="middle" fontSize={8} fill={G.muted}>{d.mois?.slice(0,3)}</text>
        </g>
      ))}
      <line x1={pL} y1={pT} x2={pL} y2={H-pB} stroke={G.border} strokeWidth={1}/>
      <line x1={pL} y1={H-pB} x2={W-pR} y2={H-pB} stroke={G.border} strokeWidth={1}/>
    </svg>
  );
}

function SimpleBarChart({ data, valueKey, labelKey='site', color=G.main }) {
  if (!data.length) return <div style={{textAlign:'center',padding:'20px 0',color:G.muted,fontSize:12}}>Aucune donnée</div>;
  const W=300, H=180, pL=50, pR=15, pT=12, pB=36;
  const iH=H-pT-pB, iW=W-pL-pR;
  const maxV=Math.max(...data.map(d=>d[valueKey]||0))*1.2||1;
  const step=iW/data.length, bW=step*0.55;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:180}}>
      {[0,0.5,1].map((f,i)=>{
        const y=pT+(1-f)*iH;
        return <g key={i}><line x1={pL} y1={y} x2={W-pR} y2={y} stroke={G.border} strokeWidth={0.5} strokeDasharray="3,3"/><text x={pL-4} y={y+4} textAnchor="end" fontSize={8} fill={G.muted}>{fmt(maxV*f)}</text></g>;
      })}
      {data.map((d,i)=>{
        const h=(d[valueKey]||0)/maxV*iH, x=pL+i*step+step/2;
        return <g key={i}>
          <rect x={x-bW/2} y={pT+iH-h} width={bW} height={h} fill={color} rx={4} opacity={0.88}/>
          <text x={x} y={H-pB+13} textAnchor="middle" fontSize={9} fill={G.muted}>{(d[labelKey]||'').slice(0,8)}</text>
          <text x={x} y={pT+iH-h-5} textAnchor="middle" fontSize={8} fill={color} fontWeight={700}>{fmt(d[valueKey])}</text>
        </g>;
      })}
      <line x1={pL} y1={pT} x2={pL} y2={H-pB} stroke={G.border} strokeWidth={1}/>
      <line x1={pL} y1={H-pB} x2={W-pR} y2={H-pB} stroke={G.border} strokeWidth={1}/>
    </svg>
  );
}

function StackedHBar({ data, keys, colors, labelKey='mois' }) {
  if (!data.length) return <div style={{textAlign:'center',padding:'20px 0',color:G.muted,fontSize:12}}>Aucune donnée</div>;
  const totals = data.map(d=>keys.reduce((s,k)=>s+(d[k]||0),0));
  const maxT = Math.max(...totals)*1.05||1;
  const H = data.length*30 + 24, W = 420, pL = 55, pR = 65;
  const barW = W - pL - pR;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'auto',display:'block'}}>
      {data.map((d,i)=>{
        const y = 10 + i*30;
        let x = pL;
        return (
          <g key={i}>
            <text x={pL-6} y={y+11} textAnchor="end" fontSize={10} fill={G.text} fontWeight={600}>
              {(d[labelKey]||'').slice(0,3)}
            </text>
            {keys.map((k,j)=>{
              const w = (d[k]||0)/maxT*barW;
              const rect = <rect key={k} x={x} y={y} width={w} height={16} fill={colors[j]} rx={j===0?3:0} opacity={0.85}/>;
              x += w;
              return rect;
            })}
            <text x={pL+totals[i]/maxT*barW+5} y={y+11} fontSize={9} fill={G.muted}>{fmt(totals[i])}</text>
          </g>
        );
      })}
      <line x1={pL} y1={6} x2={pL} y2={H-6} stroke={G.border} strokeWidth={1}/>
    </svg>
  );
}

function PrevisionBarChart({ historique, previsions, valueKeyH='cout_prevu', valueKeyP='cout_prevu' }) {
  const all=[...historique,...previsions];
  if (!all.length) return <div style={{textAlign:'center',padding:'30px 0',color:G.muted,fontSize:12}}>Aucune donnée</div>;
  const W=560, H=220, pL=60, pR=20, pT=16, pB=44;
  const iW=W-pL-pR, iH=H-pT-pB;
  const maxV=Math.max(
    ...historique.map(d=>d[valueKeyH]||0),
    ...previsions.map(d=>(d[valueKeyP]||0)),
    ...previsions.map(d=>d.intervalle_haut||0)
  )*1.15||1;
  const total=all.length;
  const step=iW/total, bW=step*0.52;
  const yV=v=>pT+iH-(v/maxV)*iH;
  const ticks=4;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:220}}>
      <defs>
        <pattern id="hatch-prev" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1={0} y1={0} x2={0} y2={5} stroke={G.mid} strokeWidth={1.5}/>
        </pattern>
      </defs>
      {Array.from({length:ticks+1},(_,i)=>{
        const y=pT+(i/ticks)*iH; const v=maxV*(1-i/ticks);
        return <g key={i}><line x1={pL} y1={y} x2={W-pR} y2={y} stroke={G.border} strokeWidth={0.5} strokeDasharray="3,3"/><text x={pL-4} y={y+4} textAnchor="end" fontSize={8} fill={G.muted}>{fmt(v)}</text></g>;
      })}
      {historique.length>0&&previsions.length>0&&(
        <line x1={pL+historique.length*step-step/2} y1={pT} x2={pL+historique.length*step-step/2} y2={H-pB} stroke={G.amber} strokeWidth={1.5} strokeDasharray="5,3"/>
      )}
      {previsions.length>1&&(
        <polygon points={[
          ...previsions.map((d,i)=>`${pL+(historique.length+i)*step+step/2},${yV(d.intervalle_haut||d[valueKeyP]||0)}`),
          ...previsions.slice().reverse().map((d,i)=>`${pL+(historique.length+previsions.length-1-i)*step+step/2},${yV(d.intervalle_bas||0)}`),
        ].join(' ')} fill={G.light} opacity={0.12}/>
      )}
      {historique.map((d,i)=>{
        const h=(d[valueKeyH]||0)/maxV*iH, cx=pL+i*step+step/2;
        return <rect key={i} x={cx-bW/2} y={yV(d[valueKeyH]||0)} width={bW} height={h} fill={G.dark} rx={3} opacity={0.9}/>;
      })}
      {previsions.map((d,i)=>{
        const h=(d[valueKeyP]||0)/maxV*iH, cx=pL+(historique.length+i)*step+step/2;
        return <g key={i}>
          <rect x={cx-bW/2} y={yV(d[valueKeyP]||0)} width={bW} height={h} fill={G.light} opacity={0.4} rx={3}/>
          <rect x={cx-bW/2} y={yV(d[valueKeyP]||0)} width={bW} height={h} fill="url(#hatch-prev)" opacity={0.6} rx={3}/>
          <text x={cx} y={yV(d[valueKeyP]||0)-4} textAnchor="middle" fontSize={7} fill={G.mid} fontWeight={700}>Prévu</text>
        </g>;
      })}
      {all.length>1&&(
        <polyline points={all.map((d,i)=>{
          const v=i<historique.length?(d[valueKeyH]||0):(d[valueKeyP]||0);
          return `${pL+i*step+step/2},${yV(v)}`;
        }).join(' ')} fill="none" stroke={G.yellow} strokeWidth={1.5} strokeDasharray="5,3"/>
      )}
      {all.map((d,i)=><text key={i} x={pL+i*step+step/2} y={H-pB+13} textAnchor="middle" fontSize={8} fill={G.muted}>{(d.mois||'').slice(0,3)}</text>)}
      <line x1={pL} y1={pT} x2={pL} y2={H-pB} stroke={G.border} strokeWidth={1}/>
      <line x1={pL} y1={H-pB} x2={W-pR} y2={H-pB} stroke={G.border} strokeWidth={1}/>
    </svg>
  );
}

function AnoBarChart({ data }) {
  const byM={};
  data.forEach(d=>{
    const m=d.mois||'?';
    if(!byM[m]) byM[m]={mois:m,critique:0,attention:0};
    if(d.niveau==='CRITIQUE') byM[m].critique++;
    else byM[m].attention++;
  });
  const rows=sortByMois(Object.values(byM));
  if (!rows.length) return null;
  const maxV=Math.max(...rows.map(r=>r.critique+r.attention))*1.2||1;
  const W=500, H=160, pL=35, pR=15, pT=10, pB=36;
  const iW=W-pL-pR, iH=H-pT-pB;
  const step=iW/rows.length, bW=step*0.55;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:160}}>
      {[0,0.5,1].map((f,i)=>{
        const y=pT+(1-f)*iH;
        return <g key={i}><line x1={pL} y1={y} x2={W-pR} y2={y} stroke={G.border} strokeWidth={0.5} strokeDasharray="3,3"/><text x={pL-3} y={y+4} textAnchor="end" fontSize={8} fill={G.muted}>{Math.round(maxV*f)}</text></g>;
      })}
      {rows.map((r,i)=>{
        const cx=pL+i*step+step/2;
        const hC=r.critique/maxV*iH, hA=r.attention/maxV*iH;
        return <g key={i}>
          <rect x={cx-bW/2} y={pT+iH-hA-hC} width={bW} height={hA} fill={G.amber} rx={0} opacity={0.85}/>
          <rect x={cx-bW/2} y={pT+iH-hC}    width={bW} height={hC} fill={G.red}   rx={2} opacity={0.9}/>
          <text x={cx} y={H-pB+13} textAnchor="middle" fontSize={8} fill={G.muted}>{r.mois.slice(0,3)}</text>
          {(r.critique+r.attention)>0&&<text x={cx} y={pT+iH-(r.critique+r.attention)/maxV*iH-4} textAnchor="middle" fontSize={8} fill={G.text} fontWeight={700}>{r.critique+r.attention}</text>}
        </g>;
      })}
      <line x1={pL} y1={pT} x2={pL} y2={H-pB} stroke={G.border} strokeWidth={1}/>
      <line x1={pL} y1={H-pB} x2={W-pR} y2={H-pB} stroke={G.border} strokeWidth={1}/>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// MODAL PROFIL
// ═══════════════════════════════════════════════════════════════
const inputStyle = {
  width:'100%', padding:'10px 14px', borderRadius:10,
  border:`1.5px solid #b2dfb4`, background:'#f0f7f0',
  fontFamily:'Nunito, sans-serif', fontSize:14, color:'#1a2e1a',
  outline:'none', transition:'180ms', boxSizing:'border-box',
};

function ProfileModal({ user, onClose, onSaved }) {
  const token = localStorage.getItem('token');
  const [form, setForm] = useState({ fullname:user?.fullname??'', email:user?.email??'', password:'', confirm:'' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');
  const overlayRef = useRef(null);
  const handleChange = e => { setForm({...form,[e.target.name]:e.target.value}); setError(''); };
  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password && form.password !== form.confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (form.password && form.password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return; }
    setLoading(true);
    try {
      const payload = { fullname:form.fullname, email:form.email, ...(form.password.trim()!==''&&{password:form.password}) };
      const res = await fetch(`${API_AUTH}/users/${user.id}`,{method:'PATCH',headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},body:JSON.stringify(payload)});
      if (!res.ok) { const d=await res.json(); throw new Error(d.message??'Erreur mise à jour'); }
      const updated = {...user, fullname:form.fullname, email:form.email};
      localStorage.setItem('user', JSON.stringify(updated));
      setSuccess(true);
      setTimeout(() => { onSaved(updated); onClose(); }, 1300);
    } catch(err) { setError(err.message); }
    finally { setLoading(false); }
  };
  return (
    <div ref={overlayRef} onClick={e=>e.target===overlayRef.current&&onClose()} style={{
      position:'fixed', inset:0, zIndex:1000,
      background:'rgba(15,45,16,0.55)', backdropFilter:'blur(4px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:16, animation:'fadeIn 0.2s ease both',
    }}>
      <div style={{ background:G.white, borderRadius:20, border:`1px solid ${G.border}`,
        boxShadow:'0 24px 64px rgba(15,45,16,0.28)', width:'100%', maxWidth:460,
        fontFamily:'Nunito, sans-serif', animation:'slideUp 0.25s ease both', overflow:'hidden' }}>
        <div style={{ background:G.dark, padding:'20px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:'50%', background:G.light, color:G.dark,
              display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:14 }}>
              {user?.fullname?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}
            </div>
            <div>
              <p style={{color:G.white,fontWeight:800,fontSize:14,margin:0}}>Mon profil</p>
              <p style={{color:'#ffffff70',fontSize:11,margin:0}}>Modifier mes informations</p>
            </div>
          </div>
          <button onClick={onClose} style={{background:'#ffffff20',border:'none',borderRadius:8,color:G.white,width:32,height:32,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,transition:'150ms'}}
            onMouseEnter={e=>e.currentTarget.style.background='#ffffff35'} onMouseLeave={e=>e.currentTarget.style.background='#ffffff20'}><FaTimes /></button>
        </div>
        <div style={{ padding:'24px 24px 28px' }}>
          {success ? (
            <div style={{textAlign:'center',padding:'32px 16px',animation:'fadeIn 0.3s ease both'}}>
              <FaCheckCircle style={{ fontSize:48, color:G.main, marginBottom:12 }} />
              <p style={{fontWeight:800,fontSize:16,color:G.main}}>Profil mis à jour !</p>
              <p style={{fontSize:13,color:G.muted,marginTop:4}}>Vos informations ont été enregistrées.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div style={{background:'#fdecea',border:'1px solid #f5c6c6',borderRadius:10,padding:'10px 14px',marginBottom:18,color:G.red,fontSize:13,fontWeight:600}}><FaExclamationTriangle style={{marginRight:8}} /> {error}</div>}
              {[{name:'fullname',label:'Nom complet',type:'text',ph:'Prénom Nom'},{name:'email',label:'Adresse email',type:'email',ph:'prenom.nom@ocpgroup.ma'}].map(f=>(
                <div key={f.name} style={{marginBottom:16}}>
                  <label style={{display:'block',fontSize:11,fontWeight:800,letterSpacing:1.2,textTransform:'uppercase',color:G.mid,marginBottom:6}}>{f.label}</label>
                  <input type={f.type} name={f.name} value={form[f.name]} onChange={handleChange} required style={inputStyle} placeholder={f.ph}/>
                </div>
              ))}
              <div style={{display:'flex',alignItems:'center',gap:10,margin:'20px 0 16px'}}>
                <div style={{flex:1,height:1,background:G.border}}/><span style={{fontSize:11,fontWeight:700,color:G.muted,whiteSpace:'nowrap'}}>Changer le mot de passe (optionnel)</span><div style={{flex:1,height:1,background:G.border}}/>
              </div>
              {[{name:'password',ph:'Laisser vide pour ne pas changer'},{name:'confirm',ph:'Confirmer le nouveau mot de passe'}].map(f=>(
                <div key={f.name} style={{marginBottom:14}}>
                  <input type="password" name={f.name} value={form[f.name]} onChange={handleChange} style={inputStyle} placeholder={f.ph}/>
                </div>
              ))}
              <button type="submit" disabled={loading} style={{width:'100%',padding:'12px',borderRadius:10,border:'none',background:loading?G.mid:G.main,color:G.white,fontFamily:'Nunito, sans-serif',fontSize:13,fontWeight:800,cursor:loading?'not-allowed':'pointer',transition:'180ms',marginTop:4}}>
                {loading?'Enregistrement…':'Enregistrer les modifications'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION ANALYSE CHARGES
// ═══════════════════════════════════════════════════════════════
function AnalyseChargesSection() {
  const [raw, setRaw]       = useState([]);
  const [prodRaw, setProdRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [selMois, setSelMois]   = useState([]);
  const [selSite, setSelSite]   = useState([]);
  const [selStade, setSelStade] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_AUTH}/dashboard/charges`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(j => {
        const d = j.data ?? [];
        setRaw(d);
        setSelMois([...new Set(d.map(x => x.mois))]);
        setSelSite([...new Set(d.map(x => x.site).filter(Boolean))]);
        setSelStade([...new Set(d.map(x => x.stade).filter(Boolean))]);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_AUTH}/dashboard/production`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(j => setProdRaw(j.data ?? []))
      .catch(console.warn);
  }, []);

  const allMois  = useMemo(()=>[...new Set(raw.map(x=>x.mois))].sort((a,b)=>MOIS_ORDER.indexOf(a)-MOIS_ORDER.indexOf(b)),[raw]);
  const allSites = useMemo(()=>[...new Set(raw.map(x=>x.site).filter(Boolean))],[raw]);
  const allStades= useMemo(()=>[...new Set(raw.map(x=>x.stade).filter(Boolean))],[raw]);

  const filtered = useMemo(()=>raw.filter(d=>
    selMois.includes(d.mois) &&
    (!d.site  ||selSite.length===0 ||selSite.includes(d.site))  &&
    (!d.stade ||selStade.length===0||selStade.includes(d.stade))
  ),[raw,selMois,selSite,selStade]);

  const tonnageByMonth = useMemo(() => {
    const map = new Map();
    prodRaw.forEach(p => {
      const m = p.mois;
      if (!m) return;
      const ton = p.tonnage_realise || 0;
      map.set(m, (map.get(m) || 0) + ton);
    });
    return map;
  }, [prodRaw]);

  const kpis = useMemo(()=>{
    const tR = filtered.reduce((s,d)=>s+(d.cout_realise||0),0);
    const tP = filtered.reduce((s,d)=>s+(d.cout_prevu||0),0);
    let ton = 0;
    selMois.forEach(m => {
      ton += tonnageByMonth.get(m) || 0;
    });
    return{tR,tP,ton, taux:tP>0?(tR/tP)*100:0, pr:ton>0?tR/ton:0};
  },[filtered, selMois, tonnageByMonth]);

  const byMois = useMemo(()=>{
    const m={};
    filtered.forEach(d=>{
      if(!m[d.mois]) m[d.mois]={mois:d.mois,cout_realise:0,cout_prevu:0,ecart:0};
      m[d.mois].cout_realise+=d.cout_realise||0;
      m[d.mois].cout_prevu  +=d.cout_prevu||0;
      m[d.mois].ecart       +=d.ecart||0;
    });
    return sortByMois(Object.values(m));
  },[filtered]);

  const byPoste = useMemo(()=>{
    const m = {};
    filtered.forEach(d=>{
      if(!m[d.poste]) m[d.poste] = { poste: d.poste, cout_realise: 0, cout_prevu: 0 };
      m[d.poste].cout_realise += d.cout_realise || 0;
      m[d.poste].cout_prevu   += d.cout_prevu || 0;
    });
    return Object.values(m).sort((a,b)=>b.cout_prevu - a.cout_prevu);
  },[filtered]);

  const consoReelle = useMemo(()=>{
    const map = new Map();
    filtered.forEach(d=>{
      if (!d.mois) return;
      if (!map.has(d.mois)) map.set(d.mois, { mois: d.mois, gasoil: 0, explosifs: 0, energie: 0 });
      const entry = map.get(d.mois);
      if (d.poste === 'Gasoil') entry.gasoil += d.cout_realise || 0;
      else if (d.poste === 'Explosifs') entry.explosifs += d.cout_realise || 0;
      else if (d.poste === 'Energie électrique') entry.energie += d.cout_realise || 0;
    });
    return sortByMois(Array.from(map.values()));
  },[filtered]);

  const donutSegs = useMemo(()=>{
    const total=kpis.tR||1;
    return[
      {label:'Charges Fixes',    value:total*0.49, color:G.dark},
      {label:'Charges Variables', value:total*0.51, color:G.light},
    ];
  },[kpis]);

  const COLS = ['Mois','Réalisé (MAD)','Prévu (MAD)','Écart (MAD)'];
  const rows  = () => byMois.map(d=>[d.mois,fmtNum(d.cout_realise),fmtNum(d.cout_prevu),fmtNum(d.ecart)]);

  return (
    <Section title="Analyse des Charges Réelles" icon={<FaMoneyBillWave />}
      badge={`${filtered.length} lignes`} loading={loading} error={error} padContent={false}>
      {!loading&&!error&&(
        <div style={{display:'flex',gap:0,margin:'0'}}>
          <div style={{width:180,flexShrink:0,borderRight:`1.5px solid ${G.pale}`,
            padding:'20px 16px 20px 16px',background:'#fafef9',borderRadius:'0 0 0 20px'}}>
            <div style={{fontSize:10,fontWeight:900,letterSpacing:1.5,textTransform:'uppercase',
              color:G.dark,marginBottom:16,display:'flex',alignItems:'center',gap:5}}>
              <FaFilter /> Filtres
            </div>
            {allMois.length>0  &&<CheckGroup title="Mois"  items={allMois}   selected={selMois}   onChange={v=>setSelMois(v.length?v:[...allMois])}/>}
            {allSites.length>0 &&<CheckGroup title="Site"  items={allSites}  selected={selSite}   onChange={v=>setSelSite(v.length?v:[...allSites])}/>}
            {allStades.length>0&&<CheckGroup title="Stade" items={allStades} selected={selStade}  onChange={v=>setSelStade(v.length?v:[...allStades])}/>}
            <button onClick={()=>{setSelMois([...allMois]);setSelSite([...allSites]);setSelStade([...allStades]);}} style={{
              marginTop:12,width:'100%',padding:'7px',borderRadius:8,border:`1.5px solid ${G.border}`,
              background:G.pale,color:G.muted,fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'Nunito,sans-serif'}}>
              <FaSyncAlt style={{ marginRight:5, fontSize:10 }} /> Réinitialiser
            </button>
          </div>

          <div style={{flex:1,padding:'0 24px 0 24px',minWidth:0,overflow:'hidden'}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:20,paddingTop:4}}>
              <KpiCard label="PR Réalisé" value={`${kpis.pr.toFixed(2)} DH/T`} icon={<FaDollarSign />} trend="Coût par tonne réalisé"/>
              <KpiCard label="Charges Réalisées" value={fmt(kpis.tR)} icon={<FaMoneyBillWave />} trend="Total période filtrée"/>
              <KpiCard label="Tonnage Total" value={fmt(kpis.ton,'T')} icon={<FaBalanceScale />} color={G.blue} bg={G.bluePale} trend="Réalisé"/>
              <KpiCard label="Taux Exécution"
                value={`${kpis.taux.toFixed(2)}%`}
                icon={kpis.taux>=100 ? <FaCheckCircle /> : kpis.taux>=80 ? <FaExclamationTriangle /> : <FaTimes />}
                color={kpis.taux>=100?G.main:kpis.taux>=80?G.amber:G.red}
                bg={kpis.taux>=100?G.pale:kpis.taux>=80?'#fff8e1':'#fdecea'}
                trend="Réalisé / Prévu × 100%"/>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 180px 1fr',gap:12,marginBottom:12}}>
              <div style={{background:G.pale,borderRadius:12,padding:'14px 16px',border:`1px solid ${G.border}`}}>
                <div style={{fontSize:11,fontWeight:800,color:G.dark,marginBottom:8}}>Prix de Revient : Réalisé vs Prévu vs Écart</div>
                <Legend items={[{color:G.dark,label:'Réalisé'},{color:G.light,label:'Prévu'},{color:G.yellow,label:'Écart',dash:true}]}/>
                <GroupedBarLineChart data={byMois} keyA="cout_realise" keyB="cout_prevu" keyLine="ecart"/>
              </div>
              <div style={{background:G.pale,borderRadius:12,padding:'14px 16px',border:`1px solid ${G.border}`}}>
                <div style={{fontSize:11,fontWeight:800,color:G.dark,marginBottom:8}}>Taux d'Exécution</div>
                <GaugeChart value={kpis.taux}/>
              </div>
              <div style={{background:G.pale,borderRadius:12,padding:'14px 16px',border:`1px solid ${G.border}`}}>
                <div style={{fontSize:11,fontWeight:800,color:G.dark,marginBottom:8}}>Charges totales Réalisé vs Prévu</div>
                <Legend items={[{color:G.dark,label:'Réalisé'},{color:G.light,label:'Prévu'},{color:G.yellow,label:'Écart',dash:true}]}/>
                <GroupedBarLineChart data={byMois} keyA="cout_realise" keyB="cout_prevu" keyLine="ecart" colorA={G.mid} colorB={G.pale2}/>
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 200px 1fr',gap:12}}>
              <div style={{background:G.pale,borderRadius:12,padding:'14px 16px',border:`1px solid ${G.border}`}}>
                <div style={{fontSize:11,fontWeight:800,color:G.dark,marginBottom:8}}>Temps de Mobilisation des Machines</div>
                <Legend items={[{color:G.light,label:'Prévu'},{color:G.dark,label:'Réalisé'}]}/>
                <HBarGroupChart data={byPoste}/>
              </div>
              <div style={{background:G.pale,borderRadius:12,padding:'14px 16px',border:`1px solid ${G.border}`}}>
                <div style={{fontSize:11,fontWeight:800,color:G.dark,marginBottom:8}}>Charges Fixes vs Variables</div>
                <DonutChart segments={donutSegs}/>
              </div>
              <div style={{background:G.pale,borderRadius:12,padding:'14px 16px',border:`1px solid ${G.border}`}}>
                <div style={{fontSize:11,fontWeight:800,color:G.dark,marginBottom:8}}>Consommations Spécifiques par Mois</div>
                <Legend items={[{color:G.main,label:'Gasoil'},{color:G.mid,label:'Explosifs'},{color:G.light,label:'Énergie'}]}/>
                <StackedHBar data={consoReelle} keys={['gasoil','explosifs','energie']} colors={[G.main,G.mid,G.light]} labelKey="mois"/>
              </div>
            </div>

            <ExportBar
              onPDF={()=>exportPDF('Analyse des Charges Réelles',COLS,rows(),'charges_analyse')}
              onExcel={()=>exportExcel('Charges',COLS,byMois.map(d=>[d.mois,d.cout_realise,d.cout_prevu,d.ecart]),'charges_analyse')}
            />
            <div style={{fontSize:11,color:G.muted,textAlign:'right',marginTop:6,paddingBottom:8}}>
              {filtered.length} lignes · {selMois.length} mois sélectionnés
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION ANALYSE PRODUCTION
// ═══════════════════════════════════════════════════════════════
function AnalyseProductionSection() {
  const [raw, setRaw]         = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [selMois, setSelMois]   = useState([]);
  const [selSite, setSelSite]   = useState([]);
  const [selQual, setSelQual]   = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_AUTH}/dashboard/production`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(j => {
        const d = j.data ?? [];
        setRaw(d);
        setSelMois([...new Set(d.map(x => x.mois))]);
        setSelSite([...new Set(d.map(x => x.site).filter(Boolean))]);
        setSelQual([...new Set(d.map(x => x.qualite).filter(Boolean))]);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const allMois  = useMemo(()=>[...new Set(raw.map(x=>x.mois))].sort((a,b)=>MOIS_ORDER.indexOf(a)-MOIS_ORDER.indexOf(b)),[raw]);
  const allSites = useMemo(()=>[...new Set(raw.map(x=>x.site).filter(Boolean))]   ,[raw]);
  const allQuals = useMemo(()=>[...new Set(raw.map(x=>x.qualite).filter(Boolean))],[raw]);

  const filtered = useMemo(()=>raw.filter(d=>
    selMois.includes(d.mois) &&
    (!d.site    ||selSite.length===0||selSite.includes(d.site))    &&
    (!d.qualite ||selQual.length===0||selQual.includes(d.qualite))
  ),[raw,selMois,selSite,selQual]);

  const byMois = useMemo(()=>{
    const m={};
    filtered.forEach(d=>{
      if(!m[d.mois]) m[d.mois]={mois:d.mois,tonnage_realise:0,tonnage_prevu:0,ecart:0};
      m[d.mois].tonnage_realise+=d.tonnage_realise||0;
      m[d.mois].tonnage_prevu  +=d.tonnage_prevu||0;
      m[d.mois].ecart          +=d.ecart||0;
    });
    return sortByMois(Object.values(m));
  },[filtered]);

  const byActivite = useMemo(()=>{
    const acts=['Extraction','Manutention','Criblage'];
    const m={}; acts.forEach(a=>m[a]={});
    filtered.forEach(d=>{
      const key=acts.find(a=>(d.activite||'').toLowerCase().includes(a.toLowerCase()));
      if(key){
        if(!m[key][d.mois]) m[key][d.mois]={mois:d.mois,tonnage_realise:0,tonnage_prevu:0};
        m[key][d.mois].tonnage_realise+=d.tonnage_realise||0;
        m[key][d.mois].tonnage_prevu  +=d.tonnage_prevu||0;
      }
    });
    return{extraction:sortByMois(Object.values(m['Extraction'])),manutention:sortByMois(Object.values(m['Manutention'])),criblage:sortByMois(Object.values(m['Criblage']))};
  },[filtered]);

  const bySite = useMemo(()=>{
    const m={};
    filtered.forEach(d=>{if(!d.site)return;if(!m[d.site])m[d.site]={site:d.site,tonnage_realise:0};m[d.site].tonnage_realise+=d.tonnage_realise||0;});
    return Object.values(m);
  },[filtered]);

  const kpis = useMemo(()=>{
    const tR=filtered.reduce((s,d)=>s+(d.tonnage_realise||0),0);
    const tP=filtered.reduce((s,d)=>s+(d.tonnage_prevu||0),0);
    return{tR,tP,taux:tP>0?(tR/tP)*100:0,ecart:tR-tP};
  },[filtered]);

  const COLS=['Mois','Réalisé (T)','Prévu (T)','Écart (T)'];
  const rows=()=>byMois.map(d=>[d.mois,fmtNum(d.tonnage_realise),fmtNum(d.tonnage_prevu),fmtNum(d.ecart)]);

  return (
    <Section title="Analyse de la Production Réelle" icon={<FaCogs />}
      badge={`${filtered.length} lignes`} loading={loading} error={error} accentColor={G.blue} padContent={false}>
      {!loading&&!error&&(
        <div style={{display:'flex',gap:0,margin:'0'}}>
          <div style={{width:180,flexShrink:0,borderRight:`1.5px solid ${G.pale}`,
            padding:'20px 16px 20px 16px',background:'#fafef9',borderRadius:'0 0 0 20px'}}>
            <div style={{fontSize:10,fontWeight:900,letterSpacing:1.5,textTransform:'uppercase',color:G.dark,marginBottom:16,display:'flex',alignItems:'center',gap:5}}><FaFilter /> Filtres</div>
            {allMois.length>0  &&<CheckGroup title="Mois"    items={allMois}  selected={selMois} onChange={v=>setSelMois(v.length?v:[...allMois])}/>}
            {allQuals.length>0 &&<CheckGroup title="Qualité" items={allQuals} selected={selQual} onChange={v=>setSelQual(v.length?v:[...allQuals])}/>}
            {allSites.length>0 &&<CheckGroup title="Site"    items={allSites} selected={selSite} onChange={v=>setSelSite(v.length?v:[...allSites])}/>}
            <button onClick={()=>{setSelMois([...allMois]);setSelSite([...allSites]);setSelQual([...allQuals]);}} style={{marginTop:12,width:'100%',padding:'7px',borderRadius:8,border:`1.5px solid ${G.border}`,background:G.pale,color:G.muted,fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'Nunito,sans-serif'}}><FaSyncAlt style={{ marginRight:5, fontSize:10 }} /> Réinitialiser</button>
          </div>

          <div style={{flex:1,padding:'0 24px 0 24px',minWidth:0,overflow:'hidden'}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:16,paddingTop:4}}>
              <KpiCard label="Taux Réalisation"
                value={`${kpis.taux.toFixed(2)}%`}
                icon={kpis.taux>=100 ? <FaCheckCircle /> : <FaExclamationTriangle />}
                color={kpis.taux>=100?G.main:G.amber}
                bg={kpis.taux>=100?G.pale:'#fff8e1'}/>
              <KpiCard label="Total Réalisé" value={fmt(kpis.tR,'T')} icon={<FaCheckCircle />} trend="Tonnes réalisées"/>
              <KpiCard label="Total Prévu" value={fmt(kpis.tP,'T')} icon={<FaClipboardList />} color={G.blue} bg={G.bluePale}/>
              <KpiCard label="Écart Production"
                value={`${kpis.ecart>=0?'▲':'▼'} ${fmt(Math.abs(kpis.ecart),'T')}`}
                icon={kpis.ecart>=0 ? <FaArrowUp /> : <FaArrowDown />}
                color={kpis.ecart>=0?G.main:G.red}
                bg={kpis.ecart>=0?G.pale:'#fdecea'}/>
            </div>
            {kpis.taux>=100&&(
              <div style={{background:`linear-gradient(90deg,${G.pale},${G.pale2})`,border:`1.5px solid ${G.mid}`,borderRadius:12,padding:'12px 18px',marginBottom:14,display:'flex',alignItems:'center',gap:10}}>
                <FaCheckCircle style={{ fontSize:18, color:G.main }} />
                <div>
                  <span style={{fontWeight:900,fontSize:13,color:G.dark}}>Excellente performance ! </span>
                  <span style={{fontWeight:700,fontSize:12,color:G.main}}>Dépassement de {fmt(Math.abs(kpis.ecart),'T')} au-dessus du prévu.</span>
                </div>
              </div>
            )}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:12}}>
              <div style={{background:G.pale,borderRadius:12,padding:'14px 16px',border:`1px solid ${G.border}`}}>
                <div style={{fontSize:11,fontWeight:800,color:G.dark,marginBottom:8}}>Extraction : Réalisé VS Prévu</div>
                <Legend items={[{color:G.light,label:'Prévu Extraction'},{color:G.dark,label:'Réalisé Extraction'}]}/>
                <GroupedBarLineChart data={byActivite.extraction} keyA="tonnage_realise" keyB="tonnage_prevu" keyLine="ecart"/>
              </div>
              <div style={{background:G.pale,borderRadius:12,padding:'14px 16px',border:`1px solid ${G.border}`}}>
                <div style={{fontSize:11,fontWeight:800,color:G.dark,marginBottom:8}}>Manutention : Réalisé VS Prévu</div>
                <Legend items={[{color:G.mid,label:'Prévu Manutention'},{color:G.dark,label:'Réalisé Manutention'}]}/>
                <AreaChart data={byActivite.manutention} keyA="tonnage_realise" keyB="tonnage_prevu" colorA={G.dark} colorB={G.mid}/>
              </div>
              <div style={{background:G.pale,borderRadius:12,padding:'14px 16px',border:`1px solid ${G.border}`}}>
                <div style={{fontSize:11,fontWeight:800,color:G.dark,marginBottom:8}}>Criblage : Réalisé VS Prévu</div>
                <Legend items={[{color:G.light,label:'Prévu Criblage'},{color:G.dark,label:'Réalisé Criblage'}]}/>
                <LineChartDouble data={byActivite.criblage} keyA="tonnage_realise" keyB="tonnage_prevu" colorA={G.dark} colorB={G.light}/>
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div style={{background:G.pale,borderRadius:12,padding:'14px 16px',border:`1px solid ${G.border}`, paddingRight: '24px'}}>
                <div style={{fontSize:11,fontWeight:800,color:G.dark,marginBottom:8}}>Total Réalisé par Site</div>
                <DonutChart segments={bySite.map((s,i)=>({label:s.site,value:s.tonnage_realise,color:i===0?G.dark:G.light}))}/>
              </div>
              <div style={{background:G.pale,borderRadius:12,padding:'14px 16px',border:`1px solid ${G.border}`}}>
                <div style={{fontSize:11,fontWeight:800,color:G.dark,marginBottom:8}}>Production Mensuelle : Réalisé vs Prévu</div>
                <Legend items={[{color:G.dark,label:'Réalisé'},{color:G.light,label:'Prévu'}]}/>
                <GroupedBarLineChart data={byMois} keyA="tonnage_realise" keyB="tonnage_prevu" keyLine="ecart" colorA={G.dark} colorB={G.light} colorLine={G.yellow}/>
              </div>
            </div>

            <ExportBar
              onPDF={()=>exportPDF('Analyse de la Production Réelle',COLS,rows(),'production_analyse')}
              onExcel={()=>exportExcel('Production',COLS,byMois.map(d=>[d.mois,d.tonnage_realise,d.tonnage_prevu,d.ecart]),'production_analyse')}
            />
            <div style={{fontSize:11,color:G.muted,textAlign:'right',marginTop:6}}>{filtered.length} lignes · {selMois.length} mois sélectionnés</div>
          </div>
        </div>
      )}
    </Section>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTIONS PRÉVISIONS
// ═══════════════════════════════════════════════════════════════
function ChargesSection() {
  const [data,setData]=useState([]),[postes,setPostes]=useState([]),[poste,setPoste]=useState('');
  const [loading,setLoading]=useState(true),[error,setError]=useState(null),[chartType,setChartType]=useState('bar');
  useEffect(()=>{fetch(`${API_AI}/prediction/charges`).then(r=>r.json()).then(j=>{const p=j.predictions??[];const u=[...new Set(p.map(x=>x.poste))];setPostes(u);setPoste(u[0]??'');setData(p);setLoading(false);}).catch(()=>{setError('Impossible de contacter /prediction/charges');setLoading(false);});},[]);
  const filtered=sortByMois(data.filter(d=>d.poste===poste));
  const total=filtered.reduce((s,d)=>s+(d.cout_prevu||0),0);
  const COLS=['Poste','Mois','Coût prévu (MAD)'];
  const rows=()=>filtered.map(d=>[d.poste,d.mois,fmtNum(d.cout_prevu)]);
  return (
    <Section title="Prévision des charges" icon={<FaChartLine />} badge={`${data.length} prédictions`} loading={loading} error={error}>
      <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'#e3f2fd',border:'1.5px solid #90caf9',borderRadius:99,padding:'4px 14px',marginBottom:14,fontSize:11,fontWeight:700,color:G.blue}}>
        <FaRobot style={{ fontSize:12 }} /> Régression Linéaire · Mois restants de l'année
      </div>
      <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:12,marginBottom:16}}>
        <Selector items={postes} selected={poste} onChange={setPoste}/>
        <div style={{display:'flex',gap:6}}>
          {['bar','line'].map(t=><button key={t} onClick={()=>setChartType(t)} style={{padding:'4px 12px',borderRadius:8,fontSize:11,fontWeight:700,border:`1.5px solid ${chartType===t?G.main:G.border}`,background:chartType===t?G.main:G.white,color:chartType===t?G.white:G.muted,cursor:'pointer',fontFamily:'Nunito'}}>
            {t==='line' ? <FaChartLine /> : <FaChartBar />}
          </button>)}
        </div>
      </div>
      <Legend items={[{color:G.dark,label:'Historique'},{color:G.light,label:'Prévu ML'},{color:G.yellow,label:'Tendance',dash:true}]}/>
      <PrevisionBarChart historique={[]} previsions={filtered} valueKeyH="cout_prevu" valueKeyP="cout_prevu"/>
      <div style={{marginTop:12,display:'flex',alignItems:'center'}}>
        <span style={{fontSize:11,color:G.muted,fontStyle:'italic'}}>Régression linéaire · Projection sur les mois restants</span>
        {filtered.length>0&&<span style={{marginLeft:'auto',fontWeight:800,fontSize:13,color:G.main}}>Total prévu : {total.toLocaleString('fr-FR')} MAD</span>}
      </div>
      <ExportBar onPDF={()=>exportPDF(`Prévision charges — ${poste}`,COLS,rows(),`charges_${poste}`)} onExcel={()=>exportExcel('Charges',COLS,filtered.map(d=>[d.poste,d.mois,d.cout_prevu??0]),`charges_${poste}`)}/>
    </Section>
  );
}

function ProductionSection() {
  const [data,setData]=useState([]),[activites,setActivites]=useState([]),[activite,setActivite]=useState('');
  const [loading,setLoading]=useState(true),[error,setError]=useState(null),[chartType,setChartType]=useState('bar');
  useEffect(()=>{fetch(`${API_AI}/prediction/production`).then(r=>r.json()).then(j=>{const p=j.predictions??[];const u=[...new Set(p.map(x=>x.activite))];setActivites(u);setActivite(u[0]??'');setData(p);setLoading(false);}).catch(()=>{setError('Impossible de contacter /prediction/production');setLoading(false);});},[]);
  const filtered=sortByMois(data.filter(d=>d.activite===activite));
  const total=filtered.reduce((s,d)=>s+(d.tonnage_prevu||0),0);
  const COLS=['Activité','Mois','Tonnage prévu (T)'];
  const rows=()=>filtered.map(d=>[d.activite,d.mois,fmtNum(d.tonnage_prevu)]);
  return (
    <Section title="Prévision de production" icon={<FaCogs />} badge={`${data.length} prédictions`} loading={loading} error={error} accentColor={G.blue}>
      <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'#e3f2fd',border:'1.5px solid #90caf9',borderRadius:99,padding:'4px 14px',marginBottom:14,fontSize:11,fontWeight:700,color:G.blue}}>
        <FaRobot style={{ fontSize:12 }} /> Régression Linéaire · Mois restants de l'année
      </div>
      <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:12,marginBottom:16}}>
        <Selector items={activites} selected={activite} onChange={setActivite}/>
        <div style={{display:'flex',gap:6}}>
          {['bar','line'].map(t=><button key={t} onClick={()=>setChartType(t)} style={{padding:'4px 12px',borderRadius:8,fontSize:11,fontWeight:700,border:`1.5px solid ${chartType===t?G.blue:G.border}`,background:chartType===t?G.blue:G.white,color:chartType===t?G.white:G.muted,cursor:'pointer',fontFamily:'Nunito'}}>
            {t==='line' ? <FaChartLine /> : <FaChartBar />}
          </button>)}
        </div>
      </div>
      <Legend items={[{color:G.dark,label:'Historique'},{color:G.light,label:'Prévu ML'},{color:G.yellow,label:'Tendance',dash:true}]}/>
      <PrevisionBarChart historique={[]} previsions={filtered} valueKeyH="tonnage_prevu" valueKeyP="tonnage_prevu"/>
      <div style={{marginTop:12,display:'flex',alignItems:'center'}}>
        <span style={{fontSize:11,color:G.muted,fontStyle:'italic'}}>Régression linéaire · Projection sur les mois restants</span>
        {filtered.length>0&&<span style={{marginLeft:'auto',fontWeight:800,fontSize:13,color:G.blue}}>Total prévu : {total.toLocaleString('fr-FR')} T</span>}
      </div>
      <ExportBar onPDF={()=>exportPDF(`Prévision production — ${activite}`,COLS,rows(),`production_${activite}`)} onExcel={()=>exportExcel('Production',COLS,filtered.map(d=>[d.activite,d.mois,d.tonnage_prevu??0]),`production_${activite}`)}/>
    </Section>
  );
}

function AnomaliesSection({ onKpiLoad }) {
  const [data,setData]=useState([]);
  const [total,setTotal]=useState(0);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [filtre,setFiltre]=useState('TOUS');
  const [page,setPage]=useState(0);
  const PER_PAGE=6;

  useEffect(()=>{
    fetch(`${API_AI}/anomalies`)
      .then(r=>r.json())
      .then(j=>{
        setData(j.anomalies??[]);
        setTotal(j.total??0);
        onKpiLoad&&onKpiLoad(j.anomalies??[],j.total??0);
        setLoading(false);
      })
      .catch(()=>{
        setError('Impossible de contacter /anomalies');
        setLoading(false);
      });
  },[]);

  const niveaux=['TOUS',...new Set(data.map(d=>d.niveau))];
  const filtered=useMemo(()=>filtre==='TOUS'?data:data.filter(d=>d.niveau===filtre),[data,filtre]);
  const paged=filtered.slice(page*PER_PAGE,(page+1)*PER_PAGE);
  const pages=Math.ceil(filtered.length/PER_PAGE);

  const getStyle = (niveau) => {
    switch(niveau) {
      case 'CRITIQUE': return { bg:'#fdecea', color:G.red, border:'#f5c6c666', label:<><FaTimes /> CRITIQUE</> };
      case 'ATTENTION': return { bg:'#fff8e1', color:G.amber, border:'#f9a82566', label:<><FaExclamationTriangle /> ATTENTION</> };
      default: return { bg:G.pale, color:G.muted, border:G.border, label:<><FaQuestionCircle /> INCONNU</> };
    }
  };

  const COLS=['Date','Poste','Mois','Réalisé','Prévu','Écart','Niveau'];
  const exportRows=()=>filtered.map(a=>[a.date?.slice(0,10)??'',a.poste??'',a.mois??'',fmtNum(a.realise),fmtNum(a.prevu),fmtNum(a.ecart),a.niveau??'']);

  return (
    <Section title="Anomalies — Isolation Forest" icon={<FaSearch />} badge={`${total} total`} loading={loading} error={error} accentColor={G.red}>
      {!loading && !error && (
        <>
          <div style={{marginBottom:16}}>
            <Legend items={[{color:G.red,label:'Critique'},{color:G.amber,label:'Attention'}]}/>
            <AnoBarChart data={data}/>
          </div>
          <Selector items={niveaux} selected={filtre} onChange={v=>{setFiltre(v);setPage(0);}}/>
          <div style={{overflowX:'auto',borderRadius:12,border:`1px solid ${G.border}`}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontFamily:'Nunito',fontSize:13}}>
              <thead>
                <tr style={{background:G.pale}}>
                  {COLS.map(h=>(
                    <th key={h} style={{padding:'10px 14px',textAlign:'left',fontWeight:900,fontSize:10,letterSpacing:1.5,textTransform:'uppercase',color:G.main,borderBottom:`1.5px solid ${G.border}`}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.length===0 ? (
                  <tr>
                    <td colSpan={7} style={{textAlign:'center',padding:'32px',color:G.muted}}>Aucune anomalie pour ce filtre.</td>
                  </tr>
                ) : (
                  paged.map((a,i)=>{
                    const s = getStyle(a.niveau);
                    return (
                      <tr key={i} style={{borderBottom:`1px solid ${G.border}`,background:i%2===0?G.white:'#fafef9',transition:'150ms'}}
                        onMouseEnter={e=>e.currentTarget.style.background=G.pale}
                        onMouseLeave={e=>e.currentTarget.style.background=i%2===0?G.white:'#fafef9'}>
                        <td style={{padding:'10px 14px',color:G.muted,fontSize:12}}>{a.date?.slice(0,10)}</td>
                        <td style={{padding:'10px 14px',fontWeight:800,color:G.dark}}>{a.poste}</td>
                        <td style={{padding:'10px 14px',color:G.muted}}>{a.mois}</td>
                        <td style={{padding:'10px 14px',fontWeight:700}}>{a.realise?.toLocaleString('fr-FR')}</td>
                        <td style={{padding:'10px 14px'}}>{a.prevu?.toLocaleString('fr-FR')}</td>
                        <td style={{padding:'10px 14px',fontWeight:700,color:a.ecart<0?G.red:G.light}}>{a.ecart>0?'+':''}{a.ecart?.toLocaleString('fr-FR')}</td>
                        <td style={{padding:'10px 14px'}}><span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'3px 10px',borderRadius:99,fontSize:11,fontWeight:800,background:s.bg,color:s.color,border:`1px solid ${s.border}`}}>{s.label}</span></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {pages>1 && (
            <div style={{display:'flex',justifyContent:'center',gap:6,marginTop:16}}>
              {Array.from({length:pages},(_,i)=>(
                <button key={i} onClick={()=>setPage(i)} style={{width:32,height:32,borderRadius:8,border:`1.5px solid ${page===i?G.main:G.border}`,background:page===i?G.main:G.white,color:page===i?G.white:G.muted,fontWeight:800,fontSize:13,cursor:'pointer',fontFamily:'Nunito'}}>{i+1}</button>
              ))}
            </div>
          )}
          <ExportBar
            onPDF={()=>exportPDF(`Anomalies — Isolation Forest (filtre : ${filtre})`,COLS,exportRows(),`anomalies_${filtre}`)}
            onExcel={()=>exportExcel('Anomalies',COLS,exportRows(),`anomalies_${filtre}`)}
          />
        </>
      )}
    </Section>
  );
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD PRINCIPAL
// ═══════════════════════════════════════════════════════════════
const TABS = [
  { id:'analyse',    label:'Analyse',    icon:<FaChartBar /> },
  { id:'previsions', label:'Prévisions', icon:<FaRobot /> },
  { id:'upload',     label:'Import données', icon:<FaUpload /> },
];

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState(()=>JSON.parse(localStorage.getItem('user')));
  const navigate = useNavigate();
  const [tab, setTab] = useState('analyse');
  const [kpiData, setKpiData] = useState({total:0,critique:0,attention:0});
  const [showProfile, setShowProfile] = useState(false);
  const initials = currentUser?.fullname?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)?? 'OC';

  const handleLogout = async () => {
    const token = localStorage.getItem('token');
    try { await axios.post(`${API_AUTH}/auth/logout`,{},{headers:{Authorization:`Bearer ${token}`}}); } catch {}
    localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/');
  };
  const handleKpiLoad = (anomalies, total) => setKpiData({
    total, critique:anomalies.filter(d=>d.niveau==='CRITIQUE').length,
    attention:anomalies.filter(d=>d.niveau==='ATTENTION').length,
  });
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

      <nav style={{ background:G.dark, borderBottom:`3px solid ${G.light}`, padding:'0 32px',
        height:60, display:'flex', alignItems:'center', justifyContent:'space-between',
        position:'sticky', top:0, zIndex:100, boxShadow:'0 4px 24px rgba(0,0,0,0.25)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <img src={ocpLogo} alt="OCP" style={{ height:32, filter:'brightness(0) invert(1)' }}/>
          <div style={{ width:1, height:28, background:'#ffffff30' }}/>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={()=>setShowProfile(true)} style={{
            display:'flex', alignItems:'center', gap:10,
            background:'#ffffff15', border:'1.5px solid #ffffff30', borderRadius:10,
            padding:'5px 12px 5px 6px', cursor:'pointer', transition:'180ms',
          }}
            onMouseEnter={e=>e.currentTarget.style.background='#ffffff25'}
            onMouseLeave={e=>e.currentTarget.style.background='#ffffff15'}>
            <div style={{ width:34, height:34, borderRadius:'50%', background:G.light, color:G.dark,
              display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:12 }}>
              {initials}
            </div>
            <div style={{ textAlign:'left' }}>
              <div style={{ color:G.white, fontSize:12, fontWeight:700 }}>{currentUser?.fullname}</div>
              <div style={{ color:'#ffffff70', fontSize:10, fontWeight:600 }}><FaEdit style={{ marginRight:4 }} /> Modifier le profil</div>
            </div>
          </button>
          <button onClick={handleLogout} style={{
            background:'transparent', border:'1.5px solid #ffffff40', color:'#ffffffcc',
            borderRadius:8, padding:'6px 14px', fontSize:11, fontWeight:700,
            cursor:'pointer', letterSpacing:0.5, transition:'180ms', fontFamily:'Nunito, sans-serif',
          }}
            onMouseEnter={e=>{e.currentTarget.style.background='#ffffff20';e.currentTarget.style.borderColor=G.light;}}
            onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor='#ffffff40';}}>
            <FaSignOutAlt style={{ marginRight:6 }} /> Déconnexion
          </button>
        </div>
      </nav>

      <main style={{ maxWidth:1100, margin:'0 auto', padding:'32px 24px 80px' }}>
        <div style={{ marginBottom:28, animation:'fadeUp 0.4s ease both' }}>
          <p style={{ fontSize:11, fontWeight:800, letterSpacing:2, textTransform:'uppercase', color:G.mid, marginBottom:4 }}>Espace contrôleur</p>
          <h1 style={{ fontSize:26, fontWeight:900, color:G.dark, margin:0 }}>
            {greeting}, <span style={{ color:G.main }}>{currentUser?.fullname}</span>
          </h1>
          <p style={{ color:G.muted, fontSize:13, marginTop:4 }}>
            <FaRegCalendarAlt style={{ marginRight:6, verticalAlign:'middle' }} />
            {new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
          </p>
        </div>

        {kpiData.total>0 && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16, marginBottom:28 }}>
            <KpiCard label="Anomalies totales" value={kpiData.total} icon={<FaSearch />} color={G.main} bg={G.pale} trend="Détectées par Isolation Forest"/>
            <KpiCard label="Critiques" value={kpiData.critique} icon={<FaTimes />} color={G.red} bg="#fdecea" trend="Nécessitent une action immédiate"/>
            <KpiCard label="Attention" value={kpiData.attention} icon={<FaExclamationTriangle />} color={G.amber} bg="#fff8e1" trend="À surveiller de près"/>
            <KpiCard label="Modèles IA actifs" value={3} icon={<FaRobot />} color={G.blue} bg={G.bluePale} trend="Régression · IsoForest · LLaMA"/>
          </div>
        )}

        <div style={{ display:'flex', gap:4, marginBottom:28, borderBottom:`2px solid ${G.border}`,
          animation:'fadeUp 0.4s 0.05s ease both' }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              display:'flex', alignItems:'center', gap:8, padding:'10px 20px',
              background:'none', border:'none', cursor:'pointer', fontFamily:'Nunito, sans-serif',
              fontSize:13, fontWeight:800,
              color: tab===t.id?G.main:G.muted,
              borderBottom:`2px solid ${tab===t.id?G.main:'transparent'}`,
              marginBottom:-2, letterSpacing:0.5, transition:'150ms',
            }}><span style={{ fontSize:14 }}>{t.icon}</span> {t.label}</button>
          ))}
        </div>

        {tab==='upload' && (
          <div style={{animation:'fadeUp 0.3s ease both'}}><UploadBox/></div>
        )}

        {tab==='analyse' && (
          <div style={{animation:'fadeUp 0.3s ease both'}}>
            <AnalyseChargesSection/>
            <AnalyseProductionSection/>
          </div>
        )}

        {tab==='previsions' && (
          <div style={{animation:'fadeUp 0.3s ease both'}}>
            <ChargesSection/>
            <ProductionSection/>
            <AnomaliesSection onKpiLoad={handleKpiLoad}/>
          </div>
        )}
      </main>

      {showProfile && <ProfileModal user={currentUser} onClose={()=>setShowProfile(false)} onSaved={handleProfileSaved}/>}
      <AIChatbot/>
    </div>
  );
}