/** @type {import('tailwindcss').Config} */

// Colors are CSS variables (defined as "R G B" triplets in src/index.css) so a
// single place controls the palette and dark mode, and Tailwind's opacity
// modifiers (bg-accent/10) still work.
const token = (name) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class', // .dark on <html>; ThemeProvider also follows the OS setting
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: token('--paper'),
          2: token('--paper-2'),
        },
        surface: token('--surface'),
        ink: {
          DEFAULT: token('--ink'),
          soft: token('--ink-soft'),
        },
        line: token('--line'),
        accent: {
          DEFAULT: token('--accent'),
          press: token('--accent-press'),
        },
        gold: token('--gold'),
        danger: token('--danger'),
      },
      fontFamily: {
        display: ['"Newsreader"', 'Georgia', '"Times New Roman"', 'serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: 'var(--r-sm)',
        DEFAULT: 'var(--r-md)',
        md: 'var(--r-md)',
        lg: '16px',
      },
      maxWidth: {
        content: '1200px',
      },
    },
  },
  plugins: [],
};
