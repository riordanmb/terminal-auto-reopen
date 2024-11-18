import * as vscode from 'vscode';

interface TerminalState {
    name: string;
    cwd?: string;
    shellPath?: string;
    shellArgs?: string[];
    env?: { [key: string]: string };
}

interface TerminalHistory {
    states: TerminalState[];
    maxSize: number;
}

export async function activate(context: vscode.ExtensionContext) {
    console.log('Terminal Auto-reopen activating...');
    
    // Ensure configuration exists with default value
    const config = vscode.workspace.getConfiguration('terminalReopen');
    const currentValue = config.inspect('enabled');
    
    if (currentValue?.globalValue === undefined) {
        await config.update('enabled', true, vscode.ConfigurationTarget.Global);
    }

    let terminalCount = vscode.window.terminals.length;
    const terminalHistory: TerminalHistory = {
        states: [],
        maxSize: 5
    };
    
    let statusBarItem: vscode.StatusBarItem;
    let autoReopenTimer: NodeJS.Timeout | undefined;
    let isReopening = false;

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );
    statusBarItem.command = 'terminalReopen.showMenu';
    context.subscriptions.push(statusBarItem);

    function syncTerminalCount() {
        const actualCount = vscode.window.terminals.length;
        if (terminalCount !== actualCount) {
            terminalCount = actualCount;
            updateStatusBar();
        }
    }

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

    // Save terminal state with error handling
    function saveTerminalState(terminal: vscode.Terminal) {
        try {
            console.log(`Saving state for terminal: ${terminal.name}`);
            const state: TerminalState = {
                name: terminal.name,
                cwd: (terminal as any).cwd,
                shellPath: (terminal as any).shellPath,
                shellArgs: (terminal as any).shellArgs,
                env: (terminal as any).env
            };

            // Only save valid states
            if (state.name) {
                terminalHistory.states = terminalHistory.states.filter(s => s.name !== terminal.name);
                terminalHistory.states.unshift(state);
                if (terminalHistory.states.length > terminalHistory.maxSize) {
                    terminalHistory.states.pop();
                }
                console.log(`Terminal state saved. History size: ${terminalHistory.states.length}`);
            }
        } catch (error) {
            console.error('Error saving terminal state:', error);
        }
    }

    async function autoReopenTerminal() {
        if (isReopening) {
            console.log('Already reopening, skipping...');
            return;
        }

        const config = vscode.workspace.getConfiguration('terminalReopen');
        if (!config.get('enabled')) {
            console.log('Extension disabled, skipping reopen');
            return;
        }

        try {
            isReopening = true;
            const lastState = terminalHistory.states[0];
            
            if (!lastState) {
                console.log('No terminal state found for reopening');
                return;
            }

            console.log('Attempting to reopen with state:', lastState);
            
            const options: vscode.TerminalOptions = {
                name: lastState.name || 'Terminal',
                shellPath: lastState.shellPath,
                shellArgs: lastState.shellArgs,
                cwd: lastState.cwd || undefined,
                env: lastState.env
            };

            const terminal = vscode.window.createTerminal(options);
            terminal.show();
            console.log('Terminal reopened successfully');
        } catch (error) {
            console.error('Error reopening terminal:', error);
        } finally {
            isReopening = false;
        }
    }

    // Handle terminal hide/show for last terminal
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTerminal((terminal) => {
            if (vscode.window.terminals.length === 1 && !terminal) {
                // If we have one terminal but none is active, the panel was just hidden
                console.log('Last terminal hidden, showing it again');
                vscode.window.terminals[0].show();
            }
        })
    );

    // Handle terminal creation
    context.subscriptions.push(
        vscode.window.onDidOpenTerminal((terminal) => {
            console.log(`Terminal opened: ${terminal.name}`);
            saveTerminalState(terminal);
            terminalCount++;
            updateStatusBar();
        })
    );

    // Handle terminal closure
    context.subscriptions.push(
        vscode.window.onDidCloseTerminal((terminal) => {
            console.log(`Terminal closed: ${terminal.name}`);
            terminalCount--;
            updateStatusBar();
            
            if (terminalCount === 0) {
                const config = vscode.workspace.getConfiguration('terminalReopen');
                const delay = config.get('reopenDelay') as number || 1000;
                
                if (autoReopenTimer) {
                    clearTimeout(autoReopenTimer);
                }
                
                autoReopenTimer = setTimeout(async () => {
                    if (vscode.window.terminals.length === 0) {
                        console.log('No terminals found, triggering auto-reopen');
                        await autoReopenTerminal();
                    }
                }, delay);
            }
        })
    );

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('terminalReopen.toggle', async () => {
            const config = vscode.workspace.getConfiguration('terminalReopen');
            const currentValue = config.get<boolean>('enabled');
            await config.update('enabled', !currentValue, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage(
                `Terminal Auto-reopen ${!currentValue ? 'enabled' : 'disabled'}`
            );
            updateStatusBar();
        })
    );

    // Sync handlers
    context.subscriptions.push(
        vscode.window.onDidChangeWindowState(() => {
            syncTerminalCount();
        })
    );

    // Initial setup
    syncTerminalCount();
    updateStatusBar();

    console.log('Terminal Auto-reopen activated successfully');
    return Promise.resolve();
}

export function deactivate() {
    // Cleanup handled by disposables
}