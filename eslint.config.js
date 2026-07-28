import js from '@eslint/js';
import globals from 'globals';

// Configuration plate (ESLint 9). Objectif : un filet minimal qui attrape les
// vraies fautes (variables non définies, code mort) sans imposer un style
// tatillon sur une base déjà cohérente.
export default [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
    },
  },
  {
    // Les tests tournent sous Vitest (globals describe/it/expect via config).
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
];
