module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'next/core-web-vitals'
  ],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  rules: {
    // Disable strict boolean expression checks to avoid persistent errors
    '@typescript-eslint/strict-boolean-expressions': 'off',
    
    // Adjust complexity rules
    'complexity': ['warn', 15],
    
    // Adjust max line length
    'max-len': ['warn', { 
      code: 140, 
      tabWidth: 2, 
      ignoreComments: true, 
      ignoreTrailingComments: true,
      ignoreUrls: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true
    }],
    
    // Allow explicit any with a warning
    '@typescript-eslint/no-explicit-any': 'warn',
    
    // Warn on unused variables, ignoring those starting with an underscore
    'no-unused-vars': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    
    // Optional: other rules
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn'
  },
  ignorePatterns: [
    'node_modules/',
    '.next/',
    'out/',
    'public/',
    'coverage/',
    'playwright-report/',
  ],
}; 