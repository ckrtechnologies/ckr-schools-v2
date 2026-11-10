#!/usr/bin/env bash
# ==============================================================================
# CKR Schools — production build for the sub-path nginx layout
#
#   ./deployment/build.sh [output-dir]      # default: deployment/artifacts
#
# Produces exactly the directories referenced by deployment/ckr-schools:
#
#   artifacts/marketplace/    -> /var/www/ckrschools/marketplace   (served at /)
#   artifacts/spoc/           -> /var/www/ckrschools/spoc          (served at /spoc/)
#   artifacts/superadmin/     -> /var/www/ckrschools/superadmin    (served at /superadmin/)
#   artifacts/admin/          -> /var/www/ckrschools/admin         (served at /admin/)
#   artifacts/tenant-admin/   -> /var/www/ckrschools/tenant-admin  (tenant subdomain root)
#
# A single Vite build cannot serve both / and /admin/: the HTML references
# absolute asset URLs, so the admin panel is built twice.
# ==============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${1:-$ROOT/deployment/artifacts}"

mkdir -p "$OUT"

build() {
  local name="$1" dir="$2" base="$3" outdir="$4"
  echo "──> building $name (base=$base)"
  ( cd "$ROOT/web/$dir" \
    && VITE_BASE_PATH="$base" npx vite build --outDir "$outdir" --emptyOutDir --logLevel warn )
}

# Marketplace — domain root
build "marketplace"    marketplace_portal "/"            "$OUT/marketplace"

# SPOC public-domain portal — /spoc/
build "spoc"           spoc_portal        "/spoc/"        "$OUT/spoc"

# Platform super admin — /superadmin/
build "superadmin"     superadmin_portal  "/superadmin/"  "$OUT/superadmin"

# School admin — /admin/ (path build) and tenant subdomain root (base "/")
build "admin (/admin/)" admin_panel       "/admin/"       "$OUT/admin"
build "tenant admin"    admin_panel       "/"             "$OUT/tenant-admin"

# Optional clickable prototype workbench
if [ -d "$ROOT/web/prototype" ]; then
  build "prototype" prototype "/prototype/" "$OUT/prototype"
else
  mkdir -p "$OUT/prototype"
  echo "──> prototype: no web/prototype directory, skipped"
fi

echo
echo "Build complete: $OUT"
echo "Deploy with:"
echo "  sudo rsync -a --delete $OUT/marketplace/    /var/www/ckrschools/marketplace/"
echo "  sudo rsync -a --delete $OUT/spoc/           /var/www/ckrschools/spoc/"
echo "  sudo rsync -a --delete $OUT/superadmin/     /var/www/ckrschools/superadmin/"
echo "  sudo rsync -a --delete $OUT/admin/          /var/www/ckrschools/admin/"
echo "  sudo rsync -a --delete $OUT/tenant-admin/   /var/www/ckrschools/tenant-admin/"
