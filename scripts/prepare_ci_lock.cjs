// Ignore mirror URLs in CI while preserving locked versions and integrity hashes.
const fs = require('node:fs');
const path = require('node:path');
const lockPath = path.join(__dirname, '..', 'package-lock.json');
const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
for (const pkg of Object.values(lock.packages)) {
  delete pkg.resolved;
}
fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n');
