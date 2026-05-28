import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../lib/utils';

const ThemeToggle = ({ className }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      className={cn(
        'relative inline-flex h-10 w-10 items-center justify-center rounded-xl',
        'bg-neutral-200 dark:bg-neutral-800',
        'text-neutral-700 dark:text-neutral-300',
        'transition-colors hover:bg-neutral-300 dark:hover:bg-neutral-700',
        'focus:outline-none focus:ring-2 focus:ring-primary-500',
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        initial={false}
        animate={{
          rotate: theme === 'dark' ? 180 : 0,
          scale: theme === 'dark' ? 0 : 1,
        }}
        transition={{ duration: 0.2 }}
        className="absolute"
      >
        <Sun className="h-5 w-5" />
      </motion.div>
      <motion.div
        initial={false}
        animate={{
          rotate: theme === 'dark' ? 0 : -180,
          scale: theme === 'dark' ? 1 : 0,
        }}
        transition={{ duration: 0.2 }}
        className="absolute"
      >
        <Moon className="h-5 w-5" />
      </motion.div>
    </motion.button>
  );
};

export default ThemeToggle;
