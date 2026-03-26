#!/usr/bin/env bash
set -euo pipefail

# Prunebox Setup Script
# Generates required secrets and creates .env from .env.example

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env"
ENV_EXAMPLE="$PROJECT_DIR/.env.example"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

info()  { echo -e "${GREEN}[+]${NC} $*"; }
warn()  { echo -e "${YELLOW}[!]${NC} $*"; }
error() { echo -e "${RED}[!]${NC} $*"; }

# Check openssl is available
if ! command -v openssl &>/dev/null; then
    error "openssl is required but not installed. Please install openssl first."
    exit 1
fi

# Check .env.example exists
if [ ! -f "$ENV_EXAMPLE" ]; then
    error ".env.example not found at $ENV_EXAMPLE"
    exit 1
fi

# Don't overwrite existing .env
if [ -f "$ENV_FILE" ]; then
    warn ".env already exists at $ENV_FILE"
    read -rp "Overwrite? [y/N] " overwrite
    if [[ "$overwrite" != [yY] ]]; then
        info "Aborted. Your existing .env was not modified."
        exit 0
    fi
fi

info "Generating secrets..."

# Generate secrets (tr -d '\n' removes line wrapping from base64 output)
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')
NEXTAUTH_SECRET=$(openssl rand -base64 32 | tr -d '\n')
ENCRYPTION_KEY=$(openssl rand -base64 48 | tr -d '\n')
GMAIL_WEBHOOK_SECRET=$(openssl rand -base64 64 | tr -d '\n')

# Copy .env.example to .env
cp "$ENV_EXAMPLE" "$ENV_FILE"

# Replace placeholder values with generated secrets
# Using '#' as delimiter since base64 output only contains A-Za-z0-9+/=
sed -i "s#your-database-password-generate-with-openssl-rand-base64-32#$POSTGRES_PASSWORD#" "$ENV_FILE"
sed -i "s#your-secret-key-here-generate-with-openssl-rand-base64-32#$NEXTAUTH_SECRET#" "$ENV_FILE"
sed -i "s#your-32-character-encryption-key-for-refresh-tokens#$ENCRYPTION_KEY#" "$ENV_FILE"
sed -i "s#your-webhook-secret-here-generate-with-openssl-rand-base64-32#$GMAIL_WEBHOOK_SECRET#" "$ENV_FILE"

# Update DATABASE_URL with the generated password
sed -i "s#prunebox:prunebox@#prunebox:$POSTGRES_PASSWORD@#" "$ENV_FILE"

info "Secrets generated and written to .env"
echo ""

# Prompt for Google OAuth credentials
echo "--- Google OAuth Setup ---"
read -rp "Enter your GOOGLE_CLIENT_ID (or press Enter to skip): " client_id
read -rp "Enter your GOOGLE_CLIENT_SECRET (or press Enter to skip): " client_secret

if [ -n "$client_id" ]; then
    sed -i "s#your-google-client-id.apps.googleusercontent.com#$client_id#" "$ENV_FILE"
    info "GOOGLE_CLIENT_ID set"
else
    warn "GOOGLE_CLIENT_ID left as placeholder — set it manually in .env"
fi

if [ -n "$client_secret" ]; then
    sed -i "s#your-google-client-secret#$client_secret#" "$ENV_FILE"
    info "GOOGLE_CLIENT_SECRET set"
else
    warn "GOOGLE_CLIENT_SECRET left as placeholder — set it manually in .env"
fi

echo ""
info "Setup complete! Review .env and adjust values as needed:"
info "  $ENV_FILE"
echo ""
warn "Important:"
echo "  - Update NEXTAUTH_URL for production (e.g. https://yourdomain.com)"
echo "  - Update NEXT_PUBLIC_APP_URL to match"
echo "  - Update ROLLUP_FROM_EMAIL with your sending address"
echo "  - Add test users in Google Cloud Console (see README.md)"
