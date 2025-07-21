module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest'
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/node_modules/**'
  ],
  coverageDirectory: '../coverage',
  moduleNameMapper: {
    '^@llm-tools/shared-types$': '<rootDir>/../../packages/shared-types/src'
  },
  silent: true,
  detectOpenHandles: true,
  forceExit: false
};