"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../database/database");
const router = express_1.default.Router();
// Use the shared database instance
const db = database_1.database.getDatabase();
// Helper functions using the shared database
const dbAll = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
};
const dbGet = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err)
                reject(err);
            else
                resolve(row);
        });
    });
};
const dbRun = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err)
                reject(err);
            else
                resolve({ changes: this.changes, lastID: this.lastID });
        });
    });
};
router.get('/', (req, res) => {
    res.send('Category API');
});
router.get('/all', async (req, res) => {
    try {
        const docs = await dbAll('SELECT * FROM categories ORDER BY name');
        res.send(docs);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An unexpected error occurred.'
        });
    }
});
router.post('/category', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name)
            return res.status(400).json({ error: 'Name required' });
        const result = await dbRun('INSERT INTO categories (name) VALUES (?)', [name]);
        res.json({ id: result.lastID, name });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create category' });
    }
});
router.delete('/category/:categoryId', async (req, res) => {
    try {
        const result = await dbRun('DELETE FROM categories WHERE id = ?', [parseInt(req.params.categoryId)]);
        if (result.changes === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Category not found'
            });
        }
        res.sendStatus(200);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An unexpected error occurred.'
        });
    }
});
router.put('/category', async (req, res) => {
    try {
        const result = await dbRun('UPDATE categories SET name = ? WHERE id = ?', [req.body.name, parseInt(req.body.id)]);
        if (result.changes === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Category not found'
            });
        }
        res.sendStatus(200);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An unexpected error occurred.'
        });
    }
});
exports.default = router;
