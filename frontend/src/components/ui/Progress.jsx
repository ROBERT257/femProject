import React from 'react';
import { cn } from '../../lib/utils';

const Progress = React.forwardRef(({ 
  className, 
  value = 0,
  max = 100,
  size = 'md',
  ...props 
}, ref) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'relative w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <div
        className="h-full rounded-full bg-primary-500 transition-all duration-500 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
});

Progress.displayName = 'Progress';

export { Progress };
