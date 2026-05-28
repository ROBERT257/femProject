import React from 'react';
import { cn } from '../../lib/utils';

const Skeleton = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-800',
        className
      )}
      {...props}
    />
  );
});

Skeleton.displayName = 'Skeleton';

export { Skeleton };
