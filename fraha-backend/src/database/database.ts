// backend-server/src/database/database.ts
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs-extra';

class PharmacyDatabase {
  private static instance: PharmacyDatabase;
  private db: sqlite3.Database;
  private dbPath: string;

  private constructor() {
    // Use your existing database path
    this.dbPath = '/Users/mac/Library/Application Support/FrahaPharmacy/server/databases/pharmacy.db';
    
    // Verify database exists
    if (!fs.existsSync(this.dbPath)) {
      throw new Error(`Database file not found at: ${this.dbPath}`);
    }

    this.db = new sqlite3.Database(this.dbPath, (err) => {
      if (err) {
        console.error('❌ Database connection failed:', err);
        throw err;
      }
      console.log('✅ Connected to existing SQLite database with all your data');
      
      // Verify we can read from database
      this.verifyConnection();
    });
  }

  private async verifyConnection(): Promise<void> {
    try {
      const tables = await this.dbAll(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
      );
      
      console.log(`📊 Found ${tables.length} tables in database`);
      
      // Show data counts
      const productCount = await this.dbGet("SELECT COUNT(*) as count FROM products");
      const customerCount = await this.dbGet("SELECT COUNT(*) as count FROM customers");
      
      console.log(`📦 Products: ${productCount.count}, 👥 Customers: ${customerCount.count}`);
      
    } catch (error) {
      console.error('❌ Database verification failed:', error);
      throw error;
    }
  }

  // Helper methods
  public dbRun(sql: string, params: any[] = []): Promise<{ changes: number; lastID: number }> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes, lastID: this.lastID });
      });
    });
  }

  public dbAll(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  public dbGet(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  public static getInstance(): PharmacyDatabase {
    if (!PharmacyDatabase.instance) {
      PharmacyDatabase.instance = new PharmacyDatabase();
    }
    return PharmacyDatabase.instance;
  }

  public getDatabase(): sqlite3.Database {
    return this.db;
  }
}

export default PharmacyDatabase;
export const database = PharmacyDatabase.getInstance();