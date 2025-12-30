#!/usr/bin/env node
/**
 * Build script for YouToob player controls
 *
 * Concatenates modular source files into a single player.js
 *
 * Usage: node build.js
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');
const OUTPUT_FILE = path.join(__dirname, 'player.js');

// Files are numbered to ensure correct order
const sourceFiles = fs.readdirSync(SRC_DIR)
    .filter(f => f.endsWith('.js'))
    .sort();

console.log('Building player.js from:');
sourceFiles.forEach(f => console.log(`  - ${f}`));

// Read and concatenate all source files
const contents = sourceFiles.map(file => {
    const filePath = path.join(SRC_DIR, file);
    return fs.readFileSync(filePath, 'utf8');
});

// Wrap in IIFE with 'use strict' and add header comment
const output = `/**
 * AUTO-GENERATED FILE - DO NOT EDIT
 *
 * Edit source files in src/ instead, then run: node build.js
 * Generated: ${new Date().toISOString()}
 */
(function () {
    'use strict';

${contents.join('\n\n')}
})();
`;

fs.writeFileSync(OUTPUT_FILE, output);

console.log(`\nBuilt: ${OUTPUT_FILE}`);
console.log(`Size: ${(output.length / 1024).toFixed(1)} KB`);
