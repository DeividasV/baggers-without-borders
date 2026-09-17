#!/bin/bash
# Deploy Turnstile environment variables to production server
# Run this script to update production environment variables on bwb.example.com

set -e

echo "🚀 Deploying Turnstile environment variables to production server..."

# Production server details
SERVER="bwb.example.com"
SERVER_USER="your-server-user"  # Update this
ENV_FILE_PATH="/path/to/app/.env.production"  # Update this

# Cloudflare Turnstile keys - read from the environment, never hardcode.
# Usage: TURNSTILE_SITE_KEY=... TURNSTILE_SECRET_KEY=... ./deploy-turnstile-env.sh
SITE_KEY="${TURNSTILE_SITE_KEY:?Set TURNSTILE_SITE_KEY before running}"
SECRET_KEY="${TURNSTILE_SECRET_KEY:?Set TURNSTILE_SECRET_KEY before running}"

echo "📋 Instructions for updating production server:"
echo ""
echo "1. SSH into the production server:"
echo "   ssh ${SERVER_USER}@${SERVER}"
echo ""
echo "2. Navigate to the application directory and edit .env.production:"
echo "   cd /path/to/bwb-application"
echo "   nano .env.production"
echo ""
echo "3. Add or update these lines:"
echo "   NEXT_PUBLIC_TURNSTILE_SITE_KEY=${SITE_KEY}"
echo "   TURNSTILE_SECRET_KEY=${SECRET_KEY}"
echo ""
echo "4. Restart the application:"
echo "   # If using Docker:"
echo "   docker-compose restart"
echo ""
echo "   # If using PM2:"
echo "   pm2 restart bwb"
echo ""
echo "   # If using systemd:"
echo "   sudo systemctl restart bwb"
echo ""
echo "5. Verify Turnstile is working:"
echo "   - Visit https://bwb.example.com/login"
echo "   - Open browser DevTools > Network tab"
echo "   - Look for requests to challenges.cloudflare.com"
echo "   - Try logging in (should see Turnstile validation)"
echo ""
echo "6. Monitor logs for any Turnstile errors:"
echo "   # Docker logs:"
echo "   docker-compose logs -f app"
echo ""
echo "   # PM2 logs:"
echo "   pm2 logs bwb"
echo ""
echo "✅ Deployment checklist:"
echo "   [ ] SSH access to production server confirmed"
echo "   [ ] Environment variables added to .env.production"
echo "   [ ] Application restarted"
echo "   [ ] Turnstile widget visible on auth pages"
echo "   [ ] Test registration/login with bot protection"
echo "   [ ] Check Cloudflare Turnstile analytics dashboard"
echo "   [ ] Monitor application logs for errors"
echo ""
echo "⚠️  Security reminders:"
echo "   - Never commit .env.production to git"
echo "   - Verify domain is registered in Cloudflare Turnstile dashboard"
echo "   - Ensure HTTPS is enabled (required for Turnstile)"
echo "   - Monitor fail-open warnings in production logs"
echo ""
