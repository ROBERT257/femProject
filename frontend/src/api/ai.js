import apiClient from '../services/apiClient';

export async function sendAIChat({ userId, message }) {
  const response = await apiClient.post('/ai/chat', {
    user_id: userId,
    message,
  });
  return response.data;
}
