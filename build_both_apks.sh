#!/usr/bin/env bash
set -e

ROOT="$(pwd)"
OUTPUT_DIR="$ROOT/deployment/apks"
mkdir -p "$OUTPUT_DIR"

echo "=================================================="
echo "1. Building Student App Release APK..."
echo "=================================================="
cd "$ROOT/mobile/student_app/android"
./gradlew assembleRelease --no-daemon

STUDENT_APK=$(find app/build/outputs/apk/release -name "*.apk" | head -n 1)
if [ -n "$STUDENT_APK" ]; then
  cp "$STUDENT_APK" "$OUTPUT_DIR/CKR_Schools_StudentApp.apk"
  echo "✓ Student App APK ready: $OUTPUT_DIR/CKR_Schools_StudentApp.apk"
else
  echo "✗ Student App APK not found!"
  exit 1
fi

echo "=================================================="
echo "2. Building Teacher App Release APK..."
echo "=================================================="
cd "$ROOT/mobile/teacher_app/android"
./gradlew assembleRelease --no-daemon

TEACHER_APK=$(find app/build/outputs/apk/release -name "*.apk" | head -n 1)
if [ -n "$TEACHER_APK" ]; then
  cp "$TEACHER_APK" "$OUTPUT_DIR/CKR_Schools_TeacherApp.apk"
  echo "✓ Teacher App APK ready: $OUTPUT_DIR/CKR_Schools_TeacherApp.apk"
else
  echo "✗ Teacher App APK not found!"
  exit 1
fi

echo "=================================================="
echo "✓ Both APKs compiled successfully!"
ls -lh "$OUTPUT_DIR"
echo "=================================================="
