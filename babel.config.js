// babel.config.js
module.exports = {
    presets: [
      // Target your current Node for Jest
      ['@babel/preset-env', { targets: { node: 'current' } }],
      // Support JSX
      '@babel/preset-react'
    ]
  };
  