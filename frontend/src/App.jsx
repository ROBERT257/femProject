import { useEffect, useState } from 'react';
import RoleSelectionScreen from './components/auth/RoleSelectionScreen';
import LoginScreen from './components/auth/LoginScreen';
import AdminScreen from './components/auth/AdminScreen';
import PatientDashboard from './components/dashboard/PatientDashboard';
import TherapistDashboard from './components/dashboard/TherapistDashboard';
import { ToastContainer } from './components/ui/Toast';
import {
  createPatient,
  createTherapist,
  listAccounts,
  loginAccount,
  resetTherapistPassword,
} from './lib/api';

const STORAGE_KEYS = {
  accounts: 'rehabtrack-accounts',
  session: 'rehabtrack-session',
};

function readStorage(key, fallback) {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function App() {
  const [screen, setScreen] = useState(() => {
    const existingSession = readStorage(STORAGE_KEYS.session, null);
    return existingSession?.role ?? 'role';
  });
  const [selectedRole, setSelectedRole] = useState('patient');
  const [accounts, setAccounts] = useState(() => readStorage(STORAGE_KEYS.accounts, []));
  const [session, setSession] = useState(() => readStorage(STORAGE_KEYS.session, null));
  const [notice, setNotice] = useState({ type: 'info', text: 'Select a role to continue.' });
  const [loginForm, setLoginForm] = useState({ regNo: '', password: '' });
  const [toasts, setToasts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.accounts, accounts);
  }, [accounts]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.session, session);
  }, [session]);

  useEffect(() => {
    let active = true;

    listAccounts()
      .then((serverAccounts) => {
        if (!active) {
          return;
        }

        setAccounts(serverAccounts);
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        setNotice({ type: 'warning', text: error.message || 'Backend account data is unavailable.' });
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (session?.role) {
      setScreen(session.role);
    }
  }, [session]);

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  function openLogin(role) {
    setSelectedRole(role);
    setLoginForm({ regNo: '', password: '' });
    setNotice({
      type: 'info',
      text: role === 'therapist'
        ? 'Log in with the therapist credentials sent to your email.'
        : role === 'admin'
        ? 'Log in with the administrator credentials issued by the backend.'
        : 'Log in with the patient registration number and password sent by your therapist.',
    });
    setScreen('login');
  }

  async function handleLogin(event) {
    event.preventDefault();
    setIsLoading(true);
    try {
      const response = await loginAccount({
        role: selectedRole,
        login_id: loginForm.regNo.trim(),
        password: loginForm.password,
      });

      const account = response.account;
      setSession(account);
      setNotice({ type: 'success', text: `Welcome back, ${account.fullName}.` });
      showToast(`Welcome back, ${account.fullName}`, 'success');
      setScreen(account.role);
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'No matching account was found for that ID and password.' });
      showToast(error.message || 'No matching account found', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateTherapist(therapistForm) {
    try {
      const response = await createTherapist({
        full_name: therapistForm.fullName,
        email: therapistForm.email,
      });

      const account = response.account;
      setAccounts((currentAccounts) => [account, ...currentAccounts.filter((entry) => entry.id !== account.id)]);
      setNotice({
        type: 'success',
        text: `Therapist account created. Credentials were sent to ${account.email}.`,
      });
      showToast(`Therapist ${account.fullName} created. Credentials emailed to ${account.email}.`, 'success');
      return { ok: true, account };
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to create therapist account.' };
    }
  }

  async function handleResetTherapistPassword(resetForm) {
    try {
      const response = await resetTherapistPassword(resetForm.therapistId.trim(), {
        email: resetForm.email,
      });

      const account = response.account;
      setAccounts((currentAccounts) => currentAccounts.map((entry) => (entry.id === account.id ? account : entry)));
      setNotice({
        type: 'success',
        text: `A new reset email has been sent to ${account.email}.`,
      });
      showToast(`Password reset email sent to ${account.email}`, 'success');
      return { ok: true, account };
    } catch (error) {
      return { ok: false, message: error.message || 'No therapist account matched that ID and email.' };
    }
  }

  async function handleCreatePatient(patientForm, therapistAccount) {
    try {
      const response = await createPatient(therapistAccount.loginId || therapistAccount.regNo, {
        full_name: patientForm.fullName,
        email: patientForm.email,
      });

      const account = response.account;
      setAccounts((currentAccounts) => [account, ...currentAccounts.filter((entry) => entry.id !== account.id)]);
      setNotice({
        type: 'success',
        text: `Patient created. Registration details were sent to the therapist.`,
      });
      showToast(`Patient ${account.fullName} created with reg no ${account.regNo}`, 'success');
      return { ok: true, account };
    } catch (error) {
      return { ok: false, message: error.message || 'You need a therapist account to create patients.' };
    }
  }

  function handleLogout() {
    setSession(null);
    setScreen('role');
    setSelectedRole('patient');
    setLoginForm({ regNo: '', password: '' });
    setNotice({ type: 'info', text: 'Select a role to continue.' });
    showToast('Logged out successfully', 'info');
  }

  // Render the appropriate screen based on current state
  if (screen === 'role') {
    return (
      <>
        <RoleSelectionScreen onRoleSelect={openLogin} />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  if (screen === 'login') {
    return (
      <>
        <LoginScreen
          selectedRole={selectedRole}
          onRoleChange={setSelectedRole}
          onLogin={handleLogin}
          onBackToRoles={() => setScreen('role')}
          onResetTherapistPassword={handleResetTherapistPassword}
          loginForm={loginForm}
          onLoginFormChange={(field, value) => setLoginForm((prev) => ({ ...prev, [field]: value }))}
          notice={notice}
          isLoading={isLoading}
        />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  if (screen === 'admin') {
    return (
      <>
        <AdminScreen
          accounts={accounts}
          onCreateTherapist={handleCreateTherapist}
          onBackToRoles={() => setScreen('role')}
          notice={notice}
        />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  if (screen === 'therapist') {
    return (
      <>
        <TherapistDashboard
          session={session}
          accounts={accounts}
          onCreatePatient={handleCreatePatient}
          onLogout={handleLogout}
        />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  if (screen === 'patient') {
    return (
      <>
        <PatientDashboard session={session} onLogout={handleLogout} />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  return (
    <>
      <RoleSelectionScreen onRoleSelect={openLogin} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}

export default App;
