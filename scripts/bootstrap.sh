#!/usr/bin/env bash
set -euo pipefail

# Bootstrap script for Hostinger VPS (Ubuntu 22.04)
# Installs Nginx, PHP 8.2, MySQL, Redis, Composer, Supervisor, UFW, Fail2Ban
# Run as root: sudo bash scripts/bootstrap.sh

PHP_VERSION=8.2
APP_DIR=/var/www/arbiter

echo "==> Updating system packages"
apt update && apt upgrade -y

echo "==> Optional: create 2GB swap if none exists"
if [ $(swapon --show | wc -l) -eq 0 ]; then
  fallocate -l 2G /swapfile || true
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> Install base utilities"
apt install -y software-properties-common ca-certificates apt-transport-https lsb-release gnupg curl wget unzip git build-essential

echo "==> Add PHP repository and install PHP ${PHP_VERSION} + extensions"
add-apt-repository ppa:ondrej/php -y
apt update
apt install -y php${PHP_VERSION} php${PHP_VERSION}-fpm php${PHP_VERSION}-cli php${PHP_VERSION}-mbstring php${PHP_VERSION}-xml php${PHP_VERSION}-zip php${PHP_VERSION}-curl php${PHP_VERSION}-gd php${PHP_VERSION}-mysql php${PHP_VERSION}-intl php${PHP_VERSION}-bcmath php${PHP_VERSION}-redis php${PHP_VERSION}-opcache

echo "==> Install Nginx, MySQL, Redis, Supervisor, UFW, Fail2Ban"
apt install -y nginx mysql-server redis-server supervisor ufw fail2ban

echo "==> Enable services"
systemctl enable --now nginx
systemctl enable --now php${PHP_VERSION}-fpm
systemctl enable --now redis-server
systemctl enable --now supervisor

echo "==> Install Composer"
php -r "copy('https://getcomposer.org/installer','composer-setup.php');"
php composer-setup.php --install-dir=/usr/local/bin --filename=composer
php -r "unlink('composer-setup.php');"

echo "==> Setup firewall (UFW)"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "==> Create application directory and set basic permissions"
mkdir -p ${APP_DIR}
chown -R deploy:deploy ${APP_DIR} || true

cat <<'EOF'
Bootstrap complete.
Next steps:
 - Edit /etc/nginx/sites-available/arbiter (you can use scripts/configs/nginx/arbiter)
 - Place that file at /etc/nginx/sites-available/arbiter and enable it
 - Add DB credentials to /var/www/arbiter/backend/.env
 - Run the deploy script after setting up the repo and SSH keys
EOF

exit 0
