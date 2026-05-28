import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

const Select = React.forwardRef(({ 
  className, 
  children,
  label,
  error,
  ...props 
}, ref) => {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            'flex h-12 w-full appearance-none rounded-xl border-2 px-4 py-3 pr-10 text-base',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'dark:bg-dark-surface dark:border-dark-border dark:text-dark-text',
            error
              ? 'border-danger-500 focus:ring-danger-500'
              : 'border-neutral-200 focus:border-primary-500',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 pointer-events-none" />
      </div>
      {error && (
        <span className="text-sm text-danger-500">{error}</span>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export { Select };
