#!/bin/bash
set -e

echo "🎵 Deploying Resonant..."

# Variables
APP_DIR="/var/www/resonant"
REPO_DIR="/root/Projects/Resonant"

# Install dependencies
echo "📦 Installing dependencies..."
cd $REPO_DIR
npm install

# Build client
echo "🔨 Building frontend..."
cd $REPO_DIR/client
npm run build

# Build server
echo "🔨 Building backend..."
cd $REPO_DIR/server
npm run build

# Copy to deployment directory
echo "📁 Copying files..."
sudo mkdir -p $APP_DIR
sudo cp -r $REPO_DIR/client/dist $APP_DIR/client/
sudo cp -r $REPO_DIR/server/dist $APP_DIR/server/
sudo cp -r $REPO_DIR/server/node_modules $APP_DIR/server/
sudo cp $REPO_DIR/server/package.json $APP_DIR/server/
sudo cp $REPO_DIR/server/.env.production $APP_DIR/server/.env
sudo mkdir -p $APP_DIR/uploads
sudo chown -R www-data:www-data $APP_DIR/uploads

# Generate Prisma client in production
cd $APP_DIR/server
npx prisma generate

# Setup systemd service
echo "⚙️ Setting up systemd service..."
sudo tee /etc/systemd/system/resonant.service > /dev/null <<EOF
[Unit]
Description=Resonant Music Player API
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=$APP_DIR/server
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Reload and start service
sudo systemctl daemon-reload
sudo systemctl enable resonant
sudo systemctl restart resonant

# Setup nginx
echo "🌐 Configuring nginx..."
sudo cp $REPO_DIR/nginx.conf /etc/nginx/sites-available/resonant
sudo ln -sf /etc/nginx/sites-available/resonant /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Point DNS: music.bipro.tech -> your server IP"
echo "2. Get SSL: sudo certbot --nginx -d music.bipro.tech"
echo "3. Add YouTube API key to $APP_DIR/server/.env"
