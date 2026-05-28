import React from 'react';
import { cn } from '../../lib/utils';

const Avatar = React.forwardRef(({ 
  className, 
  src, 
  alt = '', 
  fallback,
  size = 'md',
  ...props 
}, ref) => {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'relative inline-flex items-center justify-center rounded-full overflow-hidden',
        'bg-neutral-200 dark:bg-neutral-700',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="font-semibold text-neutral-600 dark:text-neutral-300">
          {fallback}
        </span>
      )}
    </div>
  );
});

Avatar.displayName = 'Avatar';

export { Avatar };
