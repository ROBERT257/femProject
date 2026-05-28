import React from 'react';
import { cn } from '../../lib/utils';

const badgeVariants = {
  default: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200',
  primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
  success: 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-300',
  warning: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300',
  danger: 'bg-danger-100 text-danger-800 dark:bg-danger-900/30 dark:text-danger-300',
};

const badgeSizes = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
};

const Badge = React.forwardRef(({ 
  className, 
  variant = 'default', 
  size = 'md',
  children,
  ...props 
}, ref) => {
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full font-semibold',
        badgeVariants[variant],
        badgeSizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';

export { Badge };
