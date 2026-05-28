import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const Card = React.forwardRef(({ className, children, ...props }, ref) => (
  <motion.div
    ref={ref}
    className={cn(
      'rounded-2xl bg-white border border-neutral-200 shadow-md',
      'dark:bg-dark-surface dark:border-dark-border',
      className
    )}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    {...props}
  >
    {children}
  </motion.div>
));

const CardHeader = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  >
    {children}
  </div>
));

const CardTitle = React.forwardRef(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'font-heading text-2xl font-bold leading-none tracking-tight',
      'dark:text-dark-text',
      className
    )}
    {...props}
  >
    {children}
  </h3>
));

const CardDescription = React.forwardRef(({ className, children, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-neutral-600 dark:text-dark-muted', className)}
    {...props}
  >
    {children}
  </p>
));

const CardContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props}>
    {children}
  </div>
));

const CardFooter = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  >
    {children}
  </div>
));

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
