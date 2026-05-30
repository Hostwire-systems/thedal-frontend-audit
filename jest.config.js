/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // 1) Base preset for TS
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',

  // 2) Have ts-jest swallow TS errors so tests still run
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json',
      diagnostics: { warnOnly: true }
    }
  },

  // 3) Transform TS with ts-jest, JS with babel-jest
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json',
      diagnostics: { warnOnly: true }
    }],
    '^.+\\.jsx?$': 'babel-jest'
  },

  // 4) Make Jest transform AntD ESM modules instead of ignoring them
  transformIgnorePatterns: [
    // ignore everything in node_modules **except** antd, rc-picker, @ant-design
    'node_modules/(?!(antd|rc-picker|@ant-design/icons)/)'
  ],

  // 5) Stub out CSS & media imports
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg)$': '<rootDir>/__mocks__/fileMock.js'
  },

  // 6) Recognize these extensions
  moduleFileExtensions: ['ts','tsx','js','jsx','json','node'],

  // 7) Which files are tests
  testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],

  // 8) Coverage settings
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['html','text-summary'],

  // 9) Reporters: console + HTML
  reporters: [
    'default',
    [
      require.resolve('jest-html-reporters'),
      {
        publicPath: './jest-report',
        filename:   'report.html',
        expand:     true
      }
    ]
  ]
};
