export type WorkoutEntry = {
  id?: number
  exercise: string
  sets: number
  reps?: number | null
  duration_seconds?: number | null
  weight?: number | null
  notes: string
  order_index: number
}

export type Workout = {
  id?: number
  title: string
  description: string
  duration_minutes: number
  calories_burned?: number | null
  entries: WorkoutEntry[]
}

const API_URL = 'http://localhost:8000'

export const api = {
  async createWorkout(workout: Workout): Promise<Workout> {
    const res = await fetch(`${API_URL}/workouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workout)
    })
    if (!res.ok) throw new Error(`Failed to create workout: ${res.statusText}`)
    return res.json()
  },

  async getWorkout(id: number): Promise<Workout> {
    const res = await fetch(`${API_URL}/workouts/${id}`)
    if (!res.ok) throw new Error(`Failed to fetch workout: ${res.statusText}`)
    return res.json()
  },

  async deleteWorkout(id: number): Promise<void> {
    const res = await fetch(`${API_URL}/workouts/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(`Failed to delete workout: ${res.statusText}`)
  },

  async getHealth(): Promise<string> {
    const res = await fetch(`${API_URL}/health`)
    if (!res.ok) throw new Error('Health check failed')
    return res.text()
  }
}
