#!/usr/bin/env bash
set -euo pipefail

# Deploy script (assumes CI uploads frontend build to /var/www/arbiter/frontend_build)
APP_DIR=/var/www/arbiter

echo "==> Deploy starting: $(date)"
cd ${APP_DIR}

echo "==> Fetching latest code"
git fetch --all
git reset --hard origin/master

echo "==> Backend: install composer deps and migrate"
cd ${APP_DIR}/backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "==> Frontend: copy built assets (if present)"
if [ -d "${APP_DIR}/frontend_build" ]; then
  rm -rf ${APP_DIR}/backend/public/* || true
  cp -r ${APP_DIR}/frontend_build/* ${APP_DIR}/backend/public/
fi

echo "==> Set permissions"
chown -R www-data:www-data ${APP_DIR}/backend

echo "==> Restarting workers and reloading Nginx"
supervisorctl restart laravel-worker || true
systemctl reload nginx || true

echo "==> Deploy finished: $(date)"

exit 0
