import js from '@eslint/js'
import ts from 'typescript-eslint'
import globals from 'globals'
import pluginVue from 'eslint-plugin-vue'
import eslintConfigPrettier from 'eslint-config-prettier'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'

const runtimeGlobTypes = {
  browser: true,
  global: true,
  DOMEvent: true,
  ScrollToOptions: true,
  MozFocusEvent: true,
  ID: true,
}

export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  eslintConfigPrettier,
  eslintPluginPrettierRecommended,

  // Addon vue
  {
    files: ['**/*.vue'],
    languageOptions: {
      globals: { ...globals.browser, ...runtimeGlobTypes },
      parserOptions: {
        parser: {
          js: 'espree',
          mjs: 'espree',
          ts: ts.parser,
        },
        extraFileExtensions: ['.vue'],
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },

  // Addon js/ts
  {
    files: ['./src/**/*.js', './src/**/*.mjs', './src/**/*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: { ...globals.browser, ...runtimeGlobTypes },
    },
  },

  // Build/Test
  {
    files: ['./build/*', './test/*'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: { ...globals.node },
    },
  },

  // Exclude
  { ignores: ['addon/*'] },

  // Rules configs
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/custom-event-name-casing': 'off',
      'vue/no-mutating-props': 'off',
      'no-console': 'warn',
      indent: ['error', 2, { SwitchCase: 1 }],
      'linebreak-style': ['error', 'unix'],
      // quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
      quotes: 'off',
      semi: ['error', 'never'],
      'require-atomic-updates': 'off',
      'vue/html-self-closing': 'off',
      'vue/require-default-prop': 'off',
      'no-async-promise-executor': 'off',
      'no-prototype-builtins': 'off',
      'no-constant-condition': ['error', { checkLoops: false }],
      'no-unused-labels': 'off',
    },
  },
]
