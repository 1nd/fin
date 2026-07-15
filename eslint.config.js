import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist', '.claude', 'openspec'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.strict, prettierConfig],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/i18n/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-i18next',
              message:
                "Import from 'src/i18n/useTranslation' instead; only src/i18n/ may touch the library.",
            },
            {
              name: 'i18next',
              message:
                "Import the configured instance from 'src/i18n/i18n' instead; only src/i18n/ may touch the library.",
            },
          ],
        },
      ],
    },
  },
);
