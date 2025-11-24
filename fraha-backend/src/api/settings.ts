import express, { Request, Response } from 'express';
import { database } from '../database/database';

const router = express.Router();

// Use the shared database instance
const db = database.getDatabase();

// Database helpers
const dbAll = (sql: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbGet = (sql: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbRun = (sql: string, params: any[] = []): Promise<{ changes: number; lastID: number }> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ changes: this.changes, lastID: this.lastID });
    });
  });
};

// Check if column exists in table
const checkColumnExists = async (table: string, column: string): Promise<boolean> => {
  try {
    const columns = await dbAll(`PRAGMA table_info(${table})`);
    return columns.some((col: any) => col.name === column);
  } catch (error) {
    console.error(`Error checking column ${column}:`, error);
    return false;
  }
};

// Interfaces
interface NetworkSettings {
  mode: 'standalone' | 'terminal' | 'server';
  server_ip: string;
  till_number: string;
  terminal_id: string;
  port: number;
  is_active: boolean;
  last_sync: string;
}

interface SettingsRow {
  id: number;
  network_settings?: string;
  // These columns might not exist in your current schema
  created_at?: string;
  updated_at?: string;
}

// === GET NETWORK SETTINGS ===
router.get('/network', async (req: Request, res: Response) => {
  try {
    const settings = await dbGet('SELECT * FROM settings WHERE id = 1') as SettingsRow;
    
    if (!settings) {
      // Return default network settings
      return res.json({
        success: true,
        settings: {
          mode: 'server', // Default to server now
          server_ip: 'localhost',
          till_number: '1',
          terminal_id: `terminal_${Date.now()}`,
          port: 3000,
          is_active: true,
          last_sync: new Date().toISOString()
        }
      });
    }

    if (!settings.network_settings) {
      // Return default if no network settings exist
      return res.json({
        success: true,
        settings: {
          mode: 'server',
          server_ip: 'localhost',
          till_number: '1',
          terminal_id: `terminal_${Date.now()}`,
          port: 3000,
          is_active: true,
          last_sync: new Date().toISOString()
        }
      });
    }

    const networkSettings = JSON.parse(settings.network_settings);
    res.json({ success: true, settings: networkSettings });
  } catch (err: any) {
    console.error('GET /settings/network error:', err.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch network settings',
      message: err.message 
    });
  }
});

