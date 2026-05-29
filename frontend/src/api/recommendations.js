import apiClient from '../services/apiClient';

export async function generateRecommendations(payload) {
  const response = await apiClient.post('/recommendations/generate', payload);
  return response.data;
}
