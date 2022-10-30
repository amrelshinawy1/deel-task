module.exports = {
  verbose: true,
  testEnvironment: 'node',
  roots: [
    '<rootDir>/src'
  ],
  moduleFileExtensions: [
    'ts',
    'js'
  ],
  modulePaths: [
    '<rootDir>'
  ],
  resetMocks: true,
  clearMocks: true,
  bail: 1,
  testTimeout: 15000,
  maxWorkers: 1,
  collectCoverage: true,
  coverageReporters: ['json', 'html'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.js'],
  coverageThreshold: {
    global: {
      branches: 70,
      statements: 70,
      functions: 70
    }
  }
};