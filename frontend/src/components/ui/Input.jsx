import React, { useId } from 'react';
import { cn } from '../../lib/utils';

const Input = React.forwardRef(({ 
  className, 
  type = 'text', 
  error,
  label,
  id,
  ...props 
}, ref) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={inputId} className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        ref={ref}
        className={cn(
          'flex h-12 w-full rounded-xl border-2 px-4 py-3 text-base',
          'transition-all duration-200',
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

Input.displayName = 'Input';

export { Input };
