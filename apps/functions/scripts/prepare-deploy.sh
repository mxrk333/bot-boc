#!/bin/bash
# Pre-deploy script: builds using pnpm workspace, then strips workspace:* references
# from package.json so Cloud Build (npm) can install deps without errors.

set -e

# 1. Build using pnpm (can resolve workspace:* locally)
pnpm --filter @repo/functions run build

# 2. Backup original package.json
cp apps/functions/package.json apps/functions/package.json.bak

# 3. Strip workspace:* entries from devDependencies (Cloud Build doesn't need them)
node -e "
const pkg = require('./apps/functions/package.json');
// Remove any devDependency that uses workspace protocol
if (pkg.devDependencies) {
  for (const [key, value] of Object.entries(pkg.devDependencies)) {
    if (typeof value === 'string' && value.startsWith('workspace:')) {
      delete pkg.devDependencies[key];
    }
  }
}
// Remove any dependency that uses workspace protocol (already bundled by esbuild)
if (pkg.dependencies) {
  for (const [key, value] of Object.entries(pkg.dependencies)) {
    if (typeof value === 'string' && value.startsWith('workspace:')) {
      delete pkg.dependencies[key];
    }
  }
}
require('fs').writeFileSync('./apps/functions/package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('✅ Stripped workspace:* references from package.json for deployment');
"
