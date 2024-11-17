import * as vscode from 'vscode';

interface TerminalState {
    name: string;
    cwd?: string;
    shellPath?: string;
    shellArgs?: string[];
    env?: { [key: string]: string };
    lastCommand?: string;
}

interface TerminalHistory {
    states: TerminalState[];
    maxSize: number;
}

export function activate(context: vscode.ExtensionContext) {
    // Initialize with current terminals count
    let terminalCount = vscode.window.terminals.length;
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
    
    // Sync terminal count with actual terminals
    function syncTerminalCount() {
        const actualCount = vscode.window.terminals.length;
        if (terminalCount !== actualCount) {
            terminalCount = actualCount;
            updateStatusBar();
        }
    }

    // Update status bar with current terminal count
    function updateStatusBar() {
        const config = vscode.workspace.getConfiguration('terminalReopen');
        if (config.get('showStatusBar')) {
            const isEnabled = config.get('enabled');
            statusBarItem.text = `$(terminal) ${terminalCount}`;
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

    // Save terminal state
    function saveTerminalState(terminal: vscode.Terminal) {
        const state: TerminalState = {
            name: terminal.name,
            // Note: These might be undefined as they're not always accessible
            cwd: (terminal as any).cwd,
            shellPath: (terminal as any).shellPath,
            shellArgs: (terminal as any).shellArgs,
            env: (terminal as any).env
        };

        // Remove old state if exists
        terminalHistory.states = terminalHistory.states.filter(s => s.name !== terminal.name);
        
        // Add new state
        terminalHistory.states.unshift(state);
        
        // Maintain history size
        if (terminalHistory.states.length > terminalHistory.maxSize) {
            terminalHistory.states.pop();
        }
    }

    // Auto reopen terminal
    function autoReopenTerminal() {
        const config = vscode.workspace.getConfiguration('terminalReopen');
        if (!config.get('enabled')) {
            return;
        }

        const lastState = terminalHistory.states[0];
        const options: vscode.TerminalOptions = {
            name: lastState?.name || 'Terminal',
            shellPath: lastState?.shellPath,
            shellArgs: lastState?.shellArgs,
            cwd: lastState?.cwd,
            env: lastState?.env
        };

        vscode.window.createTerminal(options);
    }

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('terminalReopen.toggle', () => {
            const config = vscode.workspace.getConfiguration('terminalReopen');
            const currentValue = config.get('enabled');
            config.update('enabled', !currentValue, true);
            vscode.window.showInformationMessage(
                `Terminal Auto-reopen ${!currentValue ? 'enabled' : 'disabled'}`
            );
            updateStatusBar();
        })
    );

    // Terminal event handlers
    context.subscriptions.push(
        vscode.window.onDidOpenTerminal(terminal => {
            terminalCount++;
            updateStatusBar();
            saveTerminalState(terminal);
        })
    );

    context.subscriptions.push(
        vscode.window.onDidCloseTerminal(terminal => {
            terminalCount--;
            updateStatusBar();
            
            // Only auto-reopen if this was the last terminal
            if (terminalCount === 0) {
                const config = vscode.workspace.getConfiguration('terminalReopen');
                const delay = config.get('reopenDelay') as number || 1000;
                
                // Clear existing timer if any
                if (autoReopenTimer) {
                    clearTimeout(autoReopenTimer);
                }
                
                // Set new timer
                autoReopenTimer = setTimeout(() => {
                    // Double check terminal count before reopening
                    if (vscode.window.terminals.length === 0) {
                        autoReopenTerminal();
                    }
                }, delay);
            }
        })
    );

    // Sync terminal count on window state changes
    context.subscriptions.push(
        vscode.window.onDidChangeWindowState(() => {
            syncTerminalCount();
        })
    );

    // Periodic sync to handle edge cases
    const syncInterval = setInterval(() => {
        syncTerminalCount();
    }, 30000); // Sync every 30 seconds

    // Add cleanup for sync interval
    context.subscriptions.push({
        dispose: () => clearInterval(syncInterval)
    });

    // Initial status bar update
    syncTerminalCount();
    updateStatusBar();
}

export function deactivate() {
    // Cleanup will be handled by disposables
}