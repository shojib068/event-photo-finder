import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'legacy-v1', 'public', '.wrangler'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.mjs'],
    languageOptions: { globals: { console: 'readonly', process: 'readonly' } },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Features never import from each other: only via shared/ or core/.
      'no-restricted-imports': ['error', { patterns: [{ group: ['**/features/*/*'], message: 'Import a feature only through its index.ts.' }] }],
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}', 'src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': ['error', { selector: "MemberExpression[object.name='process'][property.name='env']", message: 'Read configuration from src/core/config only.' }],
    },
  },
);
