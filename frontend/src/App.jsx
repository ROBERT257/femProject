import { useEffect, useMemo, useState } from 'react';

const defaultEntry = (orderIndex = 1) => ({
  exercise: '',
  sets: 3,
  reps: 10,
  duration_seconds: '',
  weight: '',
  notes: '',
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

  return {
    exercise: entry.exercise.trim(),
    sets: Math.max(1, Number(entry.sets) || 1),
    reps,
    duration_seconds: durationSeconds,
    weight: normalizeNumber(entry.weight),
    notes: entry.notes.trim(),
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
  const [entries, setEntries] = useState([defaultEntry(1)]);
  const [lookupId, setLookupId] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultTitle, setResultTitle] = useState('Nothing loaded yet');
  const [resultMeta, setResultMeta] = useState('Create or fetch a workout to inspect the response here.');
  const [resultBadge, setResultBadge] = useState('Idle');
  const [resultStats, setResultStats] = useState([]);
  const [resultJson, setResultJson] = useState('{}');

  const entryCount = entries.length;
  const readyEntryCount = useMemo(
    () => entries.filter((entry) => entry.exercise.trim().length > 0).length,
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
    setResultTitle(payload.title || `Workout ${payload.id}`);
    setResultMeta(`${kind} workout ${payload.id} with ${entryTotal} entr${entryTotal === 1 ? 'y' : 'ies'}.`);
    setResultBadge(kind);
    setResultStats([
      { label: 'Workout ID', value: payload.id ?? 'n/a' },
      { label: 'Entries', value: entryTotal },
      { label: 'Duration', value: payload.duration_minutes ? `${payload.duration_minutes} min` : 'n/a' },
      { label: 'Calories', value: payload.calories_burned ?? 'n/a' },
    ]);
    setResultJson(compactJson(payload));
  }

  async function handleCreateWorkout(event) {
    event.preventDefault();
    setLoading(true);

    try {
      const form = new FormData(event.currentTarget);
      const payload = {
        title: String(form.get('title') || '').trim(),
        description: String(form.get('description') || '').trim(),
        duration_minutes: Number(form.get('duration_minutes') || 0),
        calories_burned: Number(form.get('calories_burned') || 0),
        entries: entries.map(buildEntry).filter((entry) => entry.exercise.length > 0),
      };

      if (!payload.title) {
        throw new Error('Title is required');
      }

      if (payload.entries.length === 0) {
        throw new Error('Add at least one workout entry');
      }

      const response = await fetch('/workouts', {
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
      setHealth(`Saved workout ${created.id} successfully.`);
    } catch (error) {
      setResultBadge('Error');
      setResultTitle('Request failed');
      setResultMeta(error instanceof Error ? error.message : 'Unknown error');
      setResultJson(compactJson({ error: error instanceof Error ? error.message : 'Unknown error' }));
      setResultStats([]);
      setHealthTone('bad');
      setHealth('Workout save failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleLookupWorkout(event) {
    event.preventDefault();
    const id = Number(lookupId);

    if (!Number.isFinite(id) || id <= 0) {
      setResultBadge('Error');
      setResultTitle('Invalid ID');
      setResultMeta('Enter a positive workout ID.');
      setResultJson(compactJson({ error: 'Invalid workout ID' }));
      setResultStats([]);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/workouts/${id}`);
      if (!response.ok) {
        throw new Error(await response.text());
      }

      const workout = await response.json();
      showResponse('Loaded', workout);
      setHealthTone('good');
      setHealth(`Loaded workout ${workout.id} successfully.`);
    } catch (error) {
      setResultBadge('Error');
      setResultTitle('Lookup failed');
      setResultMeta(error instanceof Error ? error.message : 'Unknown error');
      setResultJson(compactJson({ error: error instanceof Error ? error.message : 'Unknown error' }));
      setResultStats([]);
      setHealthTone('bad');
      setHealth('Workout lookup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell">
      <div className="noise" />
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">femProject workout console</p>
          <h1>Track workouts with a React dashboard built on your Go API.</h1>
          <p className="lede">
            The UI stays focused on what your backend already does best: create workouts, fetch them by ID, and keep PostgreSQL as the source of truth.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="/health" target="_blank" rel="noreferrer">Check health</a>
            <a className="button button-secondary" href="#create-workout">Create workout</a>
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
        <section className="panel" id="create-workout">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Workout builder</p>
              <h2>Create a new workout</h2>
            </div>
            <p>Build a workout with one or more entries and save it straight to PostgreSQL.</p>
          </div>

          <form className="stack-form" onSubmit={handleCreateWorkout}>
            <div className="form-grid two-up">
              <label>
                <span>Title</span>
                <input name="title" type="text" placeholder="Push Day" required />
              </label>
              <label>
                <span>Duration minutes</span>
                <input name="duration_minutes" type="number" min="1" step="1" placeholder="45" required />
              </label>
            </div>

            <label>
              <span>Description</span>
              <textarea name="description" rows="3" placeholder="Chest, shoulders, and triceps focused session" />
            </label>

            <div className="form-grid two-up">
              <label>
                <span>Calories burned</span>
                <input name="calories_burned" type="number" min="0" step="1" placeholder="320" />
              </label>
              <div className="inline-note">
                <strong>Entries</strong>
                <p>Add at least one exercise. Use reps or duration_seconds for each row.</p>
              </div>
            </div>

            <div className="entries">
              {entries.map((entry, index) => (
                <div className="entry-row" key={`${index}-${entry.order_index}`}>
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
                      <span>Order</span>
                      <input value={entry.order_index} onChange={(event) => updateEntry(index, 'order_index', event.target.value)} type="number" min="1" step="1" placeholder="1" required />
                    </label>
                  </div>
                  <label>
                    <span>Notes</span>
                    <input value={entry.notes} onChange={(event) => updateEntry(index, 'notes', event.target.value)} type="text" placeholder="Keep control on the eccentric" />
                  </label>
                  <button className="entry-remove" type="button" onClick={() => removeEntry(index)}>
                    Remove entry
                  </button>
                </div>
              ))}
            </div>

            <div className="form-actions">
              <button className="button button-secondary" type="button" onClick={addEntry}>Add entry</button>
              <button className="button button-primary" type="submit" disabled={loading}>
                {loading ? 'Working...' : 'Save workout'}
              </button>
            </div>
          </form>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Workout lookup</p>
              <h2>Fetch a saved workout</h2>
            </div>
            <p>Use an ID from the save response to load the workout and its entries back from the database.</p>
          </div>

          <form className="lookup-bar" onSubmit={handleLookupWorkout}>
            <input value={lookupId} onChange={(event) => setLookupId(event.target.value)} name="workout_id" type="number" min="1" step="1" placeholder="Workout ID" required />
            <button className="button button-primary" type="submit" disabled={loading}>Load workout</button>
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
