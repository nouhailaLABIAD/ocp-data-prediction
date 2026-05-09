import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/AdminDashboard.css';
import ocpLogo from '../assets/ocp-logo.png';

const API = 'http://localhost:3000';

export default function AdminDashboard() {
  const [users, setUsers]         = useState([]);
  const [editingUser, setEditing] = useState(null);
  const [form, setForm]           = useState({
    fullname: '', email: '', password: '', role: 'CONTROLEUR',
  });

  const token    = localStorage.getItem('token');
  const navigate = useNavigate();

  const headers = { Authorization: `Bearer ${token}` };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API}/users`, { headers });
      setUsers(res.data);
    } catch {
      console.error('Erreur chargement utilisateurs');
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const payload = {
          fullname: form.fullname,
          email:    form.email,
          role:     form.role,
          ...(form.password.trim() !== '' && { password: form.password }),
        };
        await axios.patch(`${API}/users/${editingUser.id}`, payload, { headers });
        setEditing(null);
      } else {
        await axios.post(`${API}/users`, form, { headers });
      }
      fetchUsers();
      setForm({ fullname: '', email: '', password: '', role: 'CONTROLEUR' });
    } catch (err) {
      alert(err.response?.data?.message ?? 'Une erreur est survenue');
    }
  };

  const startEdit = (user) => {
    setEditing(user);
    setForm({ fullname: user.fullname, email: user.email, password: '', role: user.role });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm({ fullname: '', email: '', password: '', role: 'CONTROLEUR' });
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Confirmer la suppression ?')) return;
    await axios.delete(`${API}/users/${id}`, { headers });
    fetchUsers();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const getInitials = (name) =>
    name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';

  const admins      = users.filter((u) => u.role === 'ADMIN').length;
  const controleurs = users.filter((u) => u.role === 'CONTROLEUR').length;

  return (
    <div className="admin-page">

      {/* ── Topbar ── */}
      <nav className="admin-topbar">
        <div className="topbar-left">
          <img src={ocpLogo} alt="OCP" className="topbar-logo" />
          <span className="topbar-app-name">Portail RH</span>
        </div>
        <div className="topbar-right">
          <span className="topbar-badge">Admin</span>
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
      </nav>

      {/* ── Hero ── */}
      <div className="admin-hero">
        <p className="hero-label">Administration</p>
        <h1 className="hero-title">Gestion des utilisateurs</h1>
      </div>

      {/* ── Stats ── */}
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

      <main className="admin-main">

        {/* ── Formulaire ── */}
        <div className="card">
          <div className="card-header">
            <span className="card-header-icon">{editingUser ? '✏️' : '➕'}</span>
            <span className="card-title">
              {editingUser ? `Modifier — ${editingUser.fullname}` : 'Ajouter un utilisateur'}
            </span>
          </div>
          <div className="card-body">
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
                  {editingUser && (
                    <span style={{ fontWeight: 400, textTransform: 'none', fontSize: '10px', color: 'var(--ocp-text-muted)' }}>
                      (laisser vide = inchangé)
                    </span>
                  )}
                </label>
                <input className="form-input" type="password" name="password"
                  placeholder="••••••••" value={form.password}
                  onChange={handleChange} required={!editingUser} />
              </div>

              <div className="form-field">
                <label className="form-label">Rôle</label>
                <div className="select-wrapper">
                  <select className="form-select" name="role"
                    value={form.role} onChange={handleChange}>
                    <option value="CONTROLEUR">Contrôleur</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>

              <button type="submit" className={`btn-submit ${editingUser ? 'editing' : ''}`}>
                {editingUser ? '💾  Enregistrer les modifications' : '+ Ajouter l\'utilisateur'}
              </button>

              {editingUser && (
                <button type="button" className="btn-cancel" onClick={cancelEdit}>
                  Annuler
                </button>
              )}

            </form>
          </div>
        </div>

        {/* ── Liste ── */}
        <div className="card">
          <div className="card-header">
            <span className="card-header-icon">📋</span>
            <span className="card-title">Utilisateurs enregistrés</span>
            <span className="list-count">
              {users.length} utilisateur{users.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="card-body">
            {users.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👤</div>
                <p className="empty-text">Aucun utilisateur enregistré</p>
                <p className="empty-sub">Ajoutez un utilisateur via le formulaire ci-dessus</p>
              </div>
            ) : (
              <div className="users-list">
                {users.map((user) => (
                  <div key={user.id}
                    className={`user-card ${editingUser?.id === user.id ? 'editing-target' : ''}`}>
                    <div className="user-info">
                      <div className="user-avatar">{getInitials(user.fullname)}</div>
                      <div className="user-details">
                        <span className="user-name">{user.fullname}</span>
                        <span className="user-email">{user.email}</span>
                      </div>
                    </div>
                    <div className="user-right">
                      <span className={`user-role-tag ${user.role === 'ADMIN' ? 'role-admin' : 'role-controleur'}`}>
                        {user.role}
                      </span>
                      <button className="btn-edit" onClick={() => startEdit(user)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Modifier
                      </button>
                      <button className="btn-delete" onClick={() => deleteUser(user.id)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

      </main>
    </div>
  );
}