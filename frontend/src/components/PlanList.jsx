import React, { useMemo, useState } from 'react';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'high-pain', label: 'High pain cases' },
];

export default function PlanList({ plans, onFetchPlans, onSelect, selectedPlanId }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const filteredPlans = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return plans.filter((plan) => {
      const matchesQuery = !normalized || [plan.title, plan.patient_name, plan.therapist_name, plan.goal]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized));

      const averagePain = Number(plan.average_pain || 0);
      const matchesFilter =
        filter === 'all'
          || (filter === 'active' && plan.status === 'active')
          || (filter === 'completed' && plan.status === 'completed')
          || (filter === 'high-pain' && averagePain >= 6);

      return matchesQuery && matchesFilter;
    });
  }, [plans, query, filter]);

  return (
    <section className="panel plan-library-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Plans Library</p>
          <h2>Rehabilitation plans overview</h2>
        </div>
        <p>Search, filter, and jump between saved rehabilitation plans.</p>
      </div>

      <div className="library-controls">
        <label className="library-search">
          <span>Search</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Search patient, therapist, or plan" />
        </label>

        <div className="library-filter-row" role="tablist" aria-label="Plan filters">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`library-filter ${filter === item.id ? 'active' : ''}`}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="library-actions">
          <button className="button button-secondary" type="button" onClick={onFetchPlans}>Load plans</button>
          <button className="button" type="button" onClick={() => onSelect(null)}>Clear selection</button>
        </div>
      </div>

      <div className="plans-list">
        {filteredPlans.length === 0 && <p>No matching plans. Try another search or filter.</p>}
        {filteredPlans.map((plan) => (
          <article
            key={plan.id}
            className={`plan-card ${selectedPlanId === plan.id ? 'selected' : ''}`}
            onClick={() => onSelect(plan.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelect(plan.id);
              }
            }}
          >
            <header>
              <strong>{plan.title || `Plan ${plan.id}`}</strong>
              <span className={`chip ${plan.status || 'active'}`}>{plan.status || 'active'}</span>
            </header>
            <p>{plan.patient_name || 'Unknown patient'} — {plan.therapist_name || 'No therapist'}</p>
            <div className="plan-card-meta">
              <small>{plan.start_date || ''}</small>
              <span className="count-badge">{`${plan.title || 'Plan'} (${plan.entry_count ?? 0})`}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
