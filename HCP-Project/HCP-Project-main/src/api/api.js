import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_PYTHON_API_URL
});

export const getPrediction = async (symptoms) => {
    try {
        const response = await api.post('/predict', { symptoms });
        return response.data;
    } catch (error) {
        console.error('Prediction error:', error);
        throw error;
    }
};

export default api;
