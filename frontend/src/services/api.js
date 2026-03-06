import axios from 'axios';

// Alamat backend API (Python FastAPI)
// const API_BASE_URL = 'http://127.0.0.1:8000/api';
const API_BASE_URL = 'https://siteliti-autograder-ai-assistant.onrender.com/api';

export const gradePaper = async (file, instruction) => {
//   Membuat FormData untuk mengirim file dan instruksi
  const formData = new FormData();
  formData.append('file', file);
  formData.append('instruction', instruction);

  try {
    const response = await axios.post(`${API_BASE_URL}/grade`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data; // Mengembalikan JSON dari backend
  } catch (error) {
    console.error("Gagal menghubungi backend:", error);
    throw error;
  }
};