// src/backup/google-drive-backup.ts
import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import os from 'os';
import crypto from 'crypto';

// ──────────────────────────────────────────────────────────────
// Paths & Config
// ──────────────────────────────────────────────────────────────
const RCLONE_BIN = path.join(
  __dirname,
  '../../bin',
  process.platform === 'win32' ? 'rclone.exe' : 'rclone'
);

// Your real database path (from PharmacyDatabase class)
const DB_PATH = '/Users/mac/Library/Application Support/FrahaPharmacy/server/databases/pharmacy.db';

// THIS IS THE ONLY LINE YOU NEEDED TO CHANGE
const ENCRYPTED_REMOTE = 'fraha:'; // ← You named it "fraha" during setup

const getEncryptionPassword = (): string => {
  const machineId = require('node-machine-id').original || os.hostname() || 'fallback';
  return crypto.createHash('sha256')
    .update(`FrahaPharmacySecret2025_${machineId}`)
    .digest('hex');
};

// ──────────────────────────────────────────────────────────────
// Main backup function
// ──────────────────────────────────────────────────────────────
export async function createEncryptedBackup(): Promise<void> {
  if (!fs.existsSync(DB_PATH)) {
    console.log('Database file not found at:', DB_PATH);
    console.log('Backup skipped.');
    return;
  }

  if (!fs.existsSync(RCLONE_BIN)) {
    console.log('rclone binary missing – backup disabled.');
    return;
  }

  try {
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const backupName = `pharmacy-${timestamp}.db.enc`;
    const tempCopy = path.join(os.tmpdir(), `temp-backup-${Date.now()}.db`);

    console.log('Creating encrypted Google Drive backup...');

    // 1. Safe copy of the live DB
    fs.copyFileSync(DB_PATH, tempCopy);

    // 2. Encrypt + upload using the correct remote name "fraha:"
    const password = getEncryptionPassword();
    const rcloneConf = path.join(os.homedir(), '.config/rclone/rclone.conf');

    execSync(
      `"${RCLONE_BIN}" --config "${rcloneConf}" copy "${tempCopy}" "${ENCRYPTED_REMOTE}${backupName}" ` +
      `--crypt-remote="${ENCRYPTED_REMOTE}" ` +
      `--crypt-password="${password}" ` +
      `--crypt-filename-encryption=standard ` +
      `--progress --transfers=1`,
      { stdio: 'ignore' }
    );

    // Cleanup temp file
    fs.removeSync(tempCopy);
    console.log(`Backup uploaded successfully: ${backupName} (encrypted)`);

    // Optional: Keep only last 30 backups
    try {
      const list = execSync(
        `"${RCLONE_BIN}" --config "${rcloneConf}" ls "${ENCRYPTED_REMOTE}" ` +
        `--crypt-remote="${ENCRYPTED_REMOTE}" --crypt-password="${password}"`,
        { encoding: 'utf8' }
      );

      const files = list.trim()
        .split('\n')
        .map(l => l.trim().split(/\s+/).pop())
        .filter(Boolean)
        .filter(f => f && !f.includes(timestamp))
        .slice(0, -30);

      files.forEach(f => {
        execSync(
          `"${RCLONE_BIN}" --config "${rcloneConf}" delete "${ENCRYPTED_REMOTE}${f}" ` +
          `--crypt-remote="${ENCRYPTED_REMOTE}" --crypt-password="${password}"`,
          { stdio: 'ignore' }
        );
      });
    } catch (_) { /* ignore */ }

  } catch (err: any) {
    console.error('Backup failed:', err.message || err);
  }
}

// ──────────────────────────────────────────────────────────────
// First-time Google Drive setup (runs only once)
// ──────────────────────────────────────────────────────────────
export function setupGoogleDriveOnce() {
  const configPath = path.join(os.homedir(), '.config/rclone/rclone.conf');
  if (fs.existsSync(configPath)) {
    console.log('Google Drive already configured. Skipping setup.');
    return;
  }

  console.log('\nFIRST-TIME GOOGLE DRIVE SETUP (30 seconds only)');
  console.log('─────────────────────────────────────────────────────');
  console.log('We will now connect your personal Google Drive for encrypted backups.');
  console.log('This happens only once. Press Enter to continue...');

  require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  }).question('', () => {
    try {
      execSync(`"${RCLONE_BIN}" config`, { stdio: 'inherit' });
      console.log('Google Drive connected successfully!');
      console.log('Creating first encrypted backup now...');
      createEncryptedBackup();
    } catch (e) {
      console.log('Setup cancelled or failed. Backups disabled until you run:');
      console.log(`    "${RCLONE_BIN}" config`);
    }
  });
}