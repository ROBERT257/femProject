import type { Workout } from '../api'
import '../styles/WorkoutViewer.css'

type Props = {
  workout: Workout
  onDelete: (id: number) => Promise<void>
}

export function WorkoutViewer({ workout, onDelete }: Props) {
  const handleDelete = async () => {
    if (workout.id && confirm(`Delete workout "${workout.title}"?`)) {
      await onDelete(workout.id)
    }
  }

  return (
    <div className="workout-viewer">
      <div className="workout-header">
        <div>
          <h2>{workout.title}</h2>
          {workout.description && <p className="description">{workout.description}</p>}
        </div>
        <div className="workout-meta">
          <span className="id-badge">ID: {workout.id}</span>
        </div>
      </div>

      <div className="workout-stats">
        <div className="stat">
          <span className="stat-label">Duration</span>
          <span className="stat-value">{workout.duration_minutes} min</span>
        </div>
        {workout.calories_burned && (
          <div className="stat">
            <span className="stat-label">Calories</span>
            <span className="stat-value">{workout.calories_burned}</span>
          </div>
        )}
        <div className="stat">
          <span className="stat-label">Exercises</span>
          <span className="stat-value">{workout.entries.length}</span>
        </div>
      </div>

      <div className="exercises-section">
        <h3>Exercises</h3>
        <div className="entries-list">
          {workout.entries.map((entry, idx) => (
            <div key={entry.id || idx} className="entry-card">
              <div className="entry-header">
                <h4>{entry.exercise}</h4>
                <span className="entry-order">#{entry.order_index + 1}</span>
              </div>

              <div className="entry-details">
                <div className="detail">
                  <span className="label">Sets</span>
                  <span className="value">{entry.sets}</span>
                </div>

                {entry.reps !== undefined && entry.reps !== null && (
                  <div className="detail">
                    <span className="label">Reps</span>
                    <span className="value">{entry.reps}</span>
                  </div>
                )}

                {entry.duration_seconds !== undefined && entry.duration_seconds !== null && (
                  <div className="detail">
                    <span className="label">Duration</span>
                    <span className="value">{entry.duration_seconds}s</span>
                  </div>
                )}

                {entry.weight !== undefined && entry.weight !== null && (
                  <div className="detail">
                    <span className="label">Weight</span>
                    <span className="value">{entry.weight} lbs</span>
                  </div>
                )}
              </div>

              {entry.notes && (
                <div className="entry-notes">
                  <strong>Notes:</strong> {entry.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleDelete}
        className="btn-delete"
      >
        Delete Workout
      </button>
    </div>
  )
}
