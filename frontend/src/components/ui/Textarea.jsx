import React from 'react';
import { cn } from '../../lib/utils';

const Textarea = React.forwardRef(({ 
  className, 
  error,
  label,
  ...props 
}, ref) => {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={cn(
          'flex min-h-[120px] w-full rounded-xl border-2 px-4 py-3 text-base',
          'transition-all duration-200 resize-none',
          'placeholder:text-neutral-400',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'dark:bg-dark-surface dark:border-dark-border dark:text-dark-text dark:placeholder:text-dark-muted',
          error
            ? 'border-danger-500 focus:ring-danger-500'
            : 'border-neutral-200 focus:border-primary-500',
          className
        )}
        {...props}
      />
      {error && (
        <span className="text-sm text-danger-500">{error}</span>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export { Textarea };
