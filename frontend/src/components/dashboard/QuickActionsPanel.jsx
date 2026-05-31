import React from 'react';
import { BellRing, CheckCheck, Sparkles, SquarePen, PlusCircle, Send } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

const actionStyle = 'w-full justify-start rounded-2xl px-4 py-3 text-left';

export default function QuickActionsPanel({
  onMarkReviewed,
  onEditProgram,
  onSendReminder,
  onAddExercise,
  onGenerateAI,
  className = '',
}) {
  return (
    <Card className={`sticky top-24 overflow-hidden border-neutral-200/80 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-neutral-800 dark:bg-neutral-950/90 ${className}`}>
      <CardHeader className="border-b border-neutral-100 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-900/60">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/50 dark:text-blue-300">
          <Sparkles className="h-3.5 w-3.5" />
          Quick actions
        </div>
        <CardTitle className="text-2xl text-neutral-950 dark:text-white">Workflow shortcuts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-5">
        <Button type="button" variant="outline" className={actionStyle} onClick={onMarkReviewed}>
          <CheckCheck className="mr-3 h-4 w-4" />
          Mark Reviewed
        </Button>
        <Button type="button" variant="outline" className={actionStyle} onClick={onEditProgram}>
          <SquarePen className="mr-3 h-4 w-4" />
          Edit Program
        </Button>
        <Button type="button" variant="outline" className={actionStyle} onClick={onSendReminder}>
          <Send className="mr-3 h-4 w-4" />
          Send Reminder
        </Button>
        <Button type="button" variant="outline" className={actionStyle} onClick={onAddExercise}>
          <PlusCircle className="mr-3 h-4 w-4" />
          Add Exercise
        </Button>
        <Button type="button" className={actionStyle} onClick={onGenerateAI}>
          <Sparkles className="mr-3 h-4 w-4" />
          Generate AI Suggestions
        </Button>

        <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/70">
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">Always visible</p>
          <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
            Keep the most common clinical actions one click away while reviewing the patient summary.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
