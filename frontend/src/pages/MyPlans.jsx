import React, { useEffect, useState } from 'react';
import { listRehabPlans, getRehabPlanById, updateRehabExercise } from '../lib/api';
import ExerciseRow from '../components/ExerciseRow';

export default function MyPlans({ session }) {
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [plan, setPlan] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await listRehabPlans();
        if (!active) return;
        const myPlans = (Array.isArray(response) ? response : response?.data || []).filter((p) => {
          if (session?.id && p.patient_id) {
            return Number(p.patient_id) === Number(session.id);
          }
          return p.patient_name === (session?.fullName || '');
        });
        setPlans(myPlans);
        setSelectedPlanId((cur) => cur || myPlans[0]?.id || null);
      } catch (e) {
        console.error(e);
      }
    }
    load();
    return () => { active = false; };
  }, [session]);

  useEffect(() => {
    let active = true;
    async function loadPlan() {
      if (!selectedPlanId) {
        setPlan(null);
        return;
      }
      try {
        const data = await getRehabPlanById(selectedPlanId);
        if (!active) return;
        setPlan(data);
      } catch (e) {
        console.error(e);
      }
    }
    loadPlan();
    return () => { active = false; };
  }, [selectedPlanId]);

  async function handleSaveExercise(entry) {
    try {
      await updateRehabExercise(entry.id, entry);
      setMessage('Saved');
      const refreshed = await getRehabPlanById(selectedPlanId);
      setPlan(refreshed);
      setTimeout(() => setMessage(''), 1500);
    } catch (e) {
      setMessage('Save failed');
    }
  }

  if (!session) return <p>Please log in to view your plans.</p>;

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold">My Plans</h2>
        <p className="text-sm text-neutral-600">Plans assigned to you</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <div className="space-y-3">
            {plans.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-6">No plans assigned to you.</div>
            ) : plans.map((p) => (
              <button key={p.id} className={`w-full text-left rounded-xl p-4 border ${selectedPlanId === p.id ? 'border-emerald-500 bg-emerald-50' : 'border-neutral-200 bg-white'}`} onClick={() => setSelectedPlanId(p.id)}>
                <strong>{p.title}</strong>
                <div className="text-sm text-neutral-500">{p.start_date}</div>
                <div className="text-xs text-neutral-400">{p.entry_count ?? 0} exercises</div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          {!plan ? (
            <div className="rounded-xl border p-6">Select a plan to view and update exercises.</div>
          ) : (
            <div>
              <h3 className="font-semibold text-lg mb-2">{plan.title}</h3>
              <p className="text-sm text-neutral-600 mb-4">{plan.goal}</p>

              <div className="space-y-4">
                {Array.isArray(plan.entries) && plan.entries.length > 0 ? (
                  plan.entries.map((entry) => (
                    <ExerciseRow
                      key={entry.id}
                      entry={entry}
                      onSave={(next) => handleSaveExercise(next)}
                      onChange={() => {}}
                    />
                  ))
                ) : (
                  <p>No exercises.</p>
                )}
              </div>

              <div className="mt-4 text-sm text-neutral-600">{message}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
