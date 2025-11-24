"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.database = void 0;
// backend-server/src/database/database.ts
const sqlite3_1 = __importDefault(require("sqlite3"));
const fs_extra_1 = __importDefault(require("fs-extra"));
class PharmacyDatabase {
    constructor() {
        // Use your existing database path
        this.dbPath = '/Users/mac/Library/Application Support/FrahaPharmacy/server/databases/pharmacy.db';
        // Verify database exists
        if (!fs_extra_1.default.existsSync(this.dbPath)) {
            throw new Error(`Database file not found at: ${this.dbPath}`);
        }
        this.db = new sqlite3_1.default.Database(this.dbPath, (err) => {
            if (err) {
                console.error('❌ Database connection failed:', err);
                throw err;
            }
            console.log('✅ Connected to existing SQLite database with all your data');
            // Verify we can read from database
            this.verifyConnection();
        });
    }
    async verifyConnection() {
        try {
            const tables = await this.dbAll("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
            console.log(`📊 Found ${tables.length} tables in database`);
            // Show data counts
            const productCount = await this.dbGet("SELECT COUNT(*) as count FROM products");
            const customerCount = await this.dbGet("SELECT COUNT(*) as count FROM customers");
            console.log(`📦 Products: ${productCount.count}, 👥 Customers: ${customerCount.count}`);
        }
        catch (error) {
            console.error('❌ Database verification failed:', error);
            throw error;
        }
    }
    // Helper methods
    dbRun(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err)
                    reject(err);
                else
                    resolve({ changes: this.changes, lastID: this.lastID });
            });
        });
    }
    dbAll(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err)
                    reject(err);
                else
                    resolve(rows);
            });
        });
    }
    dbGet(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err)
                    reject(err);
                else
                    resolve(row);
            });
        });
    }
    static getInstance() {
        if (!PharmacyDatabase.instance) {
            PharmacyDatabase.instance = new PharmacyDatabase();
        }
        return PharmacyDatabase.instance;
    }
    getDatabase() {
        return this.db;
    }
}
exports.default = PharmacyDatabase;
exports.database = PharmacyDatabase.getInstance();
