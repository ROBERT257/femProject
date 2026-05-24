import type { WorkoutEntry } from '../api'
import '../styles/ExerciseEntry.css'

type Props = {
  entry: WorkoutEntry
  index: number
  onUpdate: (index: number, entry: WorkoutEntry) => void
  onRemove: (index: number) => void
}

export function ExerciseEntry({ entry, index, onUpdate, onRemove }: Props) {
  const isReps = entry.reps !== undefined && entry.reps !== null
  const isDuration = entry.duration_seconds !== undefined && entry.duration_seconds !== null

  const handleFieldChange = (field: keyof WorkoutEntry, value: string | number | null) => {
    onUpdate(index, { ...entry, [field]: value })
  }

  const handleTypeChange = (useReps: boolean) => {
    if (useReps) {
      onUpdate(index, {
        ...entry,
        reps: entry.reps || 10,
        duration_seconds: undefined
      })
    } else {
      onUpdate(index, {
        ...entry,
        duration_seconds: entry.duration_seconds || 30,
        reps: undefined
      })
    }
  }

  return (
    <div className="exercise-entry">
      <div className="exercise-header">
        <span className="exercise-number">Exercise {index + 1}</span>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="btn-remove"
        >
          Remove
        </button>
      </div>

      <div className="exercise-grid">
        <div className="form-group">
          <label htmlFor={`exercise-${index}`}>Exercise Name *</label>
          <input
            id={`exercise-${index}`}
            type="text"
            placeholder="e.g., Squat"
            value={entry.exercise}
            onChange={(e) => handleFieldChange('exercise', e.target.value)}
            className="text-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor={`sets-${index}`}>Sets *</label>
          <input
            id={`sets-${index}`}
            type="number"
            min="1"
            value={entry.sets}
            onChange={(e) => handleFieldChange('sets', parseInt(e.target.value) || 1)}
            className="number-input"
          />
        </div>

        <div className="form-group">
          <label>Reps or Duration? *</label>
          <div className="toggle-group">
            <button
              type="button"
              className={`toggle-btn ${isReps ? 'active' : ''}`}
              onClick={() => handleTypeChange(true)}
            >
              Reps
            </button>
            <button
              type="button"
              className={`toggle-btn ${isDuration ? 'active' : ''}`}
              onClick={() => handleTypeChange(false)}
            >
              Duration
            </button>
          </div>
        </div>

        {isReps && (
          <div className="form-group">
            <label htmlFor={`reps-${index}`}>Reps</label>
            <input
              id={`reps-${index}`}
              type="number"
              min="1"
              value={entry.reps || ''}
              onChange={(e) => handleFieldChange('reps', e.target.value ? parseInt(e.target.value) : undefined)}
              className="number-input"
            />
          </div>
        )}

        {isDuration && (
          <div className="form-group">
            <label htmlFor={`duration-${index}`}>Duration (sec)</label>
            <input
              id={`duration-${index}`}
              type="number"
              min="1"
              value={entry.duration_seconds || ''}
              onChange={(e) => handleFieldChange('duration_seconds', e.target.value ? parseInt(e.target.value) : undefined)}
              className="number-input"
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor={`weight-${index}`}>Weight (optional)</label>
          <input
            id={`weight-${index}`}
            type="number"
            min="0"
            step="0.5"
            placeholder="lbs"
            value={entry.weight || ''}
            onChange={(e) => handleFieldChange('weight', e.target.value ? parseFloat(e.target.value) : undefined)}
            className="number-input"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor={`notes-${index}`}>Notes</label>
        <textarea
          id={`notes-${index}`}
          placeholder="e.g., Controlled tempo, felt good"
          value={entry.notes}
          onChange={(e) => handleFieldChange('notes', e.target.value)}
          className="textarea-input"
        />
      </div>
    </div>
  )
}
