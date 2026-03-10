#!/usr/bin/env node

/**
 * Lambda Packaging Script
 * Packages each Lambda function into a separate ZIP file
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const LAMBDAS_DIR = path.join(DIST_DIR, 'lambdas');
const HANDLERS_DIR = path.join(DIST_DIR, 'handlers');

const LAMBDA_FUNCTIONS = [
    'dashboard',
    'kpis',
    'alerts',
    'alert-processor',
    'reports',
];

async function createZip(functionName) {
    return new Promise((resolve, reject) => {
        const outputPath = path.join(LAMBDAS_DIR, `${functionName}.zip`);
        const output = fs.createWriteStream(outputPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            console.log(`  ✓ ${functionName}.zip (${archive.pointer()} bytes)`);
            resolve();
        });

        archive.on('error', reject);
        archive.pipe(output);

        // Add all dist files
        archive.directory(DIST_DIR, false, (entry) => {
            // Exclude other lambda zips
            if (entry.name.endsWith('.zip')) return false;
            return entry;
        });

        // Add node_modules (production only)
        const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
        if (fs.existsSync(nodeModulesPath)) {
            archive.directory(nodeModulesPath, 'node_modules');
        }

        archive.finalize();
    });
}

async function main() {
    console.log('📦 Packaging Lambda functions...\n');

    // Ensure lambdas directory exists
    if (!fs.existsSync(LAMBDAS_DIR)) {
        fs.mkdirSync(LAMBDAS_DIR, { recursive: true });
    }

    // Build TypeScript first
    console.log('Building TypeScript...');
    execSync('npm run build', { stdio: 'inherit' });

    // Package each function
    console.log('\nCreating ZIP packages:');
    for (const func of LAMBDA_FUNCTIONS) {
        await createZip(func);
    }

    console.log('\n✅ All Lambda functions packaged successfully!');
}

main().catch((error) => {
    console.error('❌ Packaging failed:', error);
    process.exit(1);
});
