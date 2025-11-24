// save-database-structure.js
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Use the same database path from your existing code
const dbPath = '/Users/mac/Library/Application Support/FrahaPharmacy/server/databases/pharmacy.db';
const outputFile = 'database-structure.txt';

// Create database connection
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err.message);
    return;
  }
  console.log('✅ Connected to the SQLite database.');
});

async function saveDatabaseStructure() {
  let output = '';
  const timestamp = new Date().toLocaleString();
  
  output += `DATABASE STRUCTURE REPORT\n`;
  output += `Generated: ${timestamp}\n`;
  output += `Database: ${dbPath}\n`;
  output += '='.repeat(80) + '\n\n';

  try {
    // Get all table names
    const tables = await new Promise((resolve, reject) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    output += `TOTAL TABLES: ${tables.length}\n\n`;

    for (const table of tables) {
      const tableName = table.name;
      
      // Skip sqlite system tables
      if (tableName.startsWith('sqlite_')) continue;
      
      output += `TABLE: ${tableName}\n`;
      output += '-'.repeat(60) + '\n';

      // Get table schema
      const schema = await new Promise((resolve, reject) => {
        db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      // Display column information
      output += 'COLUMNS:\n';
      schema.forEach(col => {
        const pk = col.pk ? ' PRIMARY KEY' : '';
        const notnull = col.notnull ? ' NOT NULL' : '';
        const dflt_value = col.dflt_value ? ` DEFAULT ${col.dflt_value}` : '';
        output += `  ${col.name} | ${col.type}${pk}${notnull}${dflt_value}\n`;
      });
      output += '\n';

      // Get row count
      const count = await new Promise((resolve, reject) => {
        db.get(`SELECT COUNT(*) as count FROM ${tableName}`, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      output += `ROW COUNT: ${count.count}\n\n`;

      // Get index information for this table
      const indexes = await new Promise((resolve, reject) => {
        db.all(`PRAGMA index_list(${tableName})`, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      if (indexes.length > 0) {
        output += 'INDEXES:\n';
        for (const index of indexes) {
          if (index.name.startsWith('sqlite_')) continue;
          
          const indexInfo = await new Promise((resolve, reject) => {
            db.all(`PRAGMA index_info(${index.name})`, (err, rows) => {
              if (err) reject(err);
              else resolve(rows);
            });
          });

          const unique = index.unique ? 'UNIQUE ' : '';
          const columns = indexInfo.map(info => info.name).join(', ');
          output += `  ${unique}INDEX: ${index.name} (${columns})\n`;
        }
        output += '\n';
      }

      // Get foreign keys
      const foreignKeys = await new Promise((resolve, reject) => {
        db.all(`PRAGMA foreign_key_list(${tableName})`, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      if (foreignKeys.length > 0) {
        output += 'FOREIGN KEYS:\n';
        foreignKeys.forEach(fk => {
          output += `  ${fk.from} → ${fk.table}.${fk.to} (ON UPDATE: ${fk.on_update}, ON DELETE: ${fk.on_delete})\n`;
        });
        output += '\n';
      }

      // Show first few rows as sample
      if (count.count > 0) {
        const sampleRows = await new Promise((resolve, reject) => {
          db.all(`SELECT * FROM ${tableName} LIMIT 5`, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          });
        });

        output += `SAMPLE DATA (first 5 of ${count.count} rows):\n`;
        if (sampleRows.length > 0) {
          // Get column names for header
          const columns = Object.keys(sampleRows[0]);
          output += `  ${columns.join(' | ')}\n`;
          output += `  ${'-'.repeat(columns.join(' | ').length)}\n`;
          
          sampleRows.forEach(row => {
            const values = columns.map(col => {
              const value = row[col];
              return value !== null && value !== undefined ? value.toString() : 'NULL';
            });
            output += `  ${values.join(' | ')}\n`;
          });
        }
      }

      output += '\n' + '='.repeat(80) + '\n\n';
    }

    // Get database info
    const dbInfo = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM sqlite_master WHERE type='table' LIMIT 1", (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    output += `DATABASE SUMMARY:\n`;
    output += `- Total tables: ${tables.filter(t => !t.name.startsWith('sqlite_')).length}\n`;
    
    // Count total rows
    let totalRows = 0;
    for (const table of tables) {
      if (table.name.startsWith('sqlite_')) continue;
      const count = await new Promise((resolve, reject) => {
        db.get(`SELECT COUNT(*) as count FROM ${table.name}`, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      totalRows += count.count;
    }
    output += `- Total rows across all tables: ${totalRows}\n`;
    output += `- File size: ${fs.existsSync(dbPath) ? (fs.statSync(dbPath).size / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown'}\n`;

    // Save to file
    fs.writeFileSync(outputFile, output, 'utf8');
    console.log(`✅ Database structure saved to: ${outputFile}`);
    console.log(`📊 Total tables documented: ${tables.filter(t => !t.name.startsWith('sqlite_')).length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Close database connection
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err.message);
      } else {
        console.log('✅ Database connection closed.');
      }
    });
  }
}

// Run the function
saveDatabaseStructure();