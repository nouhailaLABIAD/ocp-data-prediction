import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/authService';
import '../styles/Login.css';
import ocpLogo from '../assets/ocp-logo.png';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
  e.preventDefault();

  try {
    const data = await loginUser(email, password);

    localStorage.setItem(
      'token',
      data.access_token,
    );

    localStorage.setItem(
      'user',
      JSON.stringify(data.user),
    );

    // ✅ vérifier rôle
    if (data.user.role === 'ADMIN') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  } catch (err) {
    setError(
      'Email ou mot de passe incorrect.',
    );
  }
};

  return (
    <div className="login-page">

      {/* ── Côté gauche ── */}
      <div className="login-left">
        <img src={ocpLogo} alt="OCP Logo" className="login-logo" />
        <div className="login-left-divider" />
        <h2 className="login-brand-title">OCP Group</h2>
        {/* <p className="login-brand-subtitle">
          Plateforme interne de gestion et de suivi des collaborateurs
        </p> */}
      </div>

      {/* ── Côté droit ── */}
      <div className="login-right">
        <div className="login-form-header">
          <h1 className="login-title">Connexion</h1>
          <p className="login-subtitle">Bienvenue, veuillez vous identifier</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="field-group">

            {/* Email */}
            <div className="field-wrapper">
              <label className="field-label">Email</label>
              <input
                type="email"
                placeholder="prenom.nom@ocpgroup.ma"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field-input"
              />
            </div>

            {/* Mot de passe */}
            <div className="field-wrapper">
              <label className="field-label">Mot de passe</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="field-input password-input"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Masquer' : 'Afficher'}
                >
                  {showPassword ? (
                    /* Œil barré */
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    /* Œil ouvert */
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

          </div>

          <button type="submit" className="btn-login">
            Se connecter
          </button>

          {error && <p className="login-error">{error}</p>}
        </form>

        {/* <p className="login-footer">OCP Group © {new Date().getFullYear()}</p> */}
      </div>

    </div>
  );
}