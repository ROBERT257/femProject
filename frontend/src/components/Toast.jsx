import React from 'react';

export default function Toasts({ toasts, onRemove }) {
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type || 'info'}`}> 
          <div className="toast-body">{t.message}</div>
          <button className="toast-close" onClick={() => onRemove && onRemove(t.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}
