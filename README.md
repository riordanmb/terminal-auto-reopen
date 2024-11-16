# Terminal Auto-reopen for VS Code

Never lose your terminal workflow again! This extension automatically manages your VS Code integrated terminals, ensuring you always have a terminal available when you need it.

## Features

### 🔄 Auto-reopen

- Automatically reopens a new terminal when the last one is closed
- Preserves previous terminal settings (working directory, shell type, environment variables)
- Configurable delay to prevent accidental reopens

### 📝 Terminal History

- Maintains history of recent terminal configurations
- Allows quick restoration of previous terminal setups
- Persists across VS Code sessions

### 🎯 Command Tracking

- Optionally tracks the last command executed in each terminal
- Ability to restore terminals with their last command
- Helps maintain context when switching between tasks

### 📊 Status Bar Integration

- Shows current number of open terminals
- Quick access menu for common actions
- Visual indicators for different states
- Warning indicator when no terminals are open

## Installation

1. Open VS Code
2. Press `Ctrl+P` (`Cmd+P` on macOS)
3. Type `ext install terminal-reopen`
4. Press Enter

## Usage

### Basic Usage

The extension works automatically once installed. When you close your last terminal, a new one will be opened with the same configuration.

### Status Bar

Click the terminal counter in the status bar (📟 2) to access quick actions:

- Toggle Auto-reopen
- Restore Previous Terminal
- Open Settings
- Clear Terminal History

### Commands

Access these commands through the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`):

- `Terminal Auto-reopen: Toggle` - Enable/disable automatic reopening
- `Terminal Auto-reopen: Show Menu` - Display quick actions menu
- `Terminal Auto-reopen: Restore from History` - Choose a previous terminal configuration
- `Terminal Auto-reopen: Clear History` - Reset terminal history
- `Terminal Auto-reopen: Open Settings` - Configure extension settings

### Keyboard Shortcuts

You can assign keyboard shortcuts to any command in VS Code's Keyboard Shortcuts editor.

Example keybindings.json entry:

```json
{
    "key": "ctrl+k ctrl+t",
    "command": "terminalReopen.showMenu"
}
```

## Configuration

Access settings through VS Code's Settings UI or settings.json:

```json
{
    "terminalReopen.enabled": true,                 // Enable/disable auto-reopen
    "terminalReopen.preserveState": true,           // Keep terminal configurations
    "terminalReopen.showStatusBar": true,           // Show status bar indicator
    "terminalReopen.reopenDelay": 1000,             // Delay before reopening (ms)
    "terminalReopen.trackCommands": true,           // Track last command
    "terminalReopen.restoreLastCommand": false,     // Auto-execute last command
    "terminalReopen.maxHistorySize": 5              // Number of configurations to remember
}
```

## Features in Detail

### Terminal State Preservation

The extension preserves:

- Working directory (CWD)
- Shell type
- Environment variables
- Terminal name
- Last executed command (optional)

### History Management

- Maintains a configurable number of recent terminal configurations
- Persists across VS Code sessions
- Quick restore through command palette or status bar menu
- Clear history option for fresh start

### Visual Feedback

- Different status bar icons for enabled/disabled states
- Warning indicator when no terminals are open
- Clear visual feedback for actions
- Intuitive quick pick menus

## Troubleshooting

### Common Issues

1. **Terminal doesn't reopen automatically**
   - Check if the extension is enabled in settings
   - Verify the reopenDelay setting isn't too high
   - Ensure VS Code has necessary permissions

2. **Working directory not preserved**
   - Some shell types may not support CWD preservation
   - Try using absolute paths in terminal commands

3. **Last command not tracked**
   - Verify trackCommands is enabled in settings
   - Some shell types may not support command tracking
  
# Development

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
git clone [repository-url]
cd inline-python-package-installer
```

1. Install dependencies:

```bash
npm install
# or
yarn install
```

2. Open in VS Code:

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

3. Open the Testing view and run tests

## Publishing

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Package the extension:

```bash
vsce package
```

4. Publish to marketplace:

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

See [CHANGELOG.md](CHANGELOG.md) for detailed release notes.

### 0.0.2

- Initial release with basic functionality
- Auto-reopen of last terminal
- Preservation of terminal state

## Support

For bugs, feature requests, and questions, please [create an issue](https://github.com/riordanmb/terminal-auto-reopen/issues).