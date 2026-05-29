import Dashboard from '../../pages/Dashboard';

export default function PatientDashboard({ session, onLogout }) {
  return <Dashboard session={session} onLogout={onLogout} />;
}
