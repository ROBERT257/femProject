import React from 'react';
import { Brain, Info, AlertTriangle, Sparkles } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

export default function AIInsightsPanel({ insights = [], className = '' }) {
  if (!insights || insights.length === 0) {
    return null;
  }

  return (
    <Card className={`overflow-hidden border-neutral-200/80 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-neutral-800 dark:bg-neutral-950/90 ${className}`}>
      <CardHeader className="border-b border-neutral-100 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-900/60">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/50 dark:text-violet-300">
          <Brain className="h-3.5 w-3.5" />
          AI insights
        </div>
        <CardTitle className="text-2xl text-neutral-950 dark:text-white">Recovery guidance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-5">
        {insights.map((insight, index) => {
          const tone = insight.tone || 'info';
          const icon = tone === 'warning' ? AlertTriangle : tone === 'success' ? Sparkles : Info;
          const variant = tone === 'warning' ? 'warning' : tone === 'success' ? 'success' : 'primary';
          const Icon = icon;

          return (
            <div key={`${insight.title || 'insight'}-${index}`} className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/70">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                    <p className="text-sm font-semibold text-neutral-950 dark:text-white">{insight.title || 'Insight'}</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">{insight.body || insight.message}</p>
                </div>
                <Badge variant={variant} size="sm">{tone}</Badge>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
