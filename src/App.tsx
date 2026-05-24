import { useState } from 'react'
import { WorkoutForm } from './components/WorkoutForm'
import { WorkoutViewer } from './components/WorkoutViewer'
import { api } from './api'
import type { Workout } from './api'
import './App.css'

type Page = 'list' | 'create' | 'view'

export function App() {
  const [page, setPage] = useState<Page>('create')
  const [viewingWorkout, setViewingWorkout] = useState<Workout | null>(null)
  const [workoutId, setWorkoutId] = useState('')
  const [message, setMessage] = useState('')

  const handleWorkoutCreated = (workout: Workout) => {
    setMessage(`Workout created! ID: ${workout.id}`)
    setWorkoutId(workout.id?.toString() || '')
    setPage('view')
    setTimeout(() => setMessage(''), 3000)
  }

  const handleLoadWorkout = async () => {
    if (!workoutId.trim()) {
      setMessage('Please enter a workout ID')
      return
    }
    try {
      const workout = await api.getWorkout(parseInt(workoutId))
      setViewingWorkout(workout)
      setPage('view')
      setMessage('')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to load workout')
    }
  }

  const handleDeleteWorkout = async (id: number) => {
    try {
      await api.deleteWorkout(id)
      setMessage(`Workout ${id} deleted`)
      setPage('create')
      setViewingWorkout(null)
      setWorkoutId('')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to delete workout')
    }
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Workout Tracker</h1>
        {message && <div className="message">{message}</div>}
      </header>

      <nav className="app-nav">
        <button
          className={`nav-btn ${page === 'create' ? 'active' : ''}`}
          onClick={() => setPage('create')}
        >
          Create Workout
        </button>
        <button
          className={`nav-btn ${page === 'list' ? 'active' : ''}`}
          onClick={() => setPage('list')}
        >
          Load Workout
        </button>
      </nav>

      <main className="app-main">
        {page === 'create' && (
          <WorkoutForm onSuccess={handleWorkoutCreated} />
        )}

        {page === 'list' && (
          <div className="load-workout-section">
            <div className="input-group">
              <input
                type="number"
                placeholder="Enter workout ID"
                value={workoutId}
                onChange={(e) => setWorkoutId(e.target.value)}
                className="id-input"
              />
              <button onClick={handleLoadWorkout} className="load-btn">
                Load Workout
              </button>
            </div>
            {viewingWorkout && (
              <WorkoutViewer
                workout={viewingWorkout}
                onDelete={handleDeleteWorkout}
              />
            )}
          </div>
        )}

        {page === 'view' && viewingWorkout && (
          <WorkoutViewer
            workout={viewingWorkout}
            onDelete={handleDeleteWorkout}
          />
        )}
      </main>
    </div>
  )
}
