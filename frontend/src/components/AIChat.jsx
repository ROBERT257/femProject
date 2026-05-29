import { useMemo, useState } from 'react';
import { Bot, SendHorizonal, AlertTriangle } from 'lucide-react';
import { useAI } from '../hooks/useAI';

export default function AIChat({ userId = 1, onResponse }) {
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);
  const { loading, error, askAI } = useAI(userId);

  const canSend = useMemo(() => message.trim().length > 0 && !loading, [message, loading]);

  const handleSend = async () => {
    if (!canSend) {
      return;
    }

    const userMessage = message.trim();
    setMessage('');
    setHistory((prev) => [...prev, { type: 'user', text: userMessage, ts: Date.now() }]);

    const payload = await askAI(userMessage);
    if (!payload) {
      return;
    }

    setHistory((prev) => [
      ...prev,
      {
        type: 'assistant',
        text: payload.response,
        recommendations: payload.recommendations || [],
        riskLevel: payload.risk_level || 'low',
        ts: Date.now(),
      },
    ]);

    if (onResponse) {
      onResponse(payload);
    }
  };

  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-heading text-lg font-semibold text-neutral-900 dark:text-white">AI Rehab Assistant</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Ask about pain, fatigue, and workout adjustments.</p>
        </div>
      </div>

      <div className="mb-4 max-h-72 space-y-3 overflow-y-auto rounded-2xl bg-neutral-50 p-3 dark:bg-neutral-800/70">
        {history.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">No messages yet. Ask the assistant for rehab guidance.</p>
        ) : (
          history.map((item) => (
            <article
              key={item.ts + item.type}
              className={
                item.type === 'user'
                  ? 'ml-auto w-[90%] rounded-2xl bg-emerald-600 px-4 py-3 text-sm text-white'
                  : 'w-[95%] rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100'
              }
            >
              <p>{item.text}</p>
              {item.type === 'assistant' && item.recommendations?.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-neutral-600 dark:text-neutral-300">
                  {item.recommendations.map((rec) => (
                    <li key={rec}>{rec}</li>
                  ))}
                </ul>
              )}
              {item.type === 'assistant' && item.riskLevel && (
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                  Risk: {item.riskLevel}
                </p>
              )}
            </article>
          ))
        )}
        {loading && <p className="text-sm text-neutral-500 dark:text-neutral-400">Thinking...</p>}
      </div>

      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              handleSend();
            }
          }}
          placeholder="My shoulder hurts during overhead press..."
          className="flex-1 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <SendHorizonal className="h-4 w-4" />
          Ask AI
        </button>
      </div>
    </section>
  );
}
