
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <button
      aria-label="Toggle Dark Mode"
      onClick={toggleDarkMode}
      className={`
        transition-colors rounded-full p-2
        bg-gray-200 dark:bg-gray-700
        text-gray-700 dark:text-yellow-300
        hover:bg-blue-100 dark:hover:bg-gray-600
        shadow
        focus:outline-none
      `}
      style={{ position: 'relative' }}
    >
      {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
    </button>
  );
}
