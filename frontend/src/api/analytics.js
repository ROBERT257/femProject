export async function getAnalyticsSnapshot({ patientId } = {}) {
  try {
    const params = new URLSearchParams();
    if (patientId) {
      params.set('patient_id', String(patientId));
    }
    const query = params.toString();
    const res = await fetch(`/api/analytics/snapshot${query ? `?${query}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch analytics');
    const payload = await res.json();
    return payload;
  } catch (e) {
    // Fallback placeholder
    return {
      painTrend: [
        { day: 'Mon', pain: 7, fatigue: 8, adherence: 50 },
        { day: 'Tue', pain: 6, fatigue: 7, adherence: 60 },
        { day: 'Wed', pain: 5, fatigue: 6, adherence: 72 },
        { day: 'Thu', pain: 5, fatigue: 5, adherence: 76 },
        { day: 'Fri', pain: 4, fatigue: 5, adherence: 82 },
        { day: 'Sat', pain: 4, fatigue: 4, adherence: 85 },
        { day: 'Sun', pain: 3, fatigue: 4, adherence: 90 },
      ],
    };
  }
}