// === SAVE NETWORK SETTINGS ===
router.post('/network', async (req: Request, res: Response) => {
  try {
    const { mode, server_ip, till_number, terminal_id, port } = req.body;

    // Validate required fields
    if (!mode || !till_number || !terminal_id || !port) {
      return res.status(400).json({ 
        success: false, 
        error: 'Bad Request', 
        message: 'Missing required fields: mode, till_number, terminal_id, port' 
      });
    }

    // Validate mode
    if (!['standalone', 'terminal', 'server'].includes(mode)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Bad Request', 
        message: 'Invalid mode. Must be: standalone, terminal, or server' 
      });
    }

    const networkSettings: NetworkSettings = {
      mode,
      server_ip: server_ip || 'localhost',
      till_number,
      terminal_id,
      port: parseInt(port) || 3000,
      is_active: true,
      last_sync: new Date().toISOString()
    };

    // Check if settings exist and what columns are available
    const existing = await dbGet('SELECT id FROM settings WHERE id = 1') as SettingsRow;
    const hasUpdatedAt = await checkColumnExists('settings', 'updated_at');
    const hasCreatedAt = await checkColumnExists('settings', 'created_at');

    if (existing) {
      // Update existing settings - use dynamic SQL based on available columns
      if (hasUpdatedAt) {
        await dbRun(
          `UPDATE settings SET 
           network_settings = ?,
           updated_at = CURRENT_TIMESTAMP
           WHERE id = 1`,
          [JSON.stringify(networkSettings)]
        );
      } else {
        // Fallback without updated_at column
        await dbRun(
          `UPDATE settings SET network_settings = ? WHERE id = 1`,
          [JSON.stringify(networkSettings)]
        );
      }
    } else {
      // Insert new settings - use dynamic SQL based on available columns
      if (hasCreatedAt && hasUpdatedAt) {
        await dbRun(
          `INSERT INTO settings (id, network_settings, created_at, updated_at)
           VALUES (1, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [JSON.stringify(networkSettings)]
        );
      } else if (hasCreatedAt) {
        await dbRun(
          `INSERT INTO settings (id, network_settings, created_at)
           VALUES (1, ?, CURRENT_TIMESTAMP)`,
          [JSON.stringify(networkSettings)]
        );
      } else {
        // Minimal insert without timestamp columns
        await dbRun(
          `INSERT INTO settings (id, network_settings)
           VALUES (1, ?)`,
          [JSON.stringify(networkSettings)]
        );
      }
    }

    console.log(`✅ Network settings saved: ${mode} mode, Till ${till_number}, Terminal ${terminal_id}`);
    
    res.json({ 
      success: true, 
      message: 'Network settings saved successfully',
      settings: networkSettings 
    });

  } catch (err: any) {
    console.error('POST /settings/network error:', err.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save network settings',
      message: err.message 
    });
  }
});

// === GET ALL TERMINALS CONFIG ===
router.get('/terminals', async (req: Request, res: Response) => {
  try {
    const settings = await dbGet('SELECT network_settings FROM settings WHERE id = 1') as SettingsRow;
    
    if (!settings || !settings.network_settings) {
      return res.json({ success: true, terminals: [] });
    }

    const networkSettings = JSON.parse(settings.network_settings);
    
    // In a multi-terminal setup, this would return all terminals
    // For now, return the current terminal config
    res.json({ 
      success: true, 
      terminals: [networkSettings] 
    });

  } catch (err: any) {
    console.error('GET /settings/terminals error:', err.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch terminals config',
      message: err.message 
    });
  }
});

// === HEALTH CHECK FOR SERVER CONNECTION ===
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Check database connection
    await dbGet('SELECT 1 as health_check');
    
    res.json({ 
      success: true, 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Pharmacy POS Server'
    });
  } catch (err: any) {
    console.error('Health check failed:', err.message);
    res.status(500).json({ 
      success: false, 
      status: 'unhealthy',
      error: 'Database connection failed',
      message: err.message 
    });
  }
});

// === ACTIVATE/DEACTIVATE TERMINAL ===
router.post('/terminal/activate', async (req: Request, res: Response) => {
  try {
    const { terminal_id, is_active } = req.body;

    if (!terminal_id || typeof is_active !== 'boolean') {
      return res.status(400).json({ 
        success: false, 
        error: 'Bad Request', 
        message: 'Missing terminal_id or is_active' 
      });
    }

    const settings = await dbGet('SELECT network_settings FROM settings WHERE id = 1') as SettingsRow;
    
    if (!settings || !settings.network_settings) {
      return res.status(404).json({ 
        success: false, 
        error: 'Not Found', 
        message: 'Network settings not found' 
      });
    }

    const networkSettings = JSON.parse(settings.network_settings);
    
    // Update activation status
    networkSettings.is_active = is_active;
    networkSettings.last_sync = new Date().toISOString();

    const hasUpdatedAt = await checkColumnExists('settings', 'updated_at');

    if (hasUpdatedAt) {
      await dbRun(
        `UPDATE settings SET 
         network_settings = ?,
         updated_at = CURRENT_TIMESTAMP
         WHERE id = 1`,
        [JSON.stringify(networkSettings)]
      );
    } else {
      await dbRun(
        `UPDATE settings SET network_settings = ? WHERE id = 1`,
        [JSON.stringify(networkSettings)]
      );
    }

    console.log(`🔧 Terminal ${terminal_id} ${is_active ? 'activated' : 'deactivated'}`);
    
    res.json({ 
      success: true, 
      message: `Terminal ${terminal_id} ${is_active ? 'activated' : 'deactivated'}`,
      is_active 
    });

  } catch (err: any) {
    console.error('POST /settings/terminal/activate error:', err.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update terminal status',
      message: err.message 
    });
  }
});

// === UPDATE SERVER SYNC TIMESTAMP ===
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const settings = await dbGet('SELECT network_settings FROM settings WHERE id = 1') as SettingsRow;
    
    if (!settings || !settings.network_settings) {
      return res.status(404).json({ 
        success: false, 
        error: 'Not Found', 
        message: 'Network settings not found' 
      });
    }

    const networkSettings = JSON.parse(settings.network_settings);
    networkSettings.last_sync = new Date().toISOString();

    const hasUpdatedAt = await checkColumnExists('settings', 'updated_at');

    if (hasUpdatedAt) {
      await dbRun(
        `UPDATE settings SET 
         network_settings = ?,
         updated_at = CURRENT_TIMESTAMP
         WHERE id = 1`,
        [JSON.stringify(networkSettings)]
      );
    } else {
      await dbRun(
        `UPDATE settings SET network_settings = ? WHERE id = 1`,
        [JSON.stringify(networkSettings)]
      );
    }

    res.json({ 
      success: true, 
      message: 'Sync timestamp updated',
      last_sync: networkSettings.last_sync 
    });

  } catch (err: any) {
    console.error('POST /settings/sync error:', err.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update sync timestamp',
      message: err.message 
    });
  }
});

// === GET DATABASE SCHEMA INFO ===
router.get('/schema-info', async (req: Request, res: Response) => {
  try {
    const columns = await dbAll("PRAGMA table_info(settings)");
    
    res.json({
      success: true,
      table: 'settings',
      columns: columns.map((col: any) => ({
        name: col.name,
        type: col.type,
        notnull: col.notnull,
        defaultValue: col.dflt_value,
        primaryKey: col.pk
      }))
    });
  } catch (err: any) {
    console.error('GET /settings/schema-info error:', err.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get schema info',
      message: err.message 
    });
  }
});

export default router;