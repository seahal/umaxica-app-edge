import { defineConfig } from 'vite-plus';

export default defineConfig({
  staged: {
    '*': 'vp check --fix',
  },
  fmt: {
    printWidth: 100,
    tabWidth: 2,
    useTabs: false,
    semi: true,
    singleQuote: true,
    trailingComma: 'all',
    insertFinalNewline: true,
    sortPackageJson: true,
    overrides: [
      {
        files: ['**/*.json', '**/*.jsonc'],
        options: {
          trailingComma: 'none',
        },
      },
      {
        files: ['**/*.yaml', '**/*.yml'],
        options: {
          printWidth: 100,
        },
      },
      {
        files: ['**/*.md', '**/*.mdx'],
        options: {
          printWidth: 80,
        },
      },
    ],
    ignorePatterns: [
      '**/.wrangler/**',
      '**/dist/**',
      '**/node_modules/**',
      '**/build/**',
      '**/.react-router/**',
      '**/+types/**',
      'pnpm-lock.yaml',
    ],
  },
  lint: {
    plugins: ['typescript', 'react', 'import', 'jsx-a11y'],
    env: {
      browser: true,
      es2024: true,
    },
    globals: {},
    settings: {
      react: {
        version: '19',
      },
    },
    rules: {
      'no-unused-vars': 'error',
      'no-console': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-empty': 'error',
      'react/no-danger': 'error',
      'typescript/no-explicit-any': 'error',
      'typescript/no-non-null-assertion': 'error',
      'typescript/consistent-type-imports': 'error',
    },
    ignorePatterns: [
      '**/.wrangler/**',
      '**/dist/**',
      '**/node_modules/**',
      'worker-configuration.d.ts',
      '**/+types/**',
      '**/.react-router/**',
      '**/build/**',
    ],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
});
