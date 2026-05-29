export async function getAnalyticsSnapshot() {
  // Placeholder analytics until a dedicated backend analytics endpoint is added.
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
