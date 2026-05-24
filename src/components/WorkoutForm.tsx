import { useState } from 'react'
import { api } from '../api'
import type { Workout, WorkoutEntry } from '../api'
import { ExerciseEntry } from './ExerciseEntry'
import '../styles/WorkoutForm.css'

type Props = {
  onSuccess: (workout: Workout) => void
}

const defaultEntry: WorkoutEntry = {
  exercise: '',
  sets: 1,
  reps: undefined,
  duration_seconds: undefined,
  weight: undefined,
  notes: '',
  order_index: 0
}

export function WorkoutForm({ onSuccess }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('60')
  const [caloriesBurned, setCaloriesBurned] = useState('300')
  const [entries, setEntries] = useState<WorkoutEntry[]>([
    { ...defaultEntry, order_index: 0 }
  ])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAddEntry = () => {
    const newEntry = {
      ...defaultEntry,
      order_index: entries.length
    }
    setEntries([...entries, newEntry])
  }

  const handleUpdateEntry = (index: number, entry: WorkoutEntry) => {
    const updated = [...entries]
    updated[index] = { ...entry, order_index: index }
    setEntries(updated)
  }

  const handleRemoveEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Title is required')
      return
    }

    if (entries.length === 0) {
      setError('Add at least one exercise')
      return
    }

    for (const entry of entries) {
      if (!entry.exercise.trim()) {
        setError('All exercises must have a name')
        return
      }
      if (entry.reps === undefined && entry.duration_seconds === undefined) {
        setError('Each exercise must have either reps or duration')
        return
      }
    }

    const workout: Workout = {
      title: title.trim(),
      description: description.trim(),
      duration_minutes: parseInt(durationMinutes) || 0,
      calories_burned: caloriesBurned ? parseInt(caloriesBurned) : undefined,
      entries
    }

    try {
      setLoading(true)
      const created = await api.createWorkout(workout)
      setTitle('')
      setDescription('')
      setDurationMinutes('60')
      setCaloriesBurned('300')
      setEntries([{ ...defaultEntry, order_index: 0 }])
      onSuccess(created)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="workout-form" onSubmit={handleSubmit}>
      <div className="form-section">
        <h2>Workout Details</h2>

        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            id="title"
            type="text"
            placeholder="e.g., Full Body Strength"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            placeholder="Optional description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="textarea-input"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="duration">Duration (min) *</label>
            <input
              id="duration"
              type="number"
              min="1"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              className="number-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="calories">Calories Burned</label>
            <input
              id="calories"
              type="number"
              min="0"
              value={caloriesBurned}
              onChange={(e) => setCaloriesBurned(e.target.value)}
              className="number-input"
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h2>Exercises</h2>

        <div className="exercises-list">
          {entries.map((entry, index) => (
            <ExerciseEntry
              key={index}
              entry={entry}
              index={index}
              onUpdate={handleUpdateEntry}
              onRemove={handleRemoveEntry}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddEntry}
          className="btn-secondary"
        >
          + Add Exercise
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary"
      >
        {loading ? 'Creating...' : 'Create Workout'}
      </button>
    </form>
  )
}
