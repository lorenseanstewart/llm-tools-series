module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['@swc/jest', {
      jsc: {
        parser: {
          syntax: 'typescript',
          decorators: true
        },
        target: 'es2022',
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true
        }
      }
    }],
  },
  setupFilesAfterEnv: ['<rootDir>/../jest.setup.ts'],
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/node_modules/**'
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@llm-tools/shared-types$': '<rootDir>/../../shared-types/src'
  },
  silent: true,
  forceExit: true
};