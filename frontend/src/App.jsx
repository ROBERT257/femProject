import { useEffect, useMemo, useState } from 'react';

const defaultEntry = (orderIndex = 1) => ({
  exercise: '',
  sets: 3,
  reps: 10,
  duration_seconds: '',
  weight: '',
  notes: '',
  completion_status: 'pending',
  pain_level: 1,
  patient_notes: '',
  therapist_comments: '',
  order_index: orderIndex,
});

function compactJson(value) {
  return JSON.stringify(value, null, 2);
}

function normalizeNumber(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildEntry(entry) {
  const reps = normalizeNumber(entry.reps);
  const durationSeconds = normalizeNumber(entry.duration_seconds);
  const painLevel = normalizeNumber(entry.pain_level);

  return {
    exercise: entry.exercise.trim(),
    sets: Math.max(1, Number(entry.sets) || 1),
    reps,
    duration_seconds: durationSeconds,
    weight: normalizeNumber(entry.weight),
    notes: entry.notes.trim(),
    completion_status: entry.completion_status,
    pain_level: painLevel == null ? 1 : Math.min(10, Math.max(1, painLevel)),
    patient_notes: entry.patient_notes.trim(),
    therapist_comments: entry.therapist_comments.trim(),
    order_index: Math.max(1, Number(entry.order_index) || 1),
  };
}

function Metric({ label, value, accent }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong style={{ color: accent }}>{value}</strong>
    </div>
  );
}

