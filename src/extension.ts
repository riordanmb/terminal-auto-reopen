import * as vscode from 'vscode';
import * as path from 'path';

interface TerminalState {
    name: string;
    cwd?: string;
    shellPath?: string;
    environmentVariables?: { [key: string]: string };
    lastCommand?: string;
}

interface TerminalHistory {
    states: TerminalState[];
    maxSize: number;
}

export function activate(context: vscode.ExtensionContext) {
    let terminalCount = 0;
    const terminalHistory: TerminalHistory = {
        states: [],
        maxSize: 5
    };
    let statusBarItem: vscode.StatusBarItem;
    let autoReopenTimer: NodeJS.Timeout | undefined;
    
    // Create status bar item with dropdown menu
    statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );
    statusBarItem.command = 'terminalReopen.showMenu';
    context.subscriptions.push(statusBarItem);
    
    // Update status bar with current terminal count and custom icon based on state
    function updateStatusBar() {
        const config = vscode.workspace.getConfiguration('terminalReopen');
        if (config.get('showStatusBar')) {
            const isEnabled = config.get('enabled');
            statusBarItem.text = `${isEnabled ? '$(terminal)' : '$(terminal-powershell)'} ${terminalCount}`;
            statusBarItem.tooltip = `${terminalCount} terminal${terminalCount === 1 ? '' : 's'} open\nClick for options`;
            statusBarItem.backgroundColor = undefined;
            if (terminalCount === 0 && isEnabled) {
                statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
            }
            statusBarItem.show();
        } else {
            statusBarItem.hide();
        }
    }

    // Store terminal state in history
    function storeTerminalState(terminal: vscode.Terminal) {
        const state: TerminalState = {
            name: terminal.name,
            cwd: terminal.processId ? undefined : terminal.creationOptions.cwd?.toString(),
            shellPath: terminal.processId ? undefined : terminal.creationOptions.shellPath?.toString(),
            environmentVariables: terminal.processId ? undefined : terminal.creationOptions.env
        };
        
        terminalHistory.states.unshift(state);
        if (terminalHistory.states.length > terminalHistory.maxSize) {
            terminalHistory.states.pop();
        }
        
        // Save history to workspace state
        context.workspaceState.update('terminalHistory', terminalHistory.states);
    }

    // Create terminal from saved state
    async function createTerminalFromState(state: TerminalState) {
        const options: vscode.TerminalOptions = {
            name: state.name
        };
        
        if (state.cwd) {
            options.cwd = state.cwd;
        }
        
        if (state.shellPath) {
            options.shellPath = state.shellPath;
        }
        
        if (state.environmentVariables) {
            options.env = state.environmentVariables;
        }
        
        const terminal = vscode.window.createTerminal(options);
        terminal.show();
        
        // If there's a last command, optionally execute it
        if (state.lastCommand && vscode.workspace.getConfiguration('terminalReopen').get('restoreLastCommand')) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for terminal to initialize
            terminal.sendText(state.lastCommand);
        }
        
        return terminal;
    }

    // Register command to show quick pick menu
    context.subscriptions.push(
        vscode.commands.registerCommand('terminalReopen.showMenu', async () => {
            const items = [
                {
                    label: '$(gear) Toggle Auto-reopen',
                    description: vscode.workspace.getConfiguration('terminalReopen').get('enabled') ? 'Enabled' : 'Disabled',
                    command: 'terminalReopen.toggle'
                },
                {
                    label: '$(history) Restore Previous Terminal',
                    description: 'Choose from history',
                    command: 'terminalReopen.restoreFromHistory'
                },
                {
                    label: '$(settings) Open Settings',
                    command: 'terminalReopen.openSettings'
                },
                {
                    label: '$(clear-all) Clear Terminal History',
                    command: 'terminalReopen.clearHistory'
                }
            ];
            
            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Terminal Auto-reopen Options'
            });
            
            if (selected) {
                vscode.commands.executeCommand(selected.command);
            }
        })
    );

    // Register command to restore from history
    context.subscriptions.push(
        vscode.commands.registerCommand('terminalReopen.restoreFromHistory', async () => {
            const historyItems = terminalHistory.states.map((state, index) => ({
                label: state.name,
                description: state.cwd ? `CWD: ${state.cwd}` : undefined,
                detail: `Shell: ${path.basename(state.shellPath || 'default')}`,
                state: state
            }));
            
            const selected = await vscode.window.showQuickPick(historyItems, {
                placeHolder: 'Select terminal configuration to restore'
            });
            
            if (selected) {
                createTerminalFromState(selected.state);
            }
        })
    );

    // Register command to open settings
    context.subscriptions.push(
        vscode.commands.registerCommand('terminalReopen.openSettings', () => {
            vscode.commands.executeCommand('workbench.action.openSettings', '@ext:terminalReopen');
        })
    );

    // Register command to clear history
    context.subscriptions.push(
        vscode.commands.registerCommand('terminalReopen.clearHistory', async () => {
            const confirmed = await vscode.window.showWarningMessage(
                'Clear terminal history?',
                'Yes',
                'No'
            );
            
            if (confirmed === 'Yes') {
                terminalHistory.states = [];
                context.workspaceState.update('terminalHistory', []);
                vscode.window.showInformationMessage('Terminal history cleared');
            }
        })
    );

    // Track terminal creation
    context.subscriptions.push(
        vscode.window.onDidOpenTerminal(terminal => {
            terminalCount++;
            updateStatusBar();
            
            // Track commands in terminal
            if (vscode.workspace.getConfiguration('terminalReopen').get('trackCommands')) {
                const writeEmitter = new vscode.EventEmitter<string>();
                context.subscriptions.push(
                    terminal.onDidWriteLine(line => {
                        if (line.trim() && !line.startsWith('>')) {
                            const state = terminalHistory.states.find(s => s.name === terminal.name);
                            if (state) {
                                state.lastCommand = line.trim();
                            }
                        }
                    })
                );
            }
        })
    );

    // Track terminal disposal with delayed auto-reopen
    context.subscriptions.push(
        vscode.window.onDidCloseTerminal(terminal => {
            terminalCount--;
            updateStatusBar();
            storeTerminalState(terminal);
            
            // Clear any existing auto-reopen timer
            if (autoReopenTimer) {
                clearTimeout(autoReopenTimer);
            }
            
            // If no terminals are left and auto-reopen is enabled, start timer
            if (terminalCount === 0 && vscode.workspace.getConfiguration('terminalReopen').get('enabled')) {
                const delay = vscode.workspace.getConfiguration('terminalReopen').get('reopenDelay') as number;
                autoReopenTimer = setTimeout(() => {
                    const state = terminalHistory.states[0];
                    if (state) {
                        createTerminalFromState(state);
                    } else {
                        vscode.window.createTerminal('Auto-restored Terminal');
                    }
                }, delay);
            }
        })
    );
    
    // Load saved history on activation
    const savedHistory = context.workspaceState.get<TerminalState[]>('terminalHistory');
    if (savedHistory) {
        terminalHistory.states = savedHistory;
    }
    
    // Initialize status bar
    updateStatusBar();
}

export function deactivate() {}