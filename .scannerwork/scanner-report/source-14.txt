// AdminDashboard.jsx — OCP Portail RH · Sidebar Layout
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/AdminDashboard.css';
import ocpLogo from '../assets/ocp-logo.png';

const API = 'http://localhost:3000';

// ── Sections de la sidebar ──────────────────────────────────
const SECTIONS = [
  { id: 'logs',  label: 'Traçabilité',         icon: '📋' },
  { id: 'users', label: 'Utilisateurs',         icon: '👥' },
  { id: 'add',   label: 'Ajouter utilisateur',  icon: '➕' },
];

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState('logs');
  const [users, setUsers]       = useState([]);
  const [editingUser, setEditing] = useState(null);
  const [search, setSearch]     = useState('');
  const [form, setForm]         = useState({ fullname: '', email: '', password: '', role: 'CONTROLEUR' });

  const [logs, setLogs]               = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError]     = useState('');

  const token    = localStorage.getItem('token');
  const navigate = useNavigate();
  const headers  = { Authorization: `Bearer ${token}` };
  const searchRef = useRef(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API}/users`, { headers });
      setUsers(res.data);
    } catch { console.error('Erreur chargement utilisateurs'); }
  };

  const fetchLogs = async () => {
    try {
      setLogsLoading(true); setLogsError('');
      const res = await axios.get(`${API}/logs`, { headers });
      setLogs(res.data ?? []);
    } catch (err) {
      setLogsError(err?.response?.data?.message ?? 'Erreur chargement logs');
    } finally { setLogsLoading(false); }
  };

  useEffect(() => { fetchUsers(); fetchLogs(); }, []);

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return u.fullname?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q);
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const payload = {
          fullname: form.fullname, email: form.email, role: form.role,
          ...(form.password.trim() !== '' && { password: form.password }),
        };
        await axios.patch(`${API}/users/${editingUser.id}`, payload, { headers });
        setEditing(null);
      } else {
        await axios.post(`${API}/users`, form, { headers });
      }
      await fetchUsers();
      await fetchLogs();
      setForm({ fullname: '', email: '', password: '', role: 'CONTROLEUR' });
      setActiveSection('users');
    } catch (err) { alert(err.response?.data?.message ?? 'Une erreur est survenue'); }
  };

  const startEdit = (user) => {
    setEditing(user);
    setForm({ fullname: user.fullname, email: user.email, password: '', role: user.role });
    setActiveSection('add');
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm({ fullname: '', email: '', password: '', role: 'CONTROLEUR' });
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Confirmer la suppression ?')) return;
    await axios.delete(`${API}/users/${id}`, { headers });
    await fetchUsers();
    await fetchLogs();
  };

  const handleLogout = async () => {
    try { await axios.post(`${API}/auth/logout`, {}, { headers }); } catch (e) {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const admins      = users.filter(u => u.role === 'ADMIN').length;
  const controleurs = users.filter(u => u.role === 'CONTROLEUR').length;

  const sectionTitle = {
    logs:  'Traçabilité',
    users: 'Utilisateurs',
    add:   editingUser ? `Modifier — ${editingUser.fullname}` : 'Ajouter un utilisateur',
  }[activeSection];

  return (
    <div className="admin-layout">

      {/* ══ SIDEBAR ══ */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <img src={ocpLogo} alt="OCP" />
          <span className="sidebar-logo-text">Portail RH</span>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">Menu</div>

          {SECTIONS.map(s => (
            <button
              key={s.id}
              className={`nav-item ${activeSection === s.id ? 'active' : ''}`}
              onClick={() => setActiveSection(s.id)}
            >
              <span className="nav-icon">{s.icon}</span>
              {s.label}
              {s.id === 'logs'  && logs.length  > 0 && <span className="nav-badge">{logs.length}</span>}
              {s.id === 'users' && users.length > 0 && <span className="nav-badge">{users.length}</span>}
            </button>
          ))}
        </nav>

        {/* Footer utilisateur */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{getInitials(currentUser?.fullname)}</div>
            <div>
              <div className="sidebar-user-name">{currentUser?.fullname || 'Admin'}</div>
              <div className="sidebar-user-role">Administrateur</div>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ══ CONTENU PRINCIPAL ══ */}
      <div className="admin-content">

        {/* Topbar */}
        <header className="content-topbar">
          <span className="topbar-title">{sectionTitle}</span>
          <div className="topbar-right">
            <span className="topbar-badge">Admin</span>
          </div>
        </header>

        <main className="content-body">

          {/* ── Stats toujours visibles ── */}
          <div className="stats-strip">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div>
                <div className="stat-value">{users.length}</div>
                <div className="stat-label">Total utilisateurs</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🛡️</div>
              <div>
                <div className="stat-value">{admins}</div>
                <div className="stat-label">Administrateurs</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👤</div>
              <div>
                <div className="stat-value">{controleurs}</div>
                <div className="stat-label">Contrôleurs</div>
              </div>
            </div>
          </div>

          {/* ══ SECTION : TRAÇABILITÉ ══ */}
          {activeSection === 'logs' && (
            <div className="panel">
              <div className="panel-header">
                <span>📋</span>
                <span className="panel-title">Journal des actions</span>
                <span className="panel-badge">{logs.length} entrées</span>
              </div>

              {logsLoading ? (
                <div className="logs-loading">Chargement…</div>
              ) : logsError ? (
                <div className="logs-error">⚠ {logsError}</div>
              ) : logs.length === 0 ? (
                <div className="panel-body">
                  <div className="empty-state">
                    <div className="empty-icon">🧾</div>
                    <p className="empty-text">Aucune action enregistrée</p>
                    <p className="empty-sub">Les événements apparaîtront ici.</p>
                  </div>
                </div>
              ) : (
                <div className="logs-wrap">
                  <table className="logs-table">
                    <thead>
                      <tr>
                        <th>Utilisateur</th>
                        <th>Action</th>
                        <th>Détails</th>
                        <th>Date & heure</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map(log => {
                        const cls = `log-badge b-${log.action ?? 'default'}`;
                        return (
                          <tr key={log.id}>
                            <td>
                              <div className="log-user-cell">
                                <div className="log-avatar">
                                  {getInitials(log.user?.fullname || log.user?.email || '?')}
                                </div>
                                <div>
                                  <div className="log-uname">{log.user?.fullname || '—'}</div>
                                  <div className="log-urole">{log.user?.role || '—'}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={cls}>{log.action}</span>
                            </td>
                            <td>
                              <span className="log-details-cell" title={log.details || ''}>
                                {log.details || '—'}
                              </span>
                            </td>
                            <td>
                              <span className="log-date-cell">
                                {new Date(log.createdAt).toLocaleString('fr-FR')}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ══ SECTION : UTILISATEURS ══ */}
          {activeSection === 'users' && (
            <div className="panel">
              <div className="panel-header">
                <span>👥</span>
                <span className="panel-title">Utilisateurs enregistrés</span>
                <span className="panel-badge">{filteredUsers.length} / {users.length}</span>
              </div>

              {/* Recherche */}
              <div className="search-bar-wrap">
                <div className="search-bar">
                  <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.2"
                    strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input
                    ref={searchRef}
                    className="search-input"
                    type="text"
                    placeholder="Rechercher par nom, email ou rôle…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    autoComplete="off"
                  />
                  {search && (
                    <button className="search-clear" onClick={() => { setSearch(''); searchRef.current?.focus(); }}>✕</button>
                  )}
                </div>
                {search && (
                  <p className="search-hint">
                    {filteredUsers.length === 0
                      ? `Aucun résultat pour « ${search} »`
                      : `${filteredUsers.length} résultat${filteredUsers.length > 1 ? 's' : ''} pour « ${search} »`}
                  </p>
                )}
              </div>

              <div className="panel-body" style={{ paddingTop: 14 }}>
                {filteredUsers.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">{search ? '🔍' : '👤'}</div>
                    <p className="empty-text">{search ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur enregistré'}</p>
                    <p className="empty-sub">{search ? 'Essayez un autre critère' : 'Ajoutez un utilisateur via le menu'}</p>
                  </div>
                ) : (
                  <div className="users-list">
                    {filteredUsers.map(user => (
                      <div key={user.id} className={`user-card ${editingUser?.id === user.id ? 'editing-target' : ''}`}>
                        <div className="user-info">
                          <div className="user-avatar">{getInitials(user.fullname)}</div>
                          <div className="user-details">
                            <span className="user-name"><Highlight text={user.fullname} query={search}/></span>
                            <span className="user-email"><Highlight text={user.email} query={search}/></span>
                          </div>
                        </div>
                        <div className="user-right">
                          <span className={`user-role-tag ${user.role === 'ADMIN' ? 'role-admin' : 'role-controleur'}`}>
                            {user.role}
                          </span>
                          <button className="btn-edit" onClick={() => startEdit(user)}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            Modifier
                          </button>
                          <button className="btn-delete" onClick={() => deleteUser(user.id)}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                              <path d="M10 11v6M14 11v6"/>
                            </svg>
                            Supprimer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ SECTION : AJOUTER / MODIFIER ══ */}
          {activeSection === 'add' && (
            <div className="panel">
              <div className="panel-header">
                <span>{editingUser ? '✏️' : '➕'}</span>
                <span className="panel-title">
                  {editingUser ? `Modifier — ${editingUser.fullname}` : 'Ajouter un utilisateur'}
                </span>
              </div>
              <div className="panel-body">
                <form className="admin-form" onSubmit={handleSubmit}>
                  <div className="form-field">
                    <label className="form-label">Nom complet</label>
                    <input className="form-input" type="text" name="fullname"
                      placeholder="Prénom Nom" value={form.fullname}
                      onChange={handleChange} required />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" name="email"
                      placeholder="prenom.nom@ocpgroup.ma" value={form.email}
                      onChange={handleChange} required />
                  </div>
                  <div className="form-field">
                    <label className="form-label">
                      Mot de passe&nbsp;
                      {editingUser && <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 10, color: '#9CA3AF' }}>(vide = inchangé)</span>}
                    </label>
                    <input className="form-input" type="password" name="password"
                      placeholder="••••••••" value={form.password}
                      onChange={handleChange} required={!editingUser} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Rôle</label>
                    <div className="select-wrapper">
                      <select className="form-select" name="role" value={form.role} onChange={handleChange}>
                        <option value="CONTROLEUR">Contrôleur</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className={`btn-submit ${editingUser ? 'editing' : ''}`}>
                    {editingUser ? '💾  Enregistrer les modifications' : '+ Ajouter l\'utilisateur'}
                  </button>
                  {editingUser && (
                    <button type="button" className="btn-cancel" onClick={cancelEdit}>Annuler</button>
                  )}
                </form>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

// ── Highlight ────────────────────────────────────────────────
function Highlight({ text = '', query = '' }) {
  if (!query.trim()) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part)
          ? <mark key={i} style={{ background: '#BBF7D0', color: '#166534', borderRadius: 3, padding: '0 2px', fontWeight: 700 }}>{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}