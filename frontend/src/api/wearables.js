import axios from 'axios';

const apiBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080';

const client = axios.create({
  baseURL: apiBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function startGoogleFitLogin(userId) {
  if (!userId) {
    throw new Error('userId is required');
  }

  window.location.href = `${apiBaseURL}/api/wearables/google/login?user_id=${encodeURIComponent(userId)}`;
}

export async function syncGoogleFit(userId) {
  if (!userId) {
    throw new Error('userId is required');
  }

  const response = await client.post('/api/wearables/google/sync', { user_id: userId });
  return response.data;
}

export async function getWearableData(userId) {
  if (!userId) {
    throw new Error('userId is required');
  }

  const response = await client.get(`/api/wearables/${encodeURIComponent(userId)}`);
  return response.data;
}

export function formatWearableTimestamp(value) {
  if (!value) {
    return 'Never synced';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Never synced';
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default {
  startGoogleFitLogin,
  syncGoogleFit,
  getWearableData,
  formatWearableTimestamp,
};
