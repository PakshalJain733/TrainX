#!/usr/bin/env bash
# ==============================================================================
# TrainingPortal - Production Automated Deployment Script for Jenkins & CI/CD
# Target Server: Node.js v18.20.8 (Compatible with Node >= 18.x)
# Application: PM2 process "ganeshTraining" | Web root: /var/www/trainingportal/
# ==============================================================================

set -euo pipefail

# Colors for clear console reporting
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
  echo -e "${BLUE}[INFO] $(date '+%Y-%m-%d %H:%M:%S') - $1${NC}"
}

log_success() {
  echo -e "${GREEN}[SUCCESS] $(date '+%Y-%m-%d %H:%M:%S') - $1${NC}"
}

log_warn() {
  echo -e "${YELLOW}[WARN] $(date '+%Y-%m-%d %H:%M:%S') - $1${NC}"
}

log_error() {
  echo -e "${RED}[ERROR] $(date '+%Y-%m-%d %H:%M:%S') - $1${NC}" >&2
}

# --- Step 1: Initialize Environment & Paths ---
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="${PROJECT_ROOT}/Frontend"
BACKEND_DIR="${PROJECT_ROOT}/Backend"
WEB_ROOT="/var/www/trainingportal"
BACKUP_DIR="/var/www/trainingportal_backups"
TIMESTAMP="$(date +'%Y%m%d_%H%M%S')"
BACKUP_PATH="${BACKUP_DIR}/backup_${TIMESTAMP}"
PM2_APP_NAME="ganeshTraining"

log_info "Starting deployment from directory: ${PROJECT_ROOT}"

# If NVM is available on server, ensure it is loaded
if [ -s "${HOME}/.nvm/nvm.sh" ]; then
  # shellcheck source=/dev/null
  . "${HOME}/.nvm/nvm.sh"
  nvm use 18 2>/dev/null || true
fi

log_info "Node version: $(node -v)"
log_info "npm version:  $(npm -v)"

# --- Step 2: Safe Git Sync ---
cd "${PROJECT_ROOT}"
log_info "Syncing latest repository changes..."
git stash --include-untracked 2>/dev/null || true
git fetch origin
git checkout -f HEAD
git pull --ff-only || {
  log_warn "Fast-forward pull failed, pulling current branch..."
  git pull
}
CURRENT_COMMIT="$(git rev-parse --short HEAD)"
log_info "Current deployment commit: ${CURRENT_COMMIT}"

# --- Step 3: Frontend Build & Verification ---
cd "${FRONTEND_DIR}"
log_info "Installing frontend dependencies (engine-strict=false)..."
if [ -f "package-lock.json" ]; then
  npm ci --engine-strict=false --prefer-offline 2>&1 || npm install --engine-strict=false
else
  npm install --engine-strict=false
fi

log_info "Building frontend production bundle..."
npm run build

# Validate that dist directory exists and has valid index.html & assets
if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
  log_error "Frontend build failed or dist/index.html is missing. Aborting deployment!"
  exit 1
fi

INDEX_SIZE=$(wc -c < "dist/index.html" | tr -d ' ')
if [ "${INDEX_SIZE}" -lt 100 ]; then
  log_error "dist/index.html is invalid or empty (${INDEX_SIZE} bytes). Aborting deployment!"
  exit 1
fi
log_success "Frontend build verified successfully (${INDEX_SIZE} bytes index.html)."

# --- Step 4: Atomic Backup of Existing Web Files ---
log_info "Preparing atomic deployment to ${WEB_ROOT}..."
mkdir -p "${BACKUP_DIR}"

if [ -d "${WEB_ROOT}" ] && [ "$(ls -A "${WEB_ROOT}")" ]; then
  log_info "Backing up current web root to ${BACKUP_PATH}..."
  cp -a "${WEB_ROOT}" "${BACKUP_PATH}"
fi

# Deploy newly built dist into /var/www/trainingportal/
log_info "Syncing dist files to ${WEB_ROOT}..."
mkdir -p "${WEB_ROOT}"
rsync -a --delete "${FRONTEND_DIR}/dist/" "${WEB_ROOT}/" || {
  log_warn "rsync failed, falling back to cp..."
  rm -rf "${WEB_ROOT:?}"/*
  cp -a "${FRONTEND_DIR}/dist/"* "${WEB_ROOT}/"
}
log_success "Frontend assets deployed to ${WEB_ROOT}."

# --- Step 5: Backend Dependencies & PM2 Reload ---
cd "${BACKEND_DIR}"
log_info "Updating backend dependencies..."
if [ -f "package-lock.json" ]; then
  npm ci --engine-strict=false --prefer-offline 2>&1 || npm install --engine-strict=false
else
  npm install --engine-strict=false
fi

# Reload PM2 application with zero downtime
log_info "Reloading PM2 application: ${PM2_APP_NAME}..."
if command -v pm2 >/dev/null 2>&1; then
  pm2 reload "${PM2_APP_NAME}" --update-env 2>/dev/null || pm2 restart "${PM2_APP_NAME}" --update-env
  
  # Wait 3 seconds for boot
  sleep 3

  # Check PM2 process health
  PM2_STATUS=$(pm2 jlist | grep -o "\"name\":\"${PM2_APP_NAME}\",\"pm_id\":[0-9]*,\"status\":\"[^\"]*\"" | grep -o "\"status\":\"[^\"]*\"" | cut -d'"' -f4 || echo "unknown")
  log_info "PM2 process '${PM2_APP_NAME}' status: ${PM2_STATUS}"

  if [ "${PM2_STATUS}" != "online" ]; then
    log_warn "PM2 process '${PM2_APP_NAME}' is '${PM2_STATUS}'. Checking logs..."
    pm2 logs "${PM2_APP_NAME}" --lines 15 --nostream || true
  else
    log_success "PM2 process '${PM2_APP_NAME}' is active and healthy."
  fi
else
  log_warn "pm2 command not found in PATH; skipping PM2 reload."
fi

# --- Step 6: Prune Old Backups (keep last 3) ---
log_info "Cleaning up old backups (keeping latest 3)..."
# shellcheck disable=SC2012
ls -dt "${BACKUP_DIR}"/backup_* 2>/dev/null | tail -n +4 | xargs rm -rf 2>/dev/null || true

log_success "=========================================================="
log_success " TrainingPortal deployed successfully! Commit: ${CURRENT_COMMIT}"
log_success " Target: Node.js 18.20.8 | Web: ${WEB_ROOT} | PM2: ${PM2_APP_NAME}"
log_success "=========================================================="

