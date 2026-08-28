import { Sun, Moon, Desktop } from '@phosphor-icons/react';
import { useTheme } from '../../context/ThemeContext.jsx';

const OPTIONS = [
  { value: 'light', label: 'Light theme', icon: Sun },
  { value: 'dark', label: 'Dark theme', icon: Moon },
  { value: 'system', label: 'Match system theme', icon: Desktop },
];

export function ThemeToggle() {
  const { preference, setTheme } = useTheme();
  return (
    <div className="inline-flex rounded-sm border border-line p-0.5">
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          aria-pressed={preference === value}
          aria-label={label}
          className={`grid h-7 w-7 place-items-center rounded-[3px] ${
            preference === value ? 'bg-accent/10 text-accent' : 'text-ink-soft hover:text-ink'
          }`}
        >
          <Icon size={15} />
        </button>
      ))}
    </div>
  );
}
