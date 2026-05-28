import React, { useState } from 'react';

export default function ExerciseRow({ entry, onChange, onSave, onDelete }) {
  const [local, setLocal] = useState(entry);

  const painValue = Math.max(0, Math.min(10, Number(local.pain_level ?? 0)));
  const painTone = painValue >= 7 ? 'danger' : painValue >= 4 ? 'warning' : 'good';

  function update(field, value) {
    const next = { ...local, [field]: value };
    setLocal(next);
    onChange && onChange(next);
  }

  return (
    <div className="entry-row">
      <div className="entry-header">
        <strong>{local.exercise || 'Untitled exercise'}</strong>
        <div className="chip-row">
          <span className={`chip ${local.completion_status || 'pending'}`}>{local.completion_status || 'pending'}</span>
          <span className={`chip ${painTone}`}>Pain: {painValue}/10</span>
        </div>
      </div>

      <label>
        <span>Completion</span>
        <select className="chip-select" value={local.completion_status || 'pending'} onChange={(e) => update('completion_status', e.target.value)}>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="skipped">Skipped</option>
        </select>
      </label>

      <label>
        <span>Pain level</span>
        <input type="number" min="0" max="10" value={local.pain_level ?? 0} onChange={(e) => update('pain_level', Number(e.target.value))} />
      </label>

      <label>
        <span>Patient notes</span>
        <input value={local.patient_notes || ''} onChange={(e) => update('patient_notes', e.target.value)} />
      </label>

      <div className="form-actions">
        <button className="button" type="button" onClick={() => onSave && onSave(local)}>Save</button>
        <button className="button button-danger" type="button" onClick={() => onDelete && onDelete(local.id)}>Delete</button>
      </div>
    </div>
  );
}
