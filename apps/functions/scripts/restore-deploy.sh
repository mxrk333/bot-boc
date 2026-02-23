#!/bin/bash
# Post-deploy script: restores original package.json after deployment

if [ -f apps/functions/package.json.bak ]; then
  mv apps/functions/package.json.bak apps/functions/package.json
  echo "✅ Restored original package.json"
fi
