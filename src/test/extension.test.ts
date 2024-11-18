import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';

suite('Terminal Auto-reopen Extension Test Suite', () => {
    let extension: vscode.Extension<any>;
    let disposables: vscode.Disposable[] = [];

    suiteSetup(async function() {
        this.timeout(20000);
        
        extension = vscode.extensions.getExtension('michael-riordan.terminal-auto-reopen')!;
        if (!extension) {
            throw new Error('Extension not found');
        }

        try {
            await closeAllTerminals();
            await extension.activate();
            console.log('Extension activated');
            
            const config = vscode.workspace.getConfiguration('terminalReopen');
            await config.update('enabled', true, vscode.ConfigurationTarget.Global);
            console.log('Configuration updated: enabled =', config.get('enabled'));
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err) {
            console.error('Failed during setup:', err);
            throw err;
        }
    });

    async function closeAllTerminals(): Promise<void> {
        console.log('Closing all terminals...');
        const terminals = [...vscode.window.terminals];
        console.log(`Found ${terminals.length} terminals to close`);
        
        if (terminals.length === 0) {
            return;
        }

        // Temporarily disable auto-reopen during cleanup
        const config = vscode.workspace.getConfiguration('terminalReopen');
        const wasEnabled = config.get('enabled');
        await config.update('enabled', false, vscode.ConfigurationTarget.Global);

        try {
            await Promise.all(terminals.map(terminal => {
                return new Promise<void>((resolve) => {
                    const disposable = vscode.window.onDidCloseTerminal(() => {
                        disposable.dispose();
                        resolve();
                    });
                    disposables.push(disposable);
                    terminal.dispose();
                });
            }));

            await new Promise(resolve => setTimeout(resolve, 1000));
        } finally {
            if (wasEnabled) {
                await config.update('enabled', true, vscode.ConfigurationTarget.Global);
            }
        }
    }

    setup(async function() {
        this.timeout(10000);
        await closeAllTerminals();
        const config = vscode.workspace.getConfiguration('terminalReopen');
        await config.update('enabled', true, vscode.ConfigurationTarget.Global);
    });

    test('Basic auto-reopen functionality', async function() {
        this.timeout(10000);
        console.log('Starting basic auto-reopen test');

        const terminal = vscode.window.createTerminal('Test Terminal');
        terminal.show();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        assert.strictEqual(vscode.window.terminals.length, 1, 'Should have one terminal');
        
        terminal.dispose();
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        assert.strictEqual(vscode.window.terminals.length, 1, 'Should have auto-reopened a terminal');
    });

    test('Multiple terminals handling', async function() {
        this.timeout(15000);
        console.log('Starting multiple terminals test');

        // Create multiple terminals
        const terminal1 = vscode.window.createTerminal('Terminal 1');
        const terminal2 = vscode.window.createTerminal('Terminal 2');
        const terminal3 = vscode.window.createTerminal('Terminal 3');
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        assert.strictEqual(vscode.window.terminals.length, 3, 'Should have three terminals');

        // Close terminals one by one
        terminal1.dispose();
        await new Promise(resolve => setTimeout(resolve, 1000));
        assert.strictEqual(vscode.window.terminals.length, 2, 'Should have two terminals after first close');

        terminal2.dispose();
        await new Promise(resolve => setTimeout(resolve, 1000));
        assert.strictEqual(vscode.window.terminals.length, 1, 'Should have one terminal after second close');

        terminal3.dispose();
        await new Promise(resolve => setTimeout(resolve, 3000));
        assert.strictEqual(vscode.window.terminals.length, 1, 'Should have auto-reopened one terminal');
    });

    test('Configuration changes', async function() {
        this.timeout(15000);
        console.log('Starting configuration test');

        const config = vscode.workspace.getConfiguration('terminalReopen');
        await config.update('enabled', false, vscode.ConfigurationTarget.Global);
        
        const terminal = vscode.window.createTerminal('Test Terminal');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        terminal.dispose();
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        assert.strictEqual(vscode.window.terminals.length, 0, 'Should not reopen terminal when disabled');

        await config.update('enabled', true, vscode.ConfigurationTarget.Global);
        const terminal2 = vscode.window.createTerminal('Test Terminal 2');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        terminal2.dispose();
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        assert.strictEqual(vscode.window.terminals.length, 1, 'Should reopen terminal when re-enabled');
    });

    test('Terminal state preservation', async function() {
        this.timeout(15000);
        console.log('Starting state preservation test');

        const customEnv = { 'TEST_VAR': 'test_value' };
        const cwd = path.resolve(__dirname, '../..');
        
        const terminal = vscode.window.createTerminal({
            name: 'Custom Terminal',
            cwd: cwd,
            env: customEnv
        });

        await new Promise(resolve => setTimeout(resolve, 2000));
        const initialName = terminal.name;
        terminal.dispose();
        await new Promise(resolve => setTimeout(resolve, 3000));

        const terminals = vscode.window.terminals;
        assert.strictEqual(terminals.length, 1, 'Should have reopened terminal');
        assert.strictEqual(terminals[0].name, initialName, 'Should preserve terminal name');
    });

    test('Hide panel behavior with last terminal', async function() {
        this.timeout(15000);
        console.log('Starting hide panel test');

        const terminal = vscode.window.createTerminal('Hide Test');
        terminal.show();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Hide panel
        await vscode.commands.executeCommand('workbench.action.closePanel');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Terminal should be shown again automatically
        assert.strictEqual(vscode.window.activeTerminal !== undefined, true, 'Last terminal should be visible after hiding');
        assert.strictEqual(vscode.window.terminals.length, 1, 'Should still have one terminal');
        assert.strictEqual(vscode.window.terminals[0].name, 'Hide Test', 'Should be the original terminal');
    });

    test('Multiple terminals with hide panel', async function() {
        this.timeout(15000);
        console.log('Starting multiple terminals with hide panel test');

        // Create multiple terminals
        const terminal1 = vscode.window.createTerminal('Hide Test 1');
        const terminal2 = vscode.window.createTerminal('Hide Test 2');
        
        // Show first terminal to ensure panel is visible
        terminal1.show();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verify initial state
        assert.strictEqual(vscode.window.terminals.length, 2, 'Should have two terminals');
        assert.strictEqual(vscode.window.activeTerminal !== undefined, true, 'Should have an active terminal initially');
        
        // Hide panel with multiple terminals
        await vscode.commands.executeCommand('workbench.action.closePanel');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Switch focus away from terminal to ensure it's hidden
        await vscode.commands.executeCommand('workbench.action.focusFirstEditorGroup');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check terminal state after hiding panel
        const terminalCount = vscode.window.terminals.length;
        console.log(`Terminal count after hiding panel: ${terminalCount}`);
        
        // With multiple terminals, panel should stay hidden when requested
        assert.strictEqual(terminalCount, 2, 'Should still have two terminals after hiding panel');
        
        // Close first terminal
        terminal1.dispose();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Show and then hide the last terminal
        terminal2.show();
        await new Promise(resolve => setTimeout(resolve, 1000));
        await vscode.commands.executeCommand('workbench.action.closePanel');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Last terminal should be shown automatically
        assert.strictEqual(vscode.window.activeTerminal !== undefined, true, 'Last terminal should be visible');
        assert.strictEqual(vscode.window.terminals.length, 1, 'Should have one terminal remaining');
    });

    test('Hide panel after auto-reopen', async function() {
        this.timeout(15000);
        console.log('Starting hide after auto-reopen test');

        // Create and kill a terminal
        const terminal = vscode.window.createTerminal('Kill Test');
        terminal.show();
        await new Promise(resolve => setTimeout(resolve, 1000));
        terminal.dispose();
        
        // Wait for auto-reopen
        await new Promise(resolve => setTimeout(resolve, 3000));
        assert.strictEqual(vscode.window.terminals.length, 1, 'Should have auto-reopened terminal');

        // Hide the reopened terminal
        await vscode.commands.executeCommand('workbench.action.closePanel');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Should show automatically
        assert.strictEqual(vscode.window.activeTerminal !== undefined, true, 'Auto-reopened terminal should be visible after hiding');
        assert.strictEqual(vscode.window.terminals.length, 1, 'Should still have one terminal');
    });

    test('Rapid hide/show with last terminal', async function() {
        this.timeout(20000);
        console.log('Starting rapid hide/show test');

        const terminal = vscode.window.createTerminal('Rapid Hide Test');
        terminal.show();
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Rapidly hide/show panel
        for (let i = 0; i < 5; i++) {
            await vscode.commands.executeCommand('workbench.action.closePanel');
            await new Promise(resolve => setTimeout(resolve, 200));
            await vscode.commands.executeCommand('workbench.action.togglePanel');
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Should end up visible
        assert.strictEqual(vscode.window.activeTerminal !== undefined, true, 'Terminal should be visible after rapid hide/show');
        assert.strictEqual(vscode.window.terminals.length, 1, 'Should still have one terminal');
    });

    suiteTeardown(async () => {
        console.log('Running test cleanup...');
        await closeAllTerminals();
        await vscode.workspace.getConfiguration('terminalReopen')
            .update('enabled', undefined, vscode.ConfigurationTarget.Global);
        disposables.forEach(d => d.dispose());
        console.log('Cleanup complete');
    });
});