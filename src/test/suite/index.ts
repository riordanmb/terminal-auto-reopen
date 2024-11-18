import * as path from 'path';
const Mocha = require('mocha');
import { glob } from 'glob';

export async function run(): Promise<void> {
    // Create the mocha test
    const mocha = new Mocha({
        ui: 'tdd',
        color: true,
        timeout: 30000  // Increased timeout
    });

    const testsRoot = path.resolve(__dirname, '..');

    try {
        // Use promisified glob
        const files = await glob('**/**.test.js', { cwd: testsRoot });
        
        // Add files to the test suite
        files.forEach((f: string) => {
            console.log(`Adding test file: ${f}`);  // Debug log
            mocha.addFile(path.resolve(testsRoot, f));
        });

        return new Promise<void>((resolve, reject) => {
            try {
                // Run the mocha test
                mocha.run((failures: number) => {
                    if (failures > 0) {
                        reject(new Error(`${failures} tests failed.`));
                    } else {
                        resolve();
                    }
                });
            } catch (err) {
                reject(err);
            }
        });
    } catch (err) {
        console.error('Error running tests:', err);
        throw err;
    }
}