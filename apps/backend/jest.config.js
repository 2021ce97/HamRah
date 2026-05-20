module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)'
  ],
  transform: {
    '^.+\\.js$': ['babel-jest', { configFile: './babel.config.js' }]
  }
};
