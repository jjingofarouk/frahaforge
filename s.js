// add-supplier-columns.js
const sqlite3 = require('sqlite3').verbose();

const dbPath = '/Users/mac/Library/Application Support/FrahaPharmacy/server/databases/pharmacy.db';

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err.message);
    return;
  }
  console.log('✅ Connected to the pharmacy database');
});

async function addSupplierColumns() {
  try {
    console.log('\n🔧 Starting safe database migration...\n');

    // Begin transaction for safety
    await runQuery('BEGIN TRANSACTION');

    // Add new columns with DEFAULT NULL to avoid breaking existing data
    const columnsToAdd = [
      'phone_number TEXT DEFAULT NULL',
      'email TEXT DEFAULT NULL', 
      'address TEXT DEFAULT NULL',
      'contact_person TEXT DEFAULT NULL'
    ];

    for (const columnDef of columnsToAdd) {
      const columnName = columnDef.split(' ')[0];
      
      // Check if column already exists (safety check)
      const existingColumns = await runQuery("PRAGMA table_info(suppliers)");
      const columnExists = existingColumns.some(col => col.name === columnName);
      
      if (columnExists) {
        console.log(`⚠️  Column '${columnName}' already exists, skipping...`);
        continue;
      }

      console.log(`➕ Adding column: ${columnDef}`);
      await runQuery(`ALTER TABLE suppliers ADD COLUMN ${columnDef}`);
    }

    // Commit the transaction
    await runQuery('COMMIT');
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Updated supplier table structure:');
    
    // Show the new structure
    const columns = await runQuery("PRAGMA table_info(suppliers)");
    columns.forEach(col => {
      console.log(`  ${col.name} | ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
    });

  } catch (error) {
    // Rollback on error
    await runQuery('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    db.close();
    console.log('\n✅ Database connection closed');
  }
}

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Run the migration
addSupplierColumns().catch(console.error);