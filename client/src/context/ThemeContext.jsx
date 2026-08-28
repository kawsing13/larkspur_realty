import { createContext, useContext, useEffect, useState } from 'react';

// Theme preference: "system" follows the OS, "light" / "dark" are explicit choices.
// The choice is persisted; applying it just toggles the `dark` class on <html>,
// which flips every design token in index.css.

const ThemeContext = createContext(null);
const STORAGE_KEY = 'rems-theme';

const readStored = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'system';
  } catch {
    return 'system';
  }
};

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(readStored);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = preference === 'dark' || (preference === 'system' && media.matches);
      document.documentElement.classList.toggle('dark', dark);
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [preference]);

  const setTheme = (next) => {
    setPreference(next);
    try {
      if (next === 'system') localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // storage unavailable - the choice still applies for this session
    }
  };

  return (
    <ThemeContext.Provider value={{ preference, setTheme }}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
};
