import { useState, useRef } from 'react';
import axios from 'axios';
import './UploadBox.css';

export default function UploadBox() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' | 'error'
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
  };

  const selectFile = (selected) => {
    if (!selected) return;
    if (!selected.name.match(/\.(xlsx|xls)$/i)) {
      setMessage('Format non supporté. Utilisez .xlsx ou .xls');
      setMessageType('error');
      return;
    }
    setFile(selected);
    setMessage('');
    setProgress(0);
  };

  const handleFileChange = (e) => selectFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    selectFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Veuillez sélectionner un fichier');
      setMessageType('error');
      return;
    }
    setLoading(true);
    setProgress(0);
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token');

      const response = await axios.post(
        'http://localhost:3000/upload',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (e) => {
            setProgress(Math.round((e.loaded * 100) / e.total));
          },
        }
      );

      setMessage(response.data.message || 'Fichier importé avec succès');
      setMessageType('success');
      setProgress(100);
    } catch {
      setMessage("Erreur lors de l'import. Veuillez réessayer.");
      setMessageType('error');
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`upload-box${dragging ? ' dragging' : ''}`}>

      {/* En-tête */}
      <div className="upload-box-header">
        <span className="upload-box-header-icon">+</span>
        <span className="upload-box-title">Importer un fichier Excel</span>
      </div>

      {/* Zone de dépôt */}
      <div
        className={`drop-zone${dragging ? ' active' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <span className="drop-zone-arrow">⬆</span>
        <div className="drop-zone-text">Glissez-déposez votre fichier ici</div>
        <div className="drop-zone-hint">
          ou{' '}
          <span onClick={() => inputRef.current?.click()}>
            parcourir vos fichiers
          </span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
        />
      </div>

      {/* Formats acceptés */}
      <div className="upload-formats">
        <span className="format-tag">.xlsx</span>
        <span className="format-tag">.xls</span>
        <span className="format-tag">Excel 97–2019</span>
      </div>

      {/* Fichier sélectionné */}
      {file && (
        <div className="file-pill">
          <span className="file-pill-icon">📋</span>
          <div className="file-pill-info">
            <div className="file-pill-name">{file.name}</div>
            <div className="file-pill-size">{formatSize(file.size)}</div>
          </div>
          <button
            className="file-pill-remove"
            onClick={() => { setFile(null); setMessage(''); setProgress(0); }}
            title="Retirer"
          >✕</button>
        </div>
      )}

      {/* Barre de progression */}
      {progress > 0 && progress < 100 && (
        <div className="upload-progress-wrap">
          <div className="upload-progress-bar" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={`upload-message ${messageType}`}>
          {messageType === 'success' ? '✓' : '⚠'} {message}
        </div>
      )}

      {/* Bouton */}
      <button
        className={`upload-btn${loading ? ' loading' : ''}`}
        onClick={handleUpload}
        disabled={loading || !file}
      >
        {loading ? 'Envoi en cours…' : '+ Lancer l\'import'}
      </button>

    </div>
  );
}