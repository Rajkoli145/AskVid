import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex items-center justify-center w-12 h-6 bg-slate-200 dark:bg-slate-700 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <span
        className={`absolute left-1 inline-flex items-center justify-center w-4 h-4 bg-white dark:bg-slate-900 rounded-full shadow-lg transform transition-transform duration-300 ${
          theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
        }`}
      >
        {theme === 'light' ? (
          <Sun className="w-2.5 h-2.5 text-yellow-500" />
        ) : (
          <Moon className="w-2.5 h-2.5 text-blue-400" />
        )}
      </span>
    </button>
  );
};

export default ThemeToggle;