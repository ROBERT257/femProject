import React, { useEffect, useMemo, useState } from 'react';
import ExerciseRow from './ExerciseRow';

export default function PlanEditor({ planId, onUpdated, onDeleted, showToast }) {
  const [plan, setPlan] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reviewed, setReviewed] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!planId) {
        setPlan(null);
        setProgress(null);
        setReviewed(false);
        return;
      }
      setLoading(true);
      setProgress(null);
      try {
        const [planResponse, progressResponse] = await Promise.all([
          fetch(`/rehab-plans/${planId}`),
          fetch(`/rehab-plans/${planId}/progress`),
        ]);

        if (!planResponse.ok) throw new Error(await planResponse.text());
        if (!progressResponse.ok) throw new Error(await progressResponse.text());

        const [data, progressData] = await Promise.all([
          planResponse.json(),
          progressResponse.json(),
        ]);
        if (!active) return;
        setPlan(data);
        setProgress(progressData);
        setReviewed(false);
      } catch (e) {
        console.error('Failed to load plan', e);
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [planId]);

  const completionPercent = useMemo(() => {
    if (!progress || !progress.total_exercises) return 0;
    return Math.round(((progress.completed_exercises || 0) / progress.total_exercises) * 100);
  }, [progress]);

  const painTone = useMemo(() => {
    const value = Number(progress?.average_pain_level || 0);
    if (value >= 7) return 'danger';
    if (value >= 4) return 'warning';
    return 'good';
  }, [progress]);

  const painLabel = useMemo(() => {
    const value = Number(progress?.average_pain_level || 0);
    if (value >= 7) return 'High pain trend';
    if (value >= 4) return 'Moderate pain trend';
    return 'Low pain trend';
  }, [progress]);

  const painSeries = useMemo(() => {
    const exercises = Array.isArray(progress?.exercises) ? progress.exercises : [];

    if (exercises.length === 0) {
      return [];
    }

    return exercises.slice(-6).map((entry) => {
      const rawPain = Number(entry.pain_level || 0);
      const pain = Math.max(0, Math.min(10, rawPain));
      return {
        label: entry.exercise || 'Exercise',
        value: pain,
        height: `${Math.max(12, pain * 10)}%`,
      };
    });
  }, [progress]);

  function handleQuickAction(action) {
    if (action === 'reviewed') {
      setReviewed(true);
      showToast && showToast('Marked plan as reviewed', 'success');
      return;
    }

    if (action === 'adjust') {
      showToast && showToast('Open the plan builder to adjust this plan', 'info');
      return;
    }

    if (action === 'reminder') {
      showToast && showToast('Reminder queued for the patient', 'success');
    }
  }

  if (!planId) return <div className="panel"><p>No plan selected.</p></div>;
  if (loading) return <div className="panel"><p>Loading...</p></div>;
  if (!plan) return <div className="panel"><p>Plan not found.</p></div>;

  async function savePlan() {
    try {
      const res = await fetch(`/rehab-plans/${plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan),
      });
      if (!res.ok) throw new Error(await res.text());
      onUpdated && onUpdated();
      showToast && showToast('Plan saved successfully', 'success');
    } catch (e) {
      showToast && showToast('Plan save failed', 'error');
    }
  }

  // Optimistic update: apply change locally, attempt server update, revert on failure
  async function updateExerciseOnServer(entry, previous) {
    try {
      const res = await fetch(`/rehab-exercises/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      if (!res.ok) throw new Error(await res.text());
      onUpdated && onUpdated();
      showToast && showToast('Exercise saved successfully', 'success');
    } catch (e) {
      // revert
      setPlan((p) => ({ ...p, entries: p.entries.map(en => en.id === previous.id ? previous : en) }));
      showToast && showToast('Exercise save failed', 'error');
    }
  }

  async function deleteExercise(id) {
    if (!confirm('Delete this exercise?')) return;
    try {
      const res = await fetch(`/rehab-exercises/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      // reload plan
      const refreshed = await (await fetch(`/rehab-plans/${plan.id}`)).json();
      setPlan(refreshed);
      onUpdated && onUpdated();
      showToast && showToast('Exercise deleted successfully', 'success');
    } catch (e) {
      showToast && showToast('Exercise delete failed', 'error');
    }
  }

  async function deletePlan() {
    if (!confirm('Delete this plan and all exercises?')) return;
    try {
      const res = await fetch(`/rehab-plans/${plan.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      onDeleted && onDeleted(plan.id);
    } catch (e) {
      showToast && showToast('Plan delete failed', 'error');
    }
  }

  return (
    <section className="panel inspector-shell">
      <div className="inspector-topbar">
        <div>
          <p className="eyebrow">Inspector Panel</p>
          <h2>{plan.title}</h2>
          <p className="inspector-subtitle">Live detail view for patient status, session quality, and next actions.</p>
        </div>

        <div className={`review-pill ${reviewed ? 'active' : ''}`}>
          {reviewed ? 'Reviewed' : 'Unreviewed'}
        </div>
      </div>

      <div className="inspector-summary-grid">
        <article className="summary-card summary-card-primary">
          <div className="summary-card-title">
            <span>Patient summary</span>
            <span className="badge">{plan.status || 'n/a'}</span>
          </div>
          <strong>{plan.patient_name || 'Unknown patient'}</strong>
          <p>{plan.therapist_name || 'No therapist'} · {plan.start_date || 'No start date'}</p>
          <p>{plan.goal || 'No recovery goal added yet.'}</p>
        </article>

        <article className="summary-card">
          <div className="summary-card-title">
            <span>Current progress</span>
            <strong>{completionPercent}%</strong>
          </div>
          <div className="progress-bar">
            <span style={{ width: `${completionPercent}%` }} />
          </div>
          <p>{progress?.completed_exercises || 0} of {progress?.total_exercises || 0} exercises completed</p>
        </article>

        <article className={`summary-card pain-${painTone}`}>
          <div className="summary-card-title">
            <span>Pain trend</span>
            <strong>{typeof progress?.average_pain_level === 'number' ? progress.average_pain_level.toFixed(1) : '0.0'}</strong>
          </div>
          <div className="pain-chart" aria-label="Pain trend chart">
            {painSeries.length > 0 ? painSeries.map((point, index) => (
              <div key={`${point.label}-${index}`} className="pain-bar-group" title={`${point.label}: ${point.value}`}>
                <div className="pain-bar-track">
                  <span className={`pain-bar pain-${painTone}`} style={{ height: point.height }} />
                </div>
                <small>{point.label}</small>
              </div>
            )) : (
              <div className="pain-empty">
                <div className="pain-chart-placeholder" />
                <p>No pain data yet</p>
              </div>
            )}
          </div>
          <p>{painLabel}</p>
        </article>
      </div>

      <div className="inspector-actions">
        <button className="button button-secondary" type="button" onClick={() => handleQuickAction('reviewed')}>Mark as reviewed</button>
        <button className="button button-secondary" type="button" onClick={() => handleQuickAction('adjust')}>Adjust plan</button>
        <button className="button button-primary" type="button" onClick={() => handleQuickAction('reminder')}>Send reminder</button>
      </div>

      <div className="session-timeline">
        <div className="panel-heading compact">
          <div>
            <p className="eyebrow">Latest session history</p>
            <h3>Timeline</h3>
          </div>
          <p>Color-coded entries from the latest progress snapshot.</p>
        </div>

        <div className="timeline-list">
          {Array.isArray(progress?.exercises) && progress.exercises.length > 0 ? progress.exercises.map((entry, index) => (
            <article key={`${entry.exercise}-${index}`} className={`timeline-item ${entry.completion_status || 'pending'}`}>
              <div className="timeline-dot" />
              <div className="timeline-content">
                <div className="timeline-head">
                  <strong>{entry.exercise || 'Exercise'}</strong>
                  <span className="pill">{entry.completion_status || 'pending'}</span>
                </div>
                <p>{entry.patient_notes || 'No patient note captured.'}</p>
                <small>Pain {entry.pain_level ?? 0} · {entry.therapist_comments || 'No therapist note.'}</small>
              </div>
            </article>
          )) : <p className="empty-timeline">No session timeline available yet.</p>}
        </div>
      </div>

      <details className="plan-editor-details" open>
        <summary>Adjust plan</summary>
        <div className="plan-editor-body">
          <label>
            <span>Title</span>
            <input value={plan.title || ''} onChange={(e) => setPlan({ ...plan, title: e.target.value })} />
          </label>
          <label>
            <span>Goal</span>
            <textarea value={plan.goal || ''} onChange={(e) => setPlan({ ...plan, goal: e.target.value })} />
          </label>
          <label>
            <span>Status</span>
            <select value={plan.status || 'active'} onChange={(e) => setPlan({ ...plan, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </label>

          <div className="form-actions">
            <button className="button button-primary" onClick={savePlan}>Save plan</button>
            <button className="button button-danger" onClick={deletePlan}>Delete plan</button>
          </div>
        </div>
      </details>

      <div className="entries">
        <h3>Exercises</h3>
        {Array.isArray(plan.entries) && plan.entries.map((entry, idx) => (
          <ExerciseRow
            key={entry.id || idx}
            entry={entry}
            onChange={(next) => {
              const previous = plan.entries.find(en => en.id === entry.id) || { ...entry };
              setPlan((p) => ({ ...p, entries: p.entries.map((en) => en.id === entry.id ? next : en) }));
              updateExerciseOnServer(next, previous);
            }}
            onSave={(next) => {
              const previous = plan.entries.find(en => en.id === entry.id) || { ...entry };
              setPlan((p) => ({ ...p, entries: p.entries.map((en) => en.id === entry.id ? next : en) }));
              updateExerciseOnServer(next, previous);
            }}
            onDelete={(id) => deleteExercise(id)}
          />
        ))}
      </div>
    </section>
  );
}
