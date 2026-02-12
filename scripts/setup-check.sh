#!/bin/bash

# =============================================================================
# PRUNEBOX OAUTH SETUP VERIFICATION SCRIPT
# =============================================================================
# This script helps verify that your Google OAuth setup is correctly configured
# and identifies common configuration issues.
#
# Usage: ./scripts/setup-check.sh
# =============================================================================

# Don't exit on error - we want to show all issues
set +e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Header
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  PRUNEBOX OAUTH SETUP VERIFICATION${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo -e "${YELLOW}Please copy .env.example to .env and configure it:${NC}"
    echo -e "  cp .env.example .env"
    echo -e "  nano .env"
    exit 1
fi

echo -e "${GREEN}✓ .env file found${NC}"

# Load environment variables
source .env

# Variables to check
REQUIRED_VARS=(
    "DATABASE_URL"
    "REDIS_URL"
    "NEXTAUTH_URL"
    "NEXTAUTH_SECRET"
    "GOOGLE_CLIENT_ID"
    "GOOGLE_CLIENT_SECRET"
    "ENCRYPTION_KEY"
)

OPTIONAL_VARS=(
    "ROLLUP_FROM_EMAIL"
    "ROLLUP_FROM_NAME"
)

# Track issues
ISSUES=0
WARNINGS=0

# Check required variables
echo ""
echo -e "${BLUE}Checking required environment variables...${NC}"

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ $var is not set${NC}"
        ((ISSUES++))
    elif [[ "$var" == *"SECRET"* ]] || [[ "$var" == *"KEY"* ]] || [[ "$var" == *"CREDENTIAL"* ]]; then
        # Check for placeholder values
        value="${!var}"
        if [[ "$value" == *"your-"* ]] || [[ "$value" == *"generate"* ]] || [[ "$value" == *"placeholder"* ]]; then
            echo -e "${RED}❌ $var contains placeholder value${NC}"
            ((ISSUES++))
        else
            echo -e "${GREEN}✓ $var is configured${NC}"
        fi
    else
        echo -e "${GREEN}✓ $var is set${NC}"
    fi
done

# Check optional variables
echo ""
echo -e "${BLUE}Checking optional environment variables...${NC}"

for var in "${OPTIONAL_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${YELLOW}⚠ $var is not set (using default)${NC}"
        ((WARNINGS++))
    else
        echo -e "${GREEN}✓ $var is set${NC}"
    fi
done

# Validate NEXTAUTH_URL format
echo ""
echo -e "${BLUE}Validating NEXTAUTH_URL format...${NC}"

if [[ "$NEXTAUTH_URL" =~ ^https?:// ]]; then
    echo -e "${GREEN}✓ NEXTAUTH_URL has valid format${NC}"
else
    echo -e "${RED}❌ NEXTAUTH_URL should start with http:// or https://${NC}"
    ((ISSUES++))
fi

# Validate NEXTAUTH_SECRET length
echo ""
echo -e "${BLUE}Validating NEXTAUTH_SECRET...${NC}"

SECRET_LENGTH=${#NEXTAUTH_SECRET}
if [ $SECRET_LENGTH -lt 32 ]; then
    echo -e "${RED}❌ NEXTAUTH_SECRET is too short ($SECRET_LENGTH chars, minimum 32)${NC}"
    echo -e "${YELLOW}Generate a new one: openssl rand -base64 32${NC}"
    ((ISSUES++))
else
    echo -e "${GREEN}✓ NEXTAUTH_SECRET length is sufficient ($SECRET_LENGTH chars)${NC}"
fi

# Validate ENCRYPTION_KEY length
echo ""
echo -e "${BLUE}Validating ENCRYPTION_KEY...${NC}"

ENCRYPTION_LENGTH=${#ENCRYPTION_KEY}
if [ $ENCRYPTION_LENGTH -ne 32 ]; then
    echo -e "${RED}❌ ENCRYPTION_KEY must be exactly 32 characters (currently $ENCRYPTION_LENGTH)${NC}"
    echo -e "${YELLOW}Generate a new one: openssl rand -base64 24 | head -c32${NC}"
    ((ISSUES++))
else
    echo -e "${GREEN}✓ ENCRYPTION_KEY length is correct (32 chars)${NC}"
fi

# Validate Google OAuth credentials format
echo ""
echo -e "${BLUE}Validating Google OAuth credentials...${NC}"

if [[ "$GOOGLE_CLIENT_ID" =~ \.apps\.googleusercontent\.com$ ]]; then
    echo -e "${GREEN}✓ GOOGLE_CLIENT_ID has correct format${NC}"
else
    echo -e "${RED}❌ GOOGLE_CLIENT_ID doesn't match expected format${NC}"
    echo -e "${YELLOW}Expected format: xxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com${NC}"
    ((ISSUES++))
fi

# Check if redirect URI is correctly set
echo ""
echo -e "${BLUE}Checking redirect URI configuration...${NC}"

REDIRECT_URI="${NEXTAUTH_URL}/api/auth/callback/google"
echo -e "${BLUE}→ Your redirect URI should be: ${REDIRECT_URI}${NC}"
echo -e "${YELLOW}→ Make sure this exact URI is in your Google Cloud Console:${NC}"
echo -e "${YELLOW}  APIs & Services > Credentials > OAuth 2.0 Client ID > Authorized redirect URIs${NC}"

# Check if .gitignore includes .env
echo ""
echo -e "${BLUE}Checking .gitignore...${NC}"

if grep -q "^\.env$" .gitignore 2>/dev/null; then
    echo -e "${GREEN}✓ .env is in .gitignore (good security practice)${NC}"
else
    echo -e "${YELLOW}⚠ .env is not in .gitignore${NC}"
    echo -e "${YELLOW}→ Consider adding it to prevent committing sensitive data${NC}"
    ((WARNINGS++))
fi

# Check if node_modules exists
echo ""
echo -e "${BLUE}Checking dependencies...${NC}"

if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓ node_modules exists${NC}"
else
    echo -e "${YELLOW}⚠ node_modules not found${NC}"
    echo -e "${YELLOW}→ Run: npm install${NC}"
    ((WARNINGS++))
fi

# Check if database is accessible (skip if DATABASE_URL is placeholder)
if [[ ! "$DATABASE_URL" == *"your-"* ]] && [[ ! "$DATABASE_URL" == *"placeholder"* ]]; then
    echo ""
    echo -e "${BLUE}Checking database connectivity...${NC}"

    if command -v psql &> /dev/null; then
        if psql "$DATABASE_URL" -c "SELECT 1" &> /dev/null; then
            echo -e "${GREEN}✓ Database is accessible${NC}"
        else
            echo -e "${YELLOW}⚠ Cannot connect to database${NC}"
            echo -e "${YELLOW}→ Make sure PostgreSQL is running${NC}"
            ((WARNINGS++))
        fi
    else
        echo -e "${YELLOW}⚠ psql not installed - skipping database check${NC}"
    fi
fi

# Summary
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  SUMMARY${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ $ISSUES -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Your configuration looks good.${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo -e "  1. Review the redirect URI in Google Cloud Console"
    echo -e "  2. Add yourself as a test user in OAuth consent screen"
    echo -e "  3. Run: npm run dev"
    echo -e "  4. Visit: $NEXTAUTH_URL"
    exit 0
elif [ $ISSUES -eq 0 ]; then
    echo -e "${YELLOW}⚠ Configuration looks good with $WARNINGS warning(s)${NC}"
    echo ""
    echo -e "${BLUE}You can proceed, but consider fixing the warnings above.${NC}"
    exit 0
else
    echo -e "${RED}❌ Found $ISSUES issue(s) and $WARNINGS warning(s)${NC}"
    echo ""
    echo -e "${BLUE}Please fix the issues above before running the application.${NC}"
    echo ""
    echo -e "${BLUE}For detailed setup instructions, see:${NC}"
    echo -e "${BLUE}  docs/GOOGLE_OAUTH_SETUP.md${NC}"
    exit 1
fi
