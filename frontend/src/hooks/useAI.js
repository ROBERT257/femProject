import { useState } from 'react';
import { sendAIChat } from '../api/ai';

export function useAI(userId = 1) {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState('');

  const askAI = async (message) => {
    if (!message?.trim()) {
      return null;
    }

    setLoading(true);
    setError('');
    try {
      const payload = await sendAIChat({ userId, message: message.trim() });
      setResponse(payload);
      return payload;
    } catch (err) {
      const nextError = err?.response?.data || err?.message || 'AI request failed';
      setError(String(nextError));
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    response,
    error,
    askAI,
  };
}
