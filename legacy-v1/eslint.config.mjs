import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const config = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: ['.next/**', 'node_modules/**', 'face-service/**', 'next-env.d.ts', '.cache/**'],
  },
  {
    // Config is the only place allowed to read process.env (CLAUDE.md).
    files: ['src/**/*.{ts,tsx}', 'worker/**/*.ts'],
    ignores: ['src/core/config/**'],
    rules: {
      'no-restricted-properties': [
        'error',
        { object: 'process', property: 'env', message: 'Read config from src/core/config only.' },
      ],
    },
  },
  {
    // Navigation goes through the Next router.
    files: ['src/**/*.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "AssignmentExpression[left.object.name='window'][left.property.name='location']",
          message: 'Use the Next router for navigation.',
        },
        {
          selector: "AssignmentExpression[left.object.object.name='window'][left.object.property.name='location']",
          message: 'Use the Next router for navigation.',
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'localStorage', message: 'Selfies and tokens must never be stored in the browser.' },
        { name: 'sessionStorage', message: 'Selfies and tokens must never be stored in the browser.' },
        { name: 'indexedDB', message: 'Selfies must never be stored in the browser.' },
      ],
    },
  },
];

export default config;
