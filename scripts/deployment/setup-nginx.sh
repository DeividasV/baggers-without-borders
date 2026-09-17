#!/bin/bash
# =============================================================================
# BWB Climbing App - Nginx Setup Script
# =============================================================================
# Sets up or updates Nginx configuration for example.com
# Run on server: ./setup-nginx.sh
# =============================================================================

set -e

DOMAIN="example.com"
PORT=1345
NGINX_AVAILABLE="/etc/nginx/sites-available/${DOMAIN}"
NGINX_ENABLED="/etc/nginx/sites-enabled/${DOMAIN}"
UPLOADS_DIR="/srv/bwb/uploads"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    log_error "Please run as root (sudo ./setup-nginx.sh)"
    exit 1
fi

log_info "Setting up Nginx for ${DOMAIN}..."

# Backup existing configuration if it exists
if [ -f "$NGINX_AVAILABLE" ]; then
    log_info "Backing up existing configuration..."
    cp "$NGINX_AVAILABLE" "${NGINX_AVAILABLE}.backup.$(date +%Y%m%d-%H%M%S)"
fi

# Ensure uploads directory exists
mkdir -p "$UPLOADS_DIR"

# Check if SSL certificate exists
if [ ! -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
    log_warning "SSL certificate not found. Creating temporary HTTP-only config for certbot..."
    
    # Create a temporary HTTP-only config for certbot
    cat > "$NGINX_AVAILABLE" << 'TEMP_EOF'
server {
    listen 80;
    listen [::]:80;
    server_name DOMAIN_PLACEHOLDER;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 200 'Temporary - Setting up SSL';
        add_header Content-Type text/plain;
    }
}
TEMP_EOF
    
    # Replace placeholder with actual domain
    sed -i "s/DOMAIN_PLACEHOLDER/${DOMAIN}/g" "$NGINX_AVAILABLE"

    # Enable the site if not already enabled
    if [ ! -L "$NGINX_ENABLED" ]; then
        log_info "Enabling temporary site..."
        ln -s "$NGINX_AVAILABLE" "$NGINX_ENABLED"
    fi
    
    # Test and reload
    log_info "Testing temporary Nginx configuration..."
    if nginx -t; then
        systemctl reload nginx
        log_success "Temporary config loaded"
    else
        log_error "Nginx configuration test failed!"
        exit 1
    fi
    
    log_info "Running certbot to obtain SSL certificate..."
    if certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos --email admin@example.com --redirect; then
        log_success "SSL certificate obtained"
    else
        log_error "Failed to obtain SSL certificate"
        exit 1
    fi
fi

# Create full Nginx configuration with SSL
log_info "Creating full Nginx configuration with SSL..."
cat > "$NGINX_AVAILABLE" << EOF
# BWB Climbing App - Nginx Configuration
# Generated on $(date)

server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    # Redirect HTTP to HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }

    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN};

    # SSL configuration - will be managed by certbot
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Logging
    access_log /var/log/nginx/${DOMAIN}-access.log;
    error_log /var/log/nginx/${DOMAIN}-error.log;

    # Serve uploaded files directly from Nginx (better performance)
    location /uploads {
        alias ${UPLOADS_DIR};
        expires 30d;
        add_header Cache-Control "public, immutable";
        
        # Security: prevent execution of uploaded files
        location ~* \.(php|pl|py|jsp|asp|sh|cgi)$ {
            deny all;
        }
    }

    # Proxy to Next.js application
    location / {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # Next.js static files
    location /_next/static {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Favicon and static assets
    location ~* \.(ico|css|js|gif|jpeg|jpg|png|woff|woff2|ttf|svg|eot)$ {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        expires 30d;
        add_header Cache-Control "public";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    # Client body size limit (for file uploads)
    client_max_body_size 20M;
}
EOF

# Enable the site if not already enabled
if [ ! -L "$NGINX_ENABLED" ]; then
    log_info "Enabling site..."
    ln -s "$NGINX_AVAILABLE" "$NGINX_ENABLED"
fi

# Test configuration
log_info "Testing final Nginx configuration..."
if nginx -t; then
    log_success "Nginx configuration is valid"
    # Reload Nginx to apply changes
    log_info "Reloading Nginx..."
    systemctl reload nginx
    log_success "Nginx reloaded successfully"
else
    log_error "Nginx configuration has errors!"
    exit 1
fi

log_success "Nginx setup complete for ${DOMAIN}"
echo ""
echo -e "${BLUE}Configuration file:${NC} ${NGINX_AVAILABLE}"
echo -e "${BLUE}Uploads served from:${NC} ${UPLOADS_DIR}"
echo -e "${BLUE}Proxying to:${NC} http://127.0.0.1:${PORT}"
