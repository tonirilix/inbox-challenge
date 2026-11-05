import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const web = 'packages/web/src';
/** Add each new feature folder here so it gets the same boundary rules. */
const features = ['inbox'];

/** Builds a no-restricted-imports rule that bans the given path globs. */
const forbid = (group, message) => ({
  'no-restricted-imports': ['error', { patterns: [{ group, message }] }],
});

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
  {
    files: [`${web}/**/*.{ts,tsx}`],
    ...jsxA11y.flatConfigs.recommended,
    plugins: { ...jsxA11y.flatConfigs.recommended.plugins, 'react-hooks': reactHooks },
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
    },
  },
  // Import boundaries: features -> shared only; shared never -> features;
  // features never -> each other.
  {
    files: [`${web}/shared/**/*.{ts,tsx}`],
    rules: forbid(
      ['@/features/*', '**/features/**'],
      'shared must not import from features.',
    ),
  },
  ...features.map((feature) => ({
    files: [`${web}/features/${feature}/**/*.{ts,tsx}`],
    rules: forbid(
      [
        ...features.filter((f) => f !== feature).flatMap((f) => [`@/features/${f}`, `@/features/${f}/**`]),
        '@/app/**',
      ],
      'A feature must not import from other features or from the app layer.',
    ),
  })),
);
