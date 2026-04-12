#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Starting deployment..."

PROJECT_DIR="/var/www/arbiter"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_BUILD_DIR="$PROJECT_DIR/frontend/public"

cd "$PROJECT_DIR"

echo "📥 Fetching latest code..."
git fetch origin

# Detect correct branch (main or master)
BRANCH="main"
if ! git show-ref --verify --quiet refs/remotes/origin/$BRANCH; then
  BRANCH="master"
fi

echo "🔀 Using branch: $BRANCH"
git reset --hard origin/$BRANCH

echo "📦 Installing backend dependencies..."

cd "$BACKEND_DIR"

# Ensure required PHP extensions exist (prevents Composer crash)
#REQUIRED_EXT=("curl" "dom" "mbstring" "xml")
#for ext in "${REQUIRED_EXT[@]}"; do
#  if ! php -m | grep -q "$ext"; then
#    echo "❌ Missing PHP extension: $ext"
#    exit 1
#  fi
#done

# Clean broken installs safely
if [ -d "vendor" ]; then
  echo "🧹 Cleaning old vendor..."
  rm -rf vendor
fi

composer install --no-dev --optimize-autoloader

echo "⚙️ Running Laravel optimizations..."

php artisan config:clear || true
php artisan cache:clear || true
php artisan route:clear || true

php artisan config:cache
php artisan route:cache

echo "🗄️ Running migrations..."
php artisan migrate --force

echo "🔐 Fixing permissions..."

sudo chown -R www-data:www-data "$PROJECT_DIR"
sudo chmod -R 755 "$PROJECT_DIR"
sudo chmod -R 775 "$BACKEND_DIR/storage" "$BACKEND_DIR/bootstrap/cache"

echo "🌐 Reloading services..."

sudo systemctl restart php8.4-fpm
sudo systemctl restart nginx

echo "✅ Deployment successful!"
