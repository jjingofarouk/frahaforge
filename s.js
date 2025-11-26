// quick-db-mapper.js
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs-extra');

async function quickMapDatabase() {
  const dbPath = '/Users/mac/Library/Application Support/FrahaPharmacy/server/databases/pharmacy.db';
  
  if (!fs.existsSync(dbPath)) {
    console.error('❌ Database file not found');
    return;
  }

  const db = new sqlite3.Database(dbPath);
  
  try {
    // Get all tables
    const tables = await new Promise((resolve, reject) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    let output = `PHARMACY DATABASE STRUCTURE\n`;
    output += `Generated: ${new Date().toISOString()}\n`;
    output += `Database: ${dbPath}\n\n`;
    output += `========================================\n\n`;

    for (const table of tables) {
      output += `TABLE: ${table.name}\n`;
      output += `----------------------------------------\n`;

      // Get table structure
      const columns = await new Promise((resolve, reject) => {
        db.all(`PRAGMA table_info("${table.name}")`, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      // Get foreign keys
      const foreignKeys = await new Promise((resolve, reject) => {
        db.all(`PRAGMA foreign_key_list("${table.name}")`, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      // Get row count
      const count = await new Promise((resolve, reject) => {
        db.get(`SELECT COUNT(*) as count FROM "${table.name}"`, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      output += `Rows: ${count.count}\n\n`;
      
      // Columns
      output += `Columns:\n`;
      columns.forEach(col => {
        const pk = col.pk ? ' PRIMARY KEY' : '';
        const notnull = col.notnull ? ' NOT NULL' : '';
        const defaultValue = col.dflt_value ? ` DEFAULT ${col.dflt_value}` : '';
        output += `  ${col.name} ${col.type}${pk}${notnull}${defaultValue}\n`;
      });

      // Foreign Keys
      if (foreignKeys.length > 0) {
        output += `\nForeign Keys:\n`;
        foreignKeys.forEach(fk => {
          output += `  ${fk.from} → ${fk.table}.${fk.to}\n`;
        });
      }

      output += `\n========================================\n\n`;
    }

    await fs.writeFile('str.txt', output);
    console.log('✅ Database structure saved to str.txt');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    db.close();
  }
}

quickMapDatabase();