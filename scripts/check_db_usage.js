const fs = require('fs');
const path = require('path');

const sqlFile = "supabase/migrations/20260305155506_01_tables_schema.sql";
const sqlContent = fs.readFileSync(sqlFile, 'utf8');

const tables = {};
let currentTable = null;

const lines = sqlContent.split('\n');
for (let line of lines) {
    line = line.trim();
    const tableMatch = line.match(/^CREATE TABLE IF NOT EXISTS ([a-z_]+)/);
    if (tableMatch) {
        currentTable = tableMatch[1];
        tables[currentTable] = [];
        continue;
    }
    
    if (currentTable) {
        if (line.startsWith(');') || line.startsWith(') ;')) {
            currentTable = null;
            continue;
        }
        const colMatch = line.match(/^([a-z_]+)\s+[A-Z0-9_]+/);
        if (colMatch) {
            const col = colMatch[1];
            if (!['constraint', 'primary', 'foreign', 'unique', 'check', 'default'].includes(col)) {
                if (!tables[currentTable].includes(col)) {
                    tables[currentTable].push(col);
                }
            }
        }
    }
}

const codeWords = new Set();
function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            walkDir(fullPath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const words = content.match(/[a-zA-Z_0-9]+/g) || [];
            words.forEach(w => codeWords.add(w));
        }
    }
}

walkDir("src/lib");
walkDir("src/app"); 
walkDir("src/components");

const unusedColumns = {};
const perfectTables = [];

for (const [table, columns] of Object.entries(tables)) {
    const unused = [];
    for (const col of columns) {
        if (!codeWords.has(col)) {
            unused.push(col);
        }
    }
    if (unused.length > 0) {
        unusedColumns[table] = unused;
    } else {
        perfectTables.push(table);
    }
}

console.log("\n--- Unused DB Columns in Codebase ---");
let totalUnused = 0;
for (const [t, cols] of Object.entries(unusedColumns)) {
    console.log(`Table '${t}': Database column missing in code -> ${cols.join(', ')}`);
    totalUnused += cols.length;
}

if (totalUnused === 0) {
    console.log("SUCCESS: All database columns exist and are used in the codebase!");
}

console.log("\nTables where ALL columns are actively mapped:", perfectTables.join(', '));
