import AIChat from '../components/AIChat';

export default function RehabAssistant({ userId = 1, onResponse }) {
  return <AIChat userId={userId} onResponse={onResponse} />;
}
