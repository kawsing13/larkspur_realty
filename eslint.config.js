// Shared ESLint config for both workspaces. Intentionally light: it catches real
// mistakes (undeclared variables, unreachable code, missing hook deps) without
// turning into a style argument. Formatting is left to the editor.

import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      'client/dist/**',
      'server/prisma/migrations/**',
    ],
  },
  js.configs.recommended,
  {
    // Backend: Node, ES modules
    files: ['server/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    // Frontend: browser, JSX
    files: ['client/**/*.{js,jsx}'],
    plugins: { react },
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      // Teaches no-unused-vars that a component referenced only in JSX is used.
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'off', // not needed with the modern JSX transform
      'no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_|^[A-Z]', varsIgnorePattern: '^[A-Z_]' },
      ],
    },
  },
];
