#!/usr/bin/env bash
# ==============================================================================
# SchoolKarma — Complete 10-Surface Build & Artifact Staging Script
# Prepares all web portals for sub-path and subdomain hosting
# ==============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/deployment/artifacts"

echo "=========================================================="
echo "🚀 Building SchoolKarma Production Surfaces..."
echo "=========================================================="

mkdir -p "$OUT"

build_app() {
  local name="$1" dir="$2" base="$3" outdir="$4"
  echo "──> Building $name (base: $base) into $outdir"
  ( cd "$ROOT/web/$dir" && VITE_BASE_PATH="$base" ./node_modules/.bin/vite build --base="$base" --outDir "$outdir" --emptyOutDir --logLevel warn )
}

# 1. Next.js Main SEO Web Platform
echo "──> Building Next.js Main Platform (web/schoolkarma_web)..."
( cd "$ROOT/web/schoolkarma_web" && npm run build )

# 2. Main platform domain surfaces (Vite SPAs)
build_app "Super Admin"         "superadmin_portal"  "/superadmin/"       "$OUT/superadmin"
build_app "SPOC Portal"         "spoc_portal"        "/spoc/"             "$OUT/spoc"
build_app "Admin (Path)"        "admin_panel"        "/admin/"            "$OUT/admin"

# 3. Tenant Subdomain Admin Root (Wildcard *.schoolkarma.com)
build_app "Tenant Admin (Root)" "admin_panel"        "/"                  "$OUT/tenant-admin"

# 4. Subdomain Operational Desks
build_app "Admission Desk"      "admission_panel"    "/admission/"        "$OUT/admission"
build_app "Finance Desk"        "finance_panel"      "/finance/"          "$OUT/finance"
build_app "Timetable Desk"      "timetable_portal"   "/timetable/"        "$OUT/timetable"
build_app "Teacher Manager"     "teacher_manager"    "/teacher-manager/"  "$OUT/teacher_manager"
build_app "TC Portal"           "tc_portal"          "/tc/"               "$OUT/tc"
build_app "Academic Manager"    "academic_manager"   "/academic-manager/" "$OUT/academic_manager"

echo
echo "=========================================================="
echo "✅ All surfaces successfully built into: $OUT"
echo "=========================================================="
