// Dashboard.jsx — OCP Portail RH · avec IA intégrée
import '../styles/Dashboard.css';
import ocpLogo from '../assets/ocp-logo.png';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import UploadBox    from '../components/UploadBox';
import AIAnalytics  from '../components/AIAnalytics';
import AIChatbot    from '../components/AIChatbot';

const TABS = [
  { id: 'upload',    label: 'Import données', icon: '↑' },
  { id: 'analytics', label: 'Analyse IA',     icon: '📊' },
];

export default function Dashboard() {
  const user     = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();
  const [tab, setTab] = useState('upload');

  const initials = user?.fullname
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'OC';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="dashboard-page">

      {/* TOP BAR */}
      <nav className="dashboard-topbar">
        <div className="topbar-brand">
          <img src={ocpLogo} alt="OCP" className="topbar-logo" />
          <span className="topbar-brand-label">Portail RH</span>
        </div>
        <div className="topbar-user">
          <div className="topbar-avatar">{initials}</div>
          <span className="topbar-name">{user?.fullname}</span>
          <span className="topbar-role-tag">{user?.role}</span>
          <button className="logout-btn" onClick={handleLogout}>Déconnexion</button>
        </div>
      </nav>

      {/* MAIN */}
      <main className="dashboard-main">

        <div className="dashboard-label">Espace contrôleur</div>
        <h1>Bonjour, <strong>{user?.fullname}</strong></h1>
        <p>Bienvenue dans votre espace de gestion et de suivi.</p>

        {/* ── Onglets ── */}
        <div style={{
          display: 'flex', gap: 8, marginBottom: 32,
          borderBottom: '2px solid #c8e6c9', paddingBottom: 0,
        }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: 800,
                color: tab === t.id ? '#2d6a2f' : '#6a8f6b',
                borderBottom: tab === t.id ? '2px solid #2d6a2f' : '2px solid transparent',
                marginBottom: -2, letterSpacing: 0.5,
                transition: '150ms',
              }}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* ── Contenu onglet ── */}
        {tab === 'upload' && (
          <div className="upload-section">
            <UploadBox />
          </div>
        )}

        {tab === 'analytics' && (
          <AIAnalytics />
        )}

      </main>

      {/* ── Chatbot flottant (toujours visible) ── */}
      <AIChatbot />

    </div>
  );
}