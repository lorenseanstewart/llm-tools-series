const path = require('path');

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
  setupFilesAfterEnv: ['<rootDir>/../test/test/jest.setup.ts'],
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/node_modules/**',
    '!**/test/**'
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@llm-tools/shared-types$': path.resolve(__dirname, '../../packages/shared-types/src'),
    '^@llm-tools/mcp-client$': path.resolve(__dirname, '../../packages/mcp-client/src')
  },
  testTimeout: 10000,
  silent: true,
  verbose: false,
  detectOpenHandles: true,
  forceExit: false,
  clearMocks: true,
  restoreMocks: true
};