// UploadBox.jsx — OCP Portail, style charte verte
import { useState, useRef } from 'react';
import axios from 'axios';

const MOIS = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];
const ANNEES = ['2024', '2025'];

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadBox() {
  const [file,     setFile]     = useState(null);
  const [type,     setType]     = useState('');
  const [mois,     setMois]     = useState('');
  const [annee,    setAnnee]    = useState('2025');
  const [status,   setStatus]   = useState(null); // null | loading | success | error
  const [result,   setResult]   = useState(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  // ── Drag & drop ──────────────────────────────────────────
  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = ()  => setDragging(false);

  // ── Submit ───────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!file || !type || !mois) {
      setStatus('error');
      setResult({ message: 'Veuillez remplir tous les champs.' });
      return;
    }

    const formData = new FormData();
    formData.append('file',  file);
    formData.append('type',  type);
    formData.append('mois',  mois);
    formData.append('annee', annee);

    try {
      setStatus('loading');
      setProgress(0);
      setResult(null);

      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:3000/upload',
        formData,
        {
          headers: {
            Authorization:  `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (e) => {
            if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
          },
        },
      );

      setProgress(100);
      setStatus('success');
      setResult(res.data);
      setFile(null);

    } catch (err) {
      setStatus('error');
      setResult({
        message: err.response?.data?.message || "Erreur lors de l'import",
      });
    }
  };

  // ── Render ───────────────────────────────────────────────
  return (
    <>
      {/* ── Styles injectés dans le composant ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800&display=swap');

        :root {
          --ocp-green-dark:  #1e4d20;
          --ocp-green:       #2d6a2f;
          --ocp-green-mid:   #3a7d3c;
          --ocp-green-light: #4caf50;
          --ocp-green-pale:  #e8f5e9;
          --ocp-green-bg:    #f4faf4;
          --white:           #ffffff;
          --text-dark:       #1a2e1a;
          --text-mid:        #3d5c3e;
          --text-light:      #6a8f6b;
          --border:          #c8e6c9;
          --shadow-sm:  0 2px 8px  rgba(45,106,47,0.10);
          --shadow-md:  0 4px 20px rgba(45,106,47,0.14);
          --radius-sm:  8px;
          --radius-md:  14px;
          --transition: 200ms cubic-bezier(0.4,0,0.2,1);
        }

        /* ── Card ── */
        .upload-box {
          font-family: 'Nunito', sans-serif;
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 36px 32px;
          max-width: 680px;
          box-shadow: var(--shadow-sm);
          transition: box-shadow var(--transition);
        }
        .upload-box:hover { box-shadow: var(--shadow-md); }

        /* ── Header ── */
        .upload-box-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 28px;
          padding-bottom: 18px;
          border-bottom: 1px solid var(--ocp-green-pale);
        }
        .upload-box-header-icon { color: var(--ocp-green); font-size: 18px; font-weight: 800; }
        .upload-box-title {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--ocp-green);
        }

        /* ── Grille champs ── */
        .upload-fields-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }

        /* ── Champ label + select ── */
        .upload-field { display: flex; flex-direction: column; gap: 6px; }

        .upload-field label {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: var(--ocp-green);
        }

        .upload-field select {
          font-family: 'Nunito', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-dark);
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 10px 12px;
          outline: none;
          transition: border-color var(--transition), box-shadow var(--transition);
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%232d6a2f' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 32px;
        }
        .upload-field select:focus {
          border-color: var(--ocp-green);
          box-shadow: 0 0 0 3px rgba(45,106,47,0.12);
        }

        /* ── Drop zone ── */
        .drop-zone {
          border: 2px dashed var(--border);
          border-radius: var(--radius-sm);
          padding: 40px 20px;
          text-align: center;
          cursor: pointer;
          background: var(--ocp-green-bg);
          transition: all var(--transition);
          position: relative;
        }
        .drop-zone:hover, .drop-zone.active {
          border-color: var(--ocp-green-light);
          background: var(--ocp-green-pale);
        }
        .drop-zone input[type="file"] { display: none; }

        .drop-zone-arrow {
          font-size: 30px;
          margin-bottom: 12px;
          display: block;
          color: var(--ocp-green-mid);
          animation: float 3s ease-in-out infinite;
        }
        @keyframes float {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-5px); }
        }

        .drop-zone-text {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-mid);
          margin-bottom: 5px;
        }
        .drop-zone-hint { font-size: 12px; color: var(--text-light); }
        .drop-zone-hint span {
          color: var(--ocp-green);
          font-weight: 700;
          text-decoration: underline;
          cursor: pointer;
        }

        /* ── Tags formats ── */
        .upload-formats {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 16px;
          justify-content: center;
        }
        .format-tag {
          padding: 3px 12px;
          border-radius: 99px;
          background: var(--ocp-green-pale);
          border: 1px solid var(--border);
          color: var(--ocp-green-mid);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        /* ── Fichier sélectionné ── */
        .file-pill {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 16px;
          padding: 12px 16px;
          background: var(--ocp-green-pale);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          animation: slideIn 0.2s ease;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .file-pill-icon { font-size: 22px; flex-shrink: 0; }
        .file-pill-info { flex: 1; min-width: 0; }
        .file-pill-name {
          font-size: 13px;
          font-weight: 700;
          color: var(--ocp-green);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .file-pill-size { font-size: 11px; color: var(--text-light); margin-top: 2px; }
        .file-pill-remove {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-light);
          font-size: 16px;
          padding: 4px 6px;
          border-radius: 4px;
          transition: all var(--transition);
          flex-shrink: 0;
        }
        .file-pill-remove:hover { color: #c0392b; background: #fdecea; }

        /* ── Barre de progression ── */
        .upload-progress-wrap {
          margin-top: 16px;
          background: var(--ocp-green-pale);
          border-radius: 99px;
          height: 6px;
          overflow: hidden;
        }
        .upload-progress-bar {
          height: 100%;
          border-radius: 99px;
          background: linear-gradient(90deg, var(--ocp-green-dark), var(--ocp-green-light));
          transition: width 300ms ease;
        }

        /* ── Bouton ── */
        .upload-btn {
          margin-top: 24px;
          width: 100%;
          padding: 14px;
          border-radius: var(--radius-sm);
          border: none;
          background: var(--ocp-green);
          color: var(--white);
          font-family: 'Nunito', sans-serif;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all var(--transition);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .upload-btn:hover:not(:disabled) {
          background: var(--ocp-green-dark);
          box-shadow: var(--shadow-md);
          transform: translateY(-1px);
        }
        .upload-btn:active:not(:disabled) { transform: translateY(0); box-shadow: none; }
        .upload-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        /* Spinner */
        .spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: var(--white);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Messages feedback ── */
        .upload-message {
          margin-top: 16px;
          padding: 14px 16px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          animation: slideIn 0.2s ease;
          line-height: 1.5;
        }
        .upload-message.success {
          background: var(--ocp-green-pale);
          border: 1px solid var(--border);
          color: var(--ocp-green);
        }
        .upload-message.error {
          background: #fdecea;
          border: 1px solid #f5c6c6;
          color: #c0392b;
        }
        .upload-message-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
        .upload-message-body { display: flex; flex-direction: column; gap: 4px; }
        .upload-message-body strong { font-weight: 800; }
        .upload-message-detail {
          font-size: 12px;
          opacity: 0.85;
          font-weight: 500;
        }
      `}</style>

      <div className="upload-box">

        {/* ── En-tête ── */}
        <div className="upload-box-header">
          <span className="upload-box-header-icon">↑</span>
          <span className="upload-box-title">Importer un fichier Excel</span>
        </div>

        {/* ── Champs type / mois / année ── */}
        <div className="upload-fields-grid">
          <div className="upload-field">
            <label>Type de fichier</label>
            <select value={type} onChange={e => setType(e.target.value)}>
              <option value="">— Choisir —</option>
              <option value="PRODUCTION">Production journalière</option>
              <option value="CHARGES">Charges variables & fixes</option>
              <option value="RECAP">Récapitulatif mensuel</option>
            </select>
          </div>

          <div className="upload-field">
            <label>Mois</label>
            <select value={mois} onChange={e => setMois(e.target.value)}>
              <option value="">— Choisir —</option>
              {MOIS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="upload-field">
            <label>Année</label>
            <select value={annee} onChange={e => setAnnee(e.target.value)}>
              {ANNEES.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        {/* ── Zone de dépôt ── */}
        <div
          className={`drop-zone${dragging ? ' active' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={e => setFile(e.target.files[0])}
          />
          <span className="drop-zone-arrow">↑</span>
          <p className="drop-zone-text">Glissez votre fichier ici</p>
          <p className="drop-zone-hint">
            ou <span>parcourir</span> depuis votre ordinateur
          </p>
          <div className="upload-formats">
            <span className="format-tag">.xlsx</span>
            <span className="format-tag">.xls</span>
          </div>
        </div>

        {/* ── Fichier sélectionné ── */}
        {file && (
          <div className="file-pill">
            <span className="file-pill-icon">📊</span>
            <div className="file-pill-info">
              <div className="file-pill-name">{file.name}</div>
              <div className="file-pill-size">{formatSize(file.size)}</div>
            </div>
            <button
              className="file-pill-remove"
              onClick={e => { e.stopPropagation(); setFile(null); }}
              title="Supprimer"
            >✕</button>
          </div>
        )}

        {/* ── Barre de progression ── */}
        {status === 'loading' && (
          <div className="upload-progress-wrap">
            <div className="upload-progress-bar" style={{ width: `${progress}%` }} />
          </div>
        )}

        {/* ── Bouton ── */}
        <button
          className="upload-btn"
          onClick={handleSubmit}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? (
            <><span className="spinner" /> Traitement en cours…</>
          ) : (
            <>↑ &nbsp;Importer</>
          )}
        </button>

        {/* ── Feedback succès ── */}
        {status === 'success' && result && (
          <div className="upload-message success">
            <span className="upload-message-icon">✓</span>
            <div className="upload-message-body">
              <strong>{result.message}</strong>
              <span className="upload-message-detail">
                Feuille lue : <strong>{result.feuilleLue}</strong>
                &nbsp;·&nbsp;
                Lignes importées : <strong>{result.lignesSauvegardees}</strong>
              </span>
            </div>
          </div>
        )}

        {/* ── Feedback erreur ── */}
        {status === 'error' && result && (
          <div className="upload-message error">
            <span className="upload-message-icon">✕</span>
            <div className="upload-message-body">
              {result.message}
            </div>
          </div>
        )}
      </div>
    </>
  );
}