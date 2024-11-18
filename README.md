# Terminal Auto-reopen for VS Code

Never lose your terminal workflow again! This extension automatically reopens a terminal when the last one is closed in VS Code.

## Features

### 🔄 Auto-reopen

- Automatically reopens a new terminal when the last one is closed
- Configurable enable/disable toggle
- Status bar indicator showing number of open terminals

### 📊 Status Bar Integration

- Shows current number of open terminals
- Visual warning indicator when no terminals are open
- Displays terminal count and state

## Installation

1. Open VS Code
2. Press `Ctrl+P` (`Cmd+P` on macOS)
3. Type `ext install terminal-auto-reopen`
4. Press Enter

## Usage

### Basic Usage

The extension works automatically once installed. When you close your last terminal, a new one will be opened automatically.

### Status Bar

The status bar shows:

- Number of open terminals (📟 2)
- Warning indicator when no terminals are open
- Terminal count updates in real-time

### Commands

Access these commands through the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`):

- `Terminal Auto-reopen: Toggle` - Enable/disable automatic reopening

### Keyboard Shortcuts

You can assign keyboard shortcuts to the toggle command in VS Code's Keyboard Shortcuts editor.

Example keybindings.json entry:

```json
{
    "key": "ctrl+k ctrl+t",
    "command": "terminalReopen.toggle"
}
```

## Configuration

Access settings through VS Code's Settings UI or settings.json:

```json
{
    "terminalReopen.enabled": true  // Enable/disable auto-reopen
}
```

## Development

### Prerequisites

- Node.js and npm/yarn
- Visual Studio Code
- Recommended VS Code extensions:
  - amodio.tsl-problem-matcher
  - ms-vscode.extension-test-runner
  - dbaeumer.vscode-eslint

### Setup

1. Clone the repository:
   
```bash
git clone https://github.com/riordanmb/terminal-auto-reopen.git
cd terminal-auto-reopen
```

1. Install dependencies:
   
```bash
npm install
# or
yarn install
```

1. Open in VS Code:
   
```bash
code .
```

### Development Workflow

1. Make changes to the source code in `src/`
2. Press `F5` to launch the extension in debug mode
3. Use `npm run watch` or `yarn watch` for automatic compilation
4. Run tests using the Test Runner in VS Code

### Building

```bash
npm run package
# or
yarn package
```

### Testing

1. Install the Extension Test Runner
2. Run the watch task:

```bash
npm run watch-tests
# or
yarn watch-tests
```

1. Open the Testing view and run tests

## Publishing

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Package the extension:

```bash
vsce package
```

1. Publish to marketplace:

```bash
vsce publish
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

[MIT License](LICENSE)

## Release Notes

See [CHANGELOG](CHANGELOG) for detailed release notes.

### 0.0.4

- Initial release with basic functionality
- Auto-reopen of last terminal
- Status bar integration with terminal count
- Basic configuration option to enable/disable

## Support

For bugs, feature requests, and questions, please [create an issue](https://github.com/riordanmb/terminal-auto-reopen/issues).