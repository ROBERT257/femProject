import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from './Card';
import { cn } from '../../lib/utils';

const MetricCard = React.forwardRef(({ 
  className,
  title,
  value,
  change,
  icon: Icon,
  trend = 'neutral',
  ...props
}, ref) => {
  const trendColors = {
    positive: 'text-success-600',
    negative: 'text-danger-600',
    neutral: 'text-neutral-600',
  };

  const trendIcons = {
    positive: '↑',
    negative: '↓',
    neutral: '→',
  };

  return (
    <Card ref={ref} className={cn('overflow-hidden', className)} {...props}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              {title}
            </p>
            <h3 className="text-3xl font-bold font-heading text-neutral-900 dark:text-dark-text mb-2">
              {value}
            </h3>
            {change && (
              <p className={cn('text-sm font-medium', trendColors[trend])}>
                {trendIcons[trend]} {change}
              </p>
            )}
          </div>
          {Icon && (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
              <Icon className="h-6 w-6" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

MetricCard.displayName = 'MetricCard';

export { MetricCard };
