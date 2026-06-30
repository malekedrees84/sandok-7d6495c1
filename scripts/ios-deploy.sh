#!/usr/bin/env bash
# ============================================================
# Sandok - iOS Auto Update & Deploy Script
# يسحب آخر إصدار من GitHub، يبني المشروع، يحدّث Xcode، ويثبت
# التطبيق على هاتف iPhone متصل عبر USB.
# ============================================================
# المتطلبات (مرة واحدة):
#   1) macOS + Xcode + Command Line Tools  (xcode-select --install)
#   2) Node.js 18+  و  npm
#   3) CocoaPods:    sudo gem install cocoapods
#   4) ios-deploy:   npm install -g ios-deploy
#   5) iPhone موصول بكابل USB ومسموح بالثقة (Trust)
#
# الاستخدام:
#   chmod +x scripts/ios-deploy.sh
#   ./scripts/ios-deploy.sh
# ============================================================

set -e

# ---------- ألوان للطباعة ----------
GREEN='\033[0;32m'; BLUE='\033[0;34m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${BLUE}▶ $1${NC}"; }
ok()   { echo -e "${GREEN}✓ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }
err()  { echo -e "${RED}✗ $1${NC}"; exit 1; }

# ---------- 1) سحب آخر إصدار من GitHub ----------
log "سحب آخر إصدار من GitHub..."
git fetch --all --prune
BRANCH=$(git rev-parse --abbrev-ref HEAD)
git reset --hard "origin/${BRANCH}"
ok "تم التحديث للفرع ${BRANCH}"

# ---------- 2) تثبيت الاعتمادات ----------
log "تثبيت اعتمادات npm..."
npm install --silent
ok "تم تثبيت الحزم"

# ---------- 3) إضافة منصة iOS إن لم تكن موجودة ----------
if [ ! -d "ios" ]; then
  log "إضافة منصة iOS لأول مرة..."
  npx cap add ios
  ok "تمت إضافة iOS"
fi

# ---------- 4) بناء الويب ----------
log "بناء المشروع (npm run build)..."
npm run build
ok "تم البناء"

# ---------- 5) مزامنة Capacitor + تحديث Pods ----------
log "مزامنة Capacitor مع iOS..."
npx cap sync ios
npx cap update ios || true
ok "تمت المزامنة"

# ---------- 6) كشف الجهاز ----------
log "البحث عن iPhone موصول..."
DEVICE_ID=$(xcrun xctrace list devices 2>&1 | grep -E "iPhone.*\([0-9A-F-]{25,}\)" | head -n1 | sed -E 's/.*\(([0-9A-F-]{25,})\).*/\1/')

if [ -z "$DEVICE_ID" ]; then
  warn "ما في جهاز iPhone حقيقي موصول. سأفتح Xcode حتى تختار الجهاز يدوياً."
  npx cap open ios
  exit 0
fi
ok "تم العثور على الجهاز: $DEVICE_ID"

# ---------- 7) البناء والتثبيت على الجهاز ----------
log "بناء التطبيق وتثبيته على الجهاز..."
cd ios/App

# يحتاج تعديل DEVELOPMENT_TEAM عند أول مرة من Xcode (Signing & Capabilities)
xcodebuild \
  -workspace App.xcworkspace \
  -scheme App \
  -configuration Debug \
  -destination "id=${DEVICE_ID}" \
  -derivedDataPath build \
  clean build

APP_PATH=$(find build/Build/Products/Debug-iphoneos -name "*.app" -maxdepth 2 | head -n1)
[ -z "$APP_PATH" ] && err "تعذر العثور على ملف .app بعد البناء"

log "تثبيت ${APP_PATH} على الجهاز..."
ios-deploy --id "$DEVICE_ID" --bundle "$APP_PATH" --no-wifi

ok "تم تثبيت التطبيق بنجاح على هاتفك! 🎉"
