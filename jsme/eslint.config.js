import js from '@eslint/js';

// Globals the editor actually uses; listed here rather than pulled from the
// `globals` package, so the config has no dependency beyond eslint itself.
const BROWSER_GLOBALS = {
  window: 'readonly',
  document: 'readonly',
  navigator: 'readonly',
  console: 'readonly',
  fetch: 'readonly',
  Image: 'readonly',
  Blob: 'readonly',
  URL: 'readonly',
  FileReader: 'readonly',
  ResizeObserver: 'readonly',
  HTMLElement: 'readonly',
  KeyboardEvent: 'readonly',
  getComputedStyle: 'readonly',
  requestAnimationFrame: 'readonly',
  cancelAnimationFrame: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  queueMicrotask: 'readonly',
  btoa: 'readonly',
  atob: 'readonly',
  alert: 'readonly',
  confirm: 'readonly',
};

export default [
  // Vue's build is vendored verbatim; it is not ours to lint.
  { ignores: ['src/vendor/**'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: BROWSER_GLOBALS,
    },
    rules: {
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    // The tests run under Node and stub the browser globals themselves.
    files: ['test/**/*.mjs'],
    languageOptions: {
      globals: { ...BROWSER_GLOBALS, globalThis: 'readonly', process: 'readonly' },
    },
  },
];
