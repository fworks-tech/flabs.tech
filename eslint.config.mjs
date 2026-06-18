import nextVitals from 'eslint-config-next/core-web-vitals';
import storybook from 'eslint-plugin-storybook';
import eslintConfigPrettier from 'eslint-config-prettier/flat';

const eslintConfig = [
  {
    ignores: ['.next/**', 'node_modules/**', 'dist/**', 'build/**', 'coverage/**', 'out/**'],
  },
  ...nextVitals,
  ...storybook.configs['flat/recommended'],
  eslintConfigPrettier,
];

export default eslintConfig;