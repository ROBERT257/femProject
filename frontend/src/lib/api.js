const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080';

function mapAccount(account) {
  if (!account) {
    return null;
  }

  return {
    id: account.id,
    role: account.role,
    fullName: account.full_name,
    email: account.email,
    loginId: account.login_id,
    regNo: account.reg_no,
    createdBy: account.created_by,
    createdByTherapistId: account.parent_therapist_id,
    patientSequence: account.patient_sequence,
    passwordResetAt: account.password_reset_at,
    createdAt: account.created_at,
    updatedAt: account.updated_at,
  };
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const message = typeof payload === 'string'
      ? payload
      : payload?.error || payload?.message || response.statusText;
    throw new Error(message || 'Request failed');
  }

  return payload;
}

export function listAccounts() {
  return request('/accounts').then((accounts) => accounts.map(mapAccount));
}

export function createTherapist(payload) {
  return request('/admin/therapists', {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((response) => ({
    ...response,
    account: mapAccount(response.account),
  }));
}

export function loginAccount(payload) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((response) => ({
    ...response,
    account: mapAccount(response.account),
  }));
}

export function resetTherapistPassword(therapistID, payload) {
  return request(`/therapists/${encodeURIComponent(therapistID)}/password-reset`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((response) => ({
    ...response,
    account: mapAccount(response.account),
  }));
}

export function createPatient(therapistID, payload) {
  return request(`/therapists/${encodeURIComponent(therapistID)}/patients`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((response) => ({
    ...response,
    account: mapAccount(response.account),
  }));
}

export function listPatientsByTherapist(therapistID) {
  return request(`/therapists/${encodeURIComponent(therapistID)}/patients`).then((accounts) => accounts.map(mapAccount));
}

export function listRehabPlans() {
  return request('/rehab-plans');
}

export function getRehabPlanById(planId) {
  return request(`/rehab-plans/${encodeURIComponent(planId)}`);
}

export function updateRehabPlan(planId, payload) {
  return request(`/rehab-plans/${encodeURIComponent(planId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteRehabPlan(planId) {
  return request(`/rehab-plans/${encodeURIComponent(planId)}`, {
    method: 'DELETE',
  });
}

export function updateRehabExercise(entryId, payload) {
  return request(`/rehab-exercises/${encodeURIComponent(entryId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteRehabExercise(entryId) {
  return request(`/rehab-exercises/${encodeURIComponent(entryId)}`, {
    method: 'DELETE',
  });
}
