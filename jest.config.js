/** Jest config for unit tests (TypeScript). */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/app'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transformIgnorePatterns: ['/node_modules/'],
  collectCoverageFrom: ['app/**/*.{ts,tsx}', '!app/**/*.d.ts', '!app/**/__tests__/**'],
}
