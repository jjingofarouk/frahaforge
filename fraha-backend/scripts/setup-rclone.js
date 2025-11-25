// scripts/setup-rclone.js
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const platform = os.platform();
const arch = os.arch();

const rcloneVersion = 'v1.68.1';
const baseUrl = `https://downloads.rclone.org/${rcloneVersion}`;

const binaries = {
  win32: `rclone-${rcloneVersion}-windows-amd64.zip`,
  darwin: `rclone-${rcloneVersion}-osx-${arch === 'arm64' ? 'arm64' : 'amd64'}.zip`,
  linux: `rclone-${rcloneVersion}-linux-amd64.zip`,
};

const current = binaries[platform];
if (!current) {
  console.log('rclone: Platform not supported yet');
  process.exit(0);
}

const binDir = path.join(__dirname, '../bin');
const rclonePath = path.join(binDir, platform === 'win32' ? 'rclone.exe' : 'rclone');

if (fs.existsSync(rclonePath)) {
  console.log('rclone already installed');
  process.exit(0);
}

console.log('Downloading rclone for backup system...');
fs.ensureDirSync(binDir);

try {
  const zipPath = path.join(binDir, 'rclone.zip');
  execSync(`curl -L ${baseUrl}/${current} -o "${zipPath}"`, { stdio: 'inherit' });

  if (platform === 'win32') {
    execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${binDir}' -Force"`);
  } else {
    execSync(`unzip -o "${zipPath}" -d "${binDir}"`);
  }

  const extractedDir = fs.readdirSync(binDir).find(d => d.includes('rclone'));
  if (extractedDir) {
    const oldPath = path.join(binDir, extractedDir, platform === 'win32' ? 'rclone.exe' : 'rclone');
    fs.moveSync(oldPath, rclonePath, { overwrite: true });
    fs.removeSync(path.join(binDir, extractedDir));
  }

  fs.chmodSync(rclonePath, '755');
  fs.removeSync(zipPath);
  console.log('rclone installed successfully for encrypted Google Drive backup');
} catch (err) {
  console.error('Failed to install rclone. Backups will be disabled.', err.message);
}