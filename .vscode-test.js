const { defineConfig } = require('@vscode/test-cli');

module.exports = defineConfig({
  files: 'dist/test/**/*.test.js',
  workspaceFolder: __dirname,
  mocha: {
    timeout: 20000, // Increase timeout to 20s
    ui: 'bdd'  // Using BDD interface (describe, it)
  }
});