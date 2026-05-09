import { useState } from 'react';
import axios from 'axios';

export default function UploadPage() {

  const [file, setFile] = useState(null);

  const [message, setMessage] =
    useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {

    if (!file) {
      setMessage(
        'Veuillez sélectionner un fichier',
      );
      return;
    }

    try {

      const formData = new FormData();

      formData.append('file', file);

      const token =
        localStorage.getItem('token');

      const response = await axios.post(
        'http://localhost:3000/upload',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type':
              'multipart/form-data',
          },
        },
      );

      setMessage(response.data.message);

      console.log(response.data);

    } catch (error) {

      setMessage(
        'Erreur lors de l’upload',
      );

      console.error(error);
    }
  };

  return (
    <div style={{ padding: '40px' }}>

      <h1>Upload fichier Excel</h1>

      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
      />

      <br /><br />

      <button onClick={handleUpload}>
        Upload
      </button>

      <p>{message}</p>

    </div>
  );
}