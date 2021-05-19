const { defaults } = require('jest-config');

module.exports = {
  collectCoverageFrom: [
    'lib/**/*.{js,mjs}',
  ],
  coverageDirectory: './coverage/',
  moduleFileExtensions: [
    ...defaults.moduleFileExtensions,
    'mjs',
  ],
  testEnvironment: 'node',
  testMatch: [
    '**/spec/**/*.spec.mjs',
  ],
  transform: {
    '^.+\\.mjs$': 'babel-jest',
  },
  verbose: true,
};
