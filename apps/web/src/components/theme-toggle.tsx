'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch by only rendering after mount
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  if (!mounted) {
    // Return a placeholder with same dimensions to avoid layout shift
    return (
      <button
        className="nav-item w-full opacity-50"
        disabled
        aria-label="Toggle theme"
      >
        <div className="h-5 w-5" />
        <span className="font-medium">Theme</span>
      </button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="nav-item w-full group hover:bg-[hsl(var(--gold))]/20 hover:text-[hsl(var(--gold))]"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="relative h-5 w-5">
        {/* Sun icon */}
        <Sun
          className={`
            absolute inset-0 h-5 w-5
            transition-all duration-300 ease-in-out
            ${isDark
              ? 'rotate-0 scale-100 opacity-100'
              : 'rotate-90 scale-0 opacity-0'
            }
            group-hover:text-[hsl(var(--gold))]
          `}
        />
        {/* Moon icon */}
        <Moon
          className={`
            absolute inset-0 h-5 w-5
            transition-all duration-300 ease-in-out
            ${isDark
              ? '-rotate-90 scale-0 opacity-0'
              : 'rotate-0 scale-100 opacity-100'
            }
            group-hover:text-[hsl(var(--gold))]
          `}
        />
      </div>
      <span className="font-medium transition-colors duration-200">
        {isDark ? 'Light Mode' : 'Dark Mode'}
      </span>
    </button>
  );
}
