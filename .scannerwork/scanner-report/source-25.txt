import axios from 'axios';

const API = 'http://localhost:3000';

export const uploadExcel = async (file, token) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(`${API}/upload`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};