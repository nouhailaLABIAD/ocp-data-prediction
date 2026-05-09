import '../styles/Dashboard.css';
import ocpLogo from '../assets/ocp-logo.png';
import { useNavigate } from 'react-router-dom';
import UploadBox from '../components/UploadBox';

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

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
        {/* Logo + label groupés */}
        <div className="topbar-brand">
          <img src={ocpLogo} alt="OCP" className="topbar-logo" />
          <span className="topbar-brand-label">Portail RH</span>
        </div>

        {/* Droite : avatar, nom, rôle, déconnexion */}
        <div className="topbar-user">
          <div className="topbar-avatar">{initials}</div>
          <span className="topbar-name">{user?.fullname}</span>

          <span className="topbar-role-tag">
            {user?.role}
          </span>

          <button className="logout-btn" onClick={handleLogout}>
            Déconnexion
          </button>
        </div>
      </nav>

      {/* MAIN */}
      <main className="dashboard-main">

        <div className="dashboard-label">Espace contrôleur</div>

        <h1>
          Bonjour, <strong>{user?.fullname}</strong>
        </h1>

        <p>Bienvenue dans votre espace de gestion et de suivi.</p>

        {/* UPLOAD */}
        <div className="upload-section">
          <UploadBox />
        </div>

      </main>
    </div>
  );
}