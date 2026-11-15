#!/usr/bin/env bash
# ==============================================================================
# SchoolKarma — Server Deployment & Release Runner
# Run this script on the production VPS to deploy or update SchoolKarma
# ==============================================================================
set -euo pipefail

TARGET_WEB_ROOT="/var/www/schoolkarma"
NGINX_CONF_SRC="deployment/schoolkarma-nginx.conf"
NGINX_CONF_DEST="/etc/nginx/sites-available/schoolkarma"
NGINX_CONF_LINK="/etc/nginx/sites-enabled/schoolkarma"
PM2_APP_NAME="schoolkarma-api"

echo "=========================================================="
echo "⚡ Starting SchoolKarma Production Deployment..."
echo "=========================================================="

# 1. Build all 10 surfaces
echo "──> [1/5] Building all frontend surfaces..."
bash deployment/build_all_surfaces.sh

# 2. Sync web artifacts to web root
echo "──> [2/5] Deploying web artifacts to $TARGET_WEB_ROOT..."
sudo mkdir -p "$TARGET_WEB_ROOT" "$TARGET_WEB_ROOT/uploads"
sudo rsync -av --delete deployment/artifacts/ "$TARGET_WEB_ROOT/"

# Explicitly assign full ownership to 'chandan' with 'www-data' group for seamless FileZilla SFTP uploads
sudo chown -R chandan:www-data "$TARGET_WEB_ROOT"
sudo find "$TARGET_WEB_ROOT" -type d -exec chmod 2775 {} +
sudo find "$TARGET_WEB_ROOT" -type f -exec chmod 0664 {} +

# 3. Configure Nginx
echo "──> [3/5] Installing Nginx configuration..."
sudo cp "$NGINX_CONF_SRC" "$NGINX_CONF_DEST"
sudo ln -sf "$NGINX_CONF_DEST" "$NGINX_CONF_LINK"

echo "──> Testing Nginx configuration..."
sudo nginx -t

echo "──> Reloading Nginx..."
sudo systemctl reload nginx

# 4. Backend Dependencies & Database Migrations
echo "──> [4/5] Preparing backend service..."
(
  cd backend
  npm ci --omit=dev || npm install --omit=dev
  if [ -f "scripts/run-migration.js" ]; then
    echo "──> Running database migrations..."
    node scripts/run-migration.js || echo "Notice: Check migration status."
  fi
)

# 5. PM2 Reload / Start for API & Next.js Web
echo "──> [5/5] Managing PM2 processes..."

# 5A. Express Backend API (Port 5006)
if pm2 list | grep -q "$PM2_APP_NAME"; then
  echo "──> Reloading Express API ($PM2_APP_NAME)..."
  pm2 reload "$PM2_APP_NAME" --update-env
else
  echo "──> Starting Express API ($PM2_APP_NAME)..."
  (
    cd backend
    pm2 start src/server.js --name "$PM2_APP_NAME"
  )
fi

# 5B. Next.js Main Web Platform (Port 3000)
PM2_WEB_NAME="schoolkarma-web"
if pm2 list | grep -q "$PM2_WEB_NAME"; then
  echo "──> Reloading Next.js Web ($PM2_WEB_NAME)..."
  pm2 reload "$PM2_WEB_NAME" --update-env
else
  echo "──> Starting Next.js Web ($PM2_WEB_NAME)..."
  (
    cd web/schoolkarma_web
    pm2 start npm --name "$PM2_WEB_NAME" -- start
  )
fi

pm2 save

echo
echo "=========================================================="
echo "🎉 Deployment Complete!"
echo "Main Platform:      https://schoolkarma.com"
echo "Super Admin:        https://schoolkarma.com/superadmin/"
echo "SPOC Public Portal: https://schoolkarma.com/spoc/"
echo "Tenant Subdomains:  https://<slug>.schoolkarma.com"
echo "API Endpoint:       https://schoolkarma.com/api"
echo "=========================================================="

