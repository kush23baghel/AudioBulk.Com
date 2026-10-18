import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'tailwind.config.js', 'scratch', 'playwright-report', 'test-results']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    // Node-side files: tests, build/dev scripts and config all run outside the browser.
    files: [
      'tests/**/*.{js,mjs,cjs}',
      'scripts/**/*.{js,mjs,cjs}',
      '*.config.js',
      '*.{mjs,cjs}',
    ],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
])
