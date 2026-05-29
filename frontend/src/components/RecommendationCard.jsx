export default function RecommendationCard({ recommendations = [] }) {
  return (
    <article className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
      <h3 className="mb-4 font-heading text-lg font-semibold text-neutral-900 dark:text-white">Smart Recommendations</h3>
      {recommendations.length === 0 ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Ask AI or generate recommendations to populate this panel.</p>
      ) : (
        <ul className="space-y-2 text-sm text-neutral-700 dark:text-neutral-200">
          {recommendations.map((item) => (
            <li key={item} className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800">
              {item}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