function App() {
  const [health, setHealth] = useState('Checking API...');
  const [healthTone, setHealthTone] = useState('neutral');
  const [screen, setScreen] = useState('therapist');
  const [entries, setEntries] = useState([defaultEntry(1)]);
  const [lookupId, setLookupId] = useState('');
  const [progressLookupId, setProgressLookupId] = useState('');
  const [progressSummary, setProgressSummary] = useState([]);
  const [progressJson, setProgressJson] = useState('{}');
  const [loading, setLoading] = useState(false);
  const [resultTitle, setResultTitle] = useState('Nothing loaded yet');
  const [resultMeta, setResultMeta] = useState('Create or fetch a rehabilitation plan to inspect the response here.');
  const [resultBadge, setResultBadge] = useState('Idle');
  const [resultStats, setResultStats] = useState([]);
  const [resultJson, setResultJson] = useState('{}');

  const entryCount = entries.length;
  const readyEntryCount = useMemo(
    () => entries.filter((entry) => entry.exercise.trim().length > 0).length,
    [entries],
  );

  const therapistEntries = useMemo(
    () => entries.map((entry, index) => ({
      ...entry,
      rowNumber: index + 1,
    })),
    [entries],
  );

  useEffect(() => {
    let active = true;

    fetch('/health')
      .then(async (response) => {
        const text = await response.text();
        if (!active) {
          return;
        }

        if (response.ok) {
          setHealth(text);
          setHealthTone('good');
        } else {
          setHealth(`API responded with ${response.status}`);
          setHealthTone('bad');
        }
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setHealth('API is not reachable');
        setHealthTone('bad');
      });

    return () => {
      active = false;
    };
  }, []);

  function updateEntry(index, field, value) {
    setEntries((current) =>
      current.map((entry, currentIndex) =>
        currentIndex === index ? { ...entry, [field]: value } : entry,
      ),
    );
  }

  function addEntry() {
    setEntries((current) => [...current, defaultEntry(current.length + 1)]);
  }

  function removeEntry(index) {
    setEntries((current) => {
      const next = current.filter((_, currentIndex) => currentIndex !== index);
      return next.length > 0 ? next.map((entry, nextIndex) => ({ ...entry, order_index: nextIndex + 1 })) : [defaultEntry(1)];
    });
  }

  function showResponse(kind, payload) {
    const entryTotal = Array.isArray(payload.entries) ? payload.entries.length : 0;
    setResultTitle(payload.title || `Rehab plan ${payload.id}`);
    setResultMeta(`${kind} rehabilitation plan ${payload.id} with ${entryTotal} entr${entryTotal === 1 ? 'y' : 'ies'}.`);
    setResultBadge(kind);
    setResultStats([
      { label: 'Plan ID', value: payload.id ?? 'n/a' },
      { label: 'Exercises', value: entryTotal },
      { label: 'Patient', value: payload.patient_name || 'n/a' },
      { label: 'Status', value: payload.status || 'pending' },
    ]);
    setResultJson(compactJson(payload));
  }

  function showProgress(payload) {
    setProgressSummary([
      { label: 'Completed', value: payload.completed_exercises ?? 0 },
      { label: 'Skipped', value: payload.skipped_exercises ?? 0 },
      { label: 'Pending', value: payload.pending_exercises ?? 0 },
      { label: 'Avg pain', value: typeof payload.average_pain_level === 'number' ? payload.average_pain_level.toFixed(1) : 'n/a' },
    ]);
    setProgressJson(compactJson(payload));
  }

  async function handleCreateRehabPlan(event) {
    event.preventDefault();
    setLoading(true);

    try {
      const form = new FormData(event.currentTarget);
      const payload = {
        patient_name: String(form.get('patient_name') || '').trim(),
        therapist_name: String(form.get('therapist_name') || '').trim(),
        title: String(form.get('title') || '').trim(),
        goal: String(form.get('goal') || '').trim(),
        status: String(form.get('status') || 'active').trim() || 'active',
        start_date: String(form.get('start_date') || '').trim(),
        description: String(form.get('description') || '').trim(),
        entries: entries.map(buildEntry).filter((entry) => entry.exercise.length > 0),
      };

      if (!payload.patient_name) {
        throw new Error('Patient name is required');
      }

      if (!payload.therapist_name) {
        throw new Error('Therapist name is required');
      }

      if (!payload.title) {
        throw new Error('Plan title is required');
      }

      if (payload.entries.length === 0) {
        throw new Error('Add at least one rehabilitation exercise');
      }

      const response = await fetch('/rehab-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const created = await response.json();
      showResponse('Created', created);
      setLookupId(String(created.id));
      setHealthTone('good');
      setHealth(`Saved rehabilitation plan ${created.id} successfully.`);
    } catch (error) {
      setResultBadge('Error');
      setResultTitle('Request failed');
      setResultMeta(error instanceof Error ? error.message : 'Unknown error');
      setResultJson(compactJson({ error: error instanceof Error ? error.message : 'Unknown error' }));
      setResultStats([]);
      setHealthTone('bad');
      setHealth('Rehabilitation plan save failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleLookupRehabPlan(event) {
    event.preventDefault();
    const id = Number(lookupId);

    if (!Number.isFinite(id) || id <= 0) {
      setResultBadge('Error');
      setResultTitle('Invalid ID');
      setResultMeta('Enter a positive rehabilitation plan ID.');
      setResultJson(compactJson({ error: 'Invalid rehabilitation plan ID' }));
      setResultStats([]);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/rehab-plans/${id}`);
      if (!response.ok) {
        throw new Error(await response.text());
      }

      const rehabPlan = await response.json();
      showResponse('Loaded', rehabPlan);
      setHealthTone('good');
      setHealth(`Loaded rehabilitation plan ${rehabPlan.id} successfully.`);
    } catch (error) {
      setResultBadge('Error');
      setResultTitle('Lookup failed');
      setResultMeta(error instanceof Error ? error.message : 'Unknown error');
      setResultJson(compactJson({ error: error instanceof Error ? error.message : 'Unknown error' }));
      setResultStats([]);
      setHealthTone('bad');
      setHealth('Rehabilitation plan lookup failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadProgress(event) {
    event.preventDefault();
    const id = Number(progressLookupId);

    if (!Number.isFinite(id) || id <= 0) {
      setProgressSummary([]);
      setProgressJson(compactJson({ error: 'Invalid rehabilitation plan ID' }));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/rehab-plans/${id}/progress`);
      if (!response.ok) {
        throw new Error(await response.text());
      }

      const payload = await response.json();
      showProgress(payload);
      setHealthTone('good');
      setHealth(`Loaded recovery history for plan ${payload.plan_id}`);
    } catch (error) {
      setProgressSummary([]);
      setProgressJson(compactJson({ error: error instanceof Error ? error.message : 'Unknown error' }));
      setHealthTone('bad');
      setHealth('Recovery history lookup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell">
      <div className="noise" />
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">femProject rehab console</p>
          <h1>Track rehabilitation plans with a React dashboard built on your Go API.</h1>
          <p className="lede">
            The UI stays focused on what your backend already does best: create rehabilitation plans, fetch them by ID, and keep PostgreSQL as the source of truth.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="/health" target="_blank" rel="noreferrer">Check health</a>
            <a className="button button-secondary" href="#create-rehab-plan">Create rehab plan</a>
          </div>
          <div className="screen-tabs" role="tablist" aria-label="Rehabilitation screens">
            <button className={`screen-tab ${screen === 'therapist' ? 'active' : ''}`} type="button" onClick={() => setScreen('therapist')}>Therapist screen</button>
            <button className={`screen-tab ${screen === 'patient' ? 'active' : ''}`} type="button" onClick={() => setScreen('patient')}>Patient screen</button>
            <button className={`screen-tab ${screen === 'history' ? 'active' : ''}`} type="button" onClick={() => setScreen('history')}>Follow-up history</button>
          </div>
        </div>

        <aside className="status-card">
          <div className="status-header">
            <span className={`status-pill ${healthTone}`}>{healthTone === 'good' ? 'Online' : healthTone === 'bad' ? 'Needs attention' : 'Checking'}</span>
            <strong>{health}</strong>
          </div>
          <div className="status-grid">
            <Metric label="API" value="Go + Chi" accent="var(--accent)" />
            <Metric label="Storage" value="PostgreSQL" accent="var(--accent-2)" />
            <Metric label="Migrations" value="Goose" accent="var(--accent-3)" />
            <Metric label="Front end" value="React" accent="var(--text)" />
          </div>
        </aside>
      </header>

      <main className="layout">
        <section className="panel" id="create-rehab-plan">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Rehabilitation builder</p>
              <h2>Create a new rehab plan</h2>
            </div>
            <p>Build a rehabilitation plan with one or more exercises and save it straight to PostgreSQL.</p>
          </div>

          {screen === 'therapist' && (
            <div className="info-banner">
              <strong>Therapist screen</strong>
              <p>Create plans, assign exercises, and monitor session quality.</p>
            </div>
          )}

          {screen === 'patient' && (
            <div className="info-banner">
              <strong>Patient screen</strong>
              <p>Review your plan, record pain, and mark exercises completed or skipped.</p>
            </div>
          )}

          <form className="stack-form" onSubmit={handleCreateRehabPlan}>
            <div className="form-grid two-up">
              <label>
                <span>Patient name</span>
                <input name="patient_name" type="text" placeholder="Ava Johnson" required />
              </label>
              <label>
                <span>Therapist name</span>
                <input name="therapist_name" type="text" placeholder="Dr. Lee" required />
              </label>
            </div>

            <div className="form-grid two-up">
              <label>
                <span>Plan title</span>
                <input name="title" type="text" placeholder="Post ACL Recovery" required />
              </label>
              <label>
                <span>Start date</span>
                <input name="start_date" type="date" />
              </label>
            </div>

            <label>
              <span>Recovery goal</span>
              <textarea name="goal" rows="3" placeholder="Restore knee mobility, reduce pain, and improve strength" />
            </label>

            <div className="form-grid two-up">
              <label>
                <span>Status</span>
                <select name="status" defaultValue="active">
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </label>
              <div className="inline-note">
                <strong>Exercises</strong>
                <p>Add at least one exercise. Track pain, completion status, and notes for each row.</p>
              </div>
            </div>

            <div className="entries">
              {therapistEntries.map((entry, index) => (
                <div className="entry-row" key={`${index}-${entry.order_index}`}>
                  <div className="entry-header">
                    <strong>Exercise {entry.rowNumber}</strong>
                    <span className={`status-pill ${entry.completion_status}`}>{entry.completion_status}</span>
                  </div>
                  <div className="entry-top">
                    <label>
                      <span>Exercise</span>
                      <input value={entry.exercise} onChange={(event) => updateEntry(index, 'exercise', event.target.value)} type="text" placeholder="Bench Press" required />
                    </label>
                    <label>
                      <span>Sets</span>
                      <input value={entry.sets} onChange={(event) => updateEntry(index, 'sets', event.target.value)} type="number" min="1" step="1" placeholder="3" required />
                    </label>
                  </div>
                  <div className="entry-mid">
                    <label>
                      <span>Reps</span>
                      <input value={entry.reps} onChange={(event) => updateEntry(index, 'reps', event.target.value)} type="number" min="1" step="1" placeholder="10" />
                    </label>
                    <label>
                      <span>Duration seconds</span>
                      <input value={entry.duration_seconds} onChange={(event) => updateEntry(index, 'duration_seconds', event.target.value)} type="number" min="1" step="1" placeholder="60" />
                    </label>
                    <label>
                      <span>Weight</span>
                      <input value={entry.weight} onChange={(event) => updateEntry(index, 'weight', event.target.value)} type="number" min="0" step="0.5" placeholder="75.5" />
                    </label>
                    <label>
                      <span>Pain level</span>
                      <input value={entry.pain_level} onChange={(event) => updateEntry(index, 'pain_level', event.target.value)} type="number" min="1" max="10" step="1" placeholder="3" />
                    </label>
                    <label>
                      <span>Order</span>
                      <input value={entry.order_index} onChange={(event) => updateEntry(index, 'order_index', event.target.value)} type="number" min="1" step="1" placeholder="1" required />
                    </label>
                  </div>
                  <label>
                    <span>Patient notes</span>
                    <input value={entry.patient_notes} onChange={(event) => updateEntry(index, 'patient_notes', event.target.value)} type="text" placeholder="Felt mild discomfort but completed all reps" />
                  </label>
                  <label>
                    <span>Therapist comments</span>
                    <input value={entry.therapist_comments} onChange={(event) => updateEntry(index, 'therapist_comments', event.target.value)} type="text" placeholder="Progress is steady; continue as tolerated" />
                  </label>
                  <label>
                    <span>Completion status</span>
                    <select value={entry.completion_status} onChange={(event) => updateEntry(index, 'completion_status', event.target.value)}>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="skipped">Skipped</option>
                    </select>
                  </label>
                  <button className="entry-remove" type="button" onClick={() => removeEntry(index)}>
                    Remove exercise
                  </button>
                </div>
              ))}
            </div>

            <div className="form-actions">
              <button className="button button-secondary" type="button" onClick={addEntry}>Add exercise</button>
              <button className="button button-primary" type="submit" disabled={loading}>
                {loading ? 'Working...' : 'Save rehab plan'}
              </button>
            </div>
          </form>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Rehab lookup</p>
              <h2>Fetch a saved rehab plan</h2>
            </div>
            <p>Use an ID from the save response to load the rehabilitation plan and its entries back from the database.</p>
          </div>

          <form className="lookup-bar" onSubmit={handleLookupRehabPlan}>
            <input value={lookupId} onChange={(event) => setLookupId(event.target.value)} name="rehab_plan_id" type="number" min="1" step="1" placeholder="Plan ID" required />
            <button className="button button-primary" type="submit" disabled={loading}>Load rehab plan</button>
          </form>

          <article className="result-card">
            <div className="result-header">
              <div>
                <span className="status-label">Last response</span>
                <h3 id="result-title">{resultTitle}</h3>
              </div>
              <span className="badge">{resultBadge}</span>
            </div>
            <p className="result-meta">{resultMeta}</p>
            <div className="result-stats">
              {resultStats.map((stat) => (
                <div key={stat.label} className="stat-card">
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
              ))}
            </div>
            <pre className="result-json">{resultJson}</pre>

            <div className="history-panel">
              <div className="panel-heading compact">
                <div>
                  <p className="eyebrow">Follow-up history</p>
                  <h2>Load recovery timeline</h2>
                </div>
                <p>Pull the summary of completed, skipped, and pending exercises for a plan.</p>
              </div>

              <form className="lookup-bar" onSubmit={handleLoadProgress}>
                <input value={progressLookupId} onChange={(event) => setProgressLookupId(event.target.value)} name="progress_plan_id" type="number" min="1" step="1" placeholder="Plan ID" required />
                <button className="button button-secondary" type="submit" disabled={loading}>Load history</button>
              </form>

              <div className="result-stats history-stats">
                {progressSummary.map((stat) => (
                  <div key={stat.label} className="stat-card">
                    <span>{stat.label}</span>
                    <strong>{stat.value}</strong>
                  </div>
                ))}
              </div>

              <pre className="result-json history-json">{progressJson}</pre>
            </div>
          </article>
        </section>
      </main>

      <footer className="footer-note">
        <span>{entryCount} entries staged</span>
        <span>{readyEntryCount} ready to submit</span>
        <span>Proxying requests to the Go backend on port 8080</span>
      </footer>
    </div>
  );
}

export default App;
