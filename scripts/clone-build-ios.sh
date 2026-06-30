#!/usr/bin/env bash
# ============================================================
# Sandok - Clone from GitHub & Build on iPhone via Xcode
# سكريبت يستنسخ المشروع من GitHub ويبنيه ويثبته على iPhone
# ============================================================

set -e

GREEN='\033[0;32m'; BLUE='\033[0;34m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "\n${BLUE}▶ $1${NC}"; }
ok()   { echo -e "${GREEN}✓ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }
err()  { echo -e "${RED}✗ $1${NC}"; exit 1; }

REPO_URL="https://github.com/malekedrees84/sandok-7d6495c1.git"
PROJECT_DIR="sandok-7d6495c1"

# 1) استنساخ المشروع
if [ -d "$PROJECT_DIR" ]; then
  log "المجلد موجود — نحدثه..."
  cd "$PROJECT_DIR"
  git pull
  ok "تم التحديث"
else
  log "استنساخ المشروع من GitHub..."
  git clone "$REPO_URL"
  cd "$PROJECT_DIR"
  ok "تم الاستنساخ"
fi

# 2) تثبيت المتطلبات لو مش موجودة
if ! command -v node &> /dev/null; then
  if ! command -v brew &> /dev/null; then
    log "تثبيت Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  fi
  log "تثبيت Node.js..."
  brew install node
fi

if ! command -v pod &> /dev/null; then
  log "تثبيت CocoaPods..."
  brew install cocoapods || sudo gem install cocoapods
fi

if ! command -v ios-deploy &> /dev/null; then
  log "تثبيت ios-deploy..."
  brew install ios-deploy || npm install -g ios-deploy
fi

ok "كل الأدوات جاهزة"

# 3) تثبيت الحزم وبناء الويب
log "تثبيت حزم npm..."
npm install

log "بناء المشروع..."
npm run build
ok "تم البناء"

# 4) إضافة iOS لو ما كان موجود
if [ ! -d "ios" ]; then
  log "إضافة منصة iOS..."
  npx cap add ios
fi

# 5) مزامنة Capacitor
log "مزامنة Capacitor..."
npx cap sync ios
ok "تمت المزامنة"

# 6) كشف iPhone موصول
log "البحث عن iPhone موصول..."
DEVICE_ID=$(xcrun xctrace list devices 2>&1 \
  | grep -E "iPhone.*\([0-9A-F-]{25,}\)" \
  | grep -v "Simulator" \
  | head -n1 \
  | sed -E 's/.*\(([0-9A-F-]{25,})\).*/\1/')

# 7) فتح Xcode
log "فتح المشروع في Xcode..."
npx cap open ios

if [ -z "$DEVICE_ID" ]; then
  warn "ما في iPhone موصول بالكابل."
  warn "وصّل الجهاز واضغط Trust على الهاتف، ثم اضغط Run ▶ من Xcode."
  exit 0
fi

ok "iPhone متصل: $DEVICE_ID"

# 8) بناء وتثبيت على الجهاز
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
ios-deploy --id "$DEVICE_ID" --bundle "$APP_PATH" --no-wifi --justlaunch

echo ""
ok "🎉 التطبيق اشتغل على هاتفك بنجاح!"
