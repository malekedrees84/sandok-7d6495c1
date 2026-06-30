#!/usr/bin/env bash
# ============================================================
# Sandok - Open in Xcode & Run on iPhone
# سكريبت يفتح المشروع في Xcode ويبني التطبيق على iPhone موصول
# ============================================================

set -e

GREEN='\033[0;32m'; BLUE='\033[0;34m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "\n${BLUE}▶ $1${NC}"; }
ok()   { echo -e "${GREEN}✓ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }
err()  { echo -e "${RED}✗ $1${NC}"; exit 1; }

# تأكد إنا داخل مجلد المشروع
[ -f "package.json" ] || err "شغّل السكريبت من مجلد المشروع (اللي فيه package.json)"

# 1) بناء الويب
log "بناء المشروع..."
npm run build
ok "تم البناء"

# 2) إضافة iOS لو ما كان موجود
if [ ! -d "ios" ]; then
  log "إضافة منصة iOS لأول مرة..."
  npx cap add ios
fi

# 3) مزامنة Capacitor
log "مزامنة Capacitor..."
npx cap sync ios
ok "تمت المزامنة"

# 4) كشف iPhone موصول
log "البحث عن iPhone موصول..."
DEVICE_ID=$(xcrun xctrace list devices 2>&1 \
  | grep -E "iPhone.*\([0-9A-F-]{25,}\)" \
  | grep -v "Simulator" \
  | head -n1 \
  | sed -E 's/.*\(([0-9A-F-]{25,})\).*/\1/')

# 5) افتح Xcode
log "فتح المشروع في Xcode..."
npx cap open ios

if [ -z "$DEVICE_ID" ]; then
  warn "ما في iPhone موصول. وصّل الجهاز واضغط Run ▶ من Xcode."
  exit 0
fi

ok "iPhone متصل: $DEVICE_ID"

# 6) بناء وتثبيت على الجهاز
log "بناء التطبيق وتثبيته على iPhone..."
cd ios/App

xcodebuild \
  -workspace App.xcworkspace \
  -scheme App \
  -configuration Debug \
  -destination "id=${DEVICE_ID}" \
  -derivedDataPath build \
  -allowProvisioningUpdates \
  clean build

APP_PATH=$(find build/Build/Products/Debug-iphoneos -name "*.app" -maxdepth 2 | head -n1)
[ -z "$APP_PATH" ] && err "تعذر العثور على ملف .app — تأكد من إعداد التوقيع في Xcode"

log "تثبيت التطبيق على الجهاز..."
if ! command -v ios-deploy >/dev/null 2>&1; then
  warn "ios-deploy غير مثبت. تثبيت تلقائي..."
  brew install ios-deploy || npm install -g ios-deploy
fi

ios-deploy --id "$DEVICE_ID" --bundle "$APP_PATH" --no-wifi --justlaunch

echo ""
ok "🎉 التطبيق اشتغل على هاتفك!"
