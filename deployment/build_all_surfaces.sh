#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/deployment/artifacts"

mkdir -p "$OUT"

build_app() {
  local name="$1" dir="$2" base="$3" outdir="$4"
  echo "──> Building $name (base: $base) into $outdir"
  ( cd "$ROOT/web/$dir" && VITE_BASE_PATH="$base" npx vite build --base="$base" --outDir "$outdir" --emptyOutDir --logLevel warn )
}

# 1. Main platform domain surfaces
build_app "Marketplace"         "marketplace_portal" "/"                  "$OUT/marketplace"
build_app "Super Admin"         "superadmin_portal"  "/superadmin/"       "$OUT/superadmin"
build_app "SPOC Portal"         "spoc_portal"        "/spoc/"             "$OUT/spoc"

# 2. Tenant Subdomain Admin Root
build_app "Tenant Admin (Root)" "admin_panel"        "/"                  "$OUT/tenant-admin"

# 3. Subdomain Operational Desks
build_app "Admission Desk"      "admission_panel"    "/admission/"        "$OUT/admission"
build_app "Finance Desk"        "finance_panel"      "/finance/"          "$OUT/finance"
build_app "Timetable Desk"      "timetable_portal"   "/timetable/"        "$OUT/timetable"
build_app "Teacher Manager"     "teacher_manager"    "/teacher-manager/"  "$OUT/teacher_manager"
build_app "TC Portal"           "tc_portal"          "/tc/"               "$OUT/tc"
build_app "Academic Manager"    "academic_manager"   "/academic-manager/" "$OUT/academic_manager"

echo "=== All 10 surfaces built successfully into $OUT ==="
