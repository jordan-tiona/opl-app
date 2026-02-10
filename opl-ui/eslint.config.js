import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import { fixupPluginRules } from '@eslint/compat'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import importPlugin from 'eslint-plugin-import'
import prettierConfig from 'eslint-config-prettier'

export default tseslint.config(
// Ignore patterns
  {
    ignores: [
      'node_modules/**',
      'build/**',
      '.react-router/**',
      'dist/**',
      '*.config.js',
      '*.config.ts',
    ],
  },

  // Base ESLint recommended rules
  js.configs.recommended,

  // TypeScript configuration
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
          allowDirectConstAssertionInArrowFunctions: true,
        },
      ],
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
    },
  },

  // React configuration
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      react: fixupPluginRules(react),
      'react-hooks': fixupPluginRules(reactHooks),
      'jsx-a11y': fixupPluginRules(jsxA11y),
      import: fixupPluginRules(importPlugin),
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },
    rules: {
      // React rules
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-uses-vars': 'error',

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Accessibility rules (selected important ones)
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/anchor-has-content': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/aria-props': 'warn',
      'jsx-a11y/aria-unsupported-elements': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'warn',
      'jsx-a11y/role-supports-aria-props': 'warn',

      // Import rules
      'import/order': [
        'warn',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'import/no-duplicates': 'warn',
      'import/no-unresolved': 'off', // TypeScript handles this

      // Code quality rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      curly: ['warn', 'all'],
      'comma-dangle': ['warn', 'always-multiline'],
      semi: ['warn', 'never'],
      'eol-last': ['warn', 'always'],
      'space-in-parens': ['warn', 'always'],
      'padding-line-between-statements': [
        'warn',
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
        { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
        { blankLine: 'always', prev: 'directive', next: '*' },
        { blankLine: 'any', prev: 'directive', next: 'directive' },
        { blankLine: 'always', prev: '*', next: 'if' },
        { blankLine: 'always', prev: 'if', next: '*' },
        { blankLine: 'always', prev: '*', next: 'function' },
        { blankLine: 'always', prev: 'function', next: '*' },
      ],
    },
  },

  // Prettier config - disables ESLint rules that conflict with Prettier
  // Must be last to override other configs
  prettierConfig,
)
