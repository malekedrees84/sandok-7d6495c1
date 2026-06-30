#!/usr/bin/env bash
# ============================================================
# Sandok - One-Shot iOS Installer & Updater
# سكريبت واحد يعمل كل شي:
#   - يثبت كل الأدوات المطلوبة (Homebrew, Node, CocoaPods, ios-deploy)
#   - يسحب آخر إصدار من GitHub
#   - يبني المشروع ويزامن Capacitor
#   - يبني التطبيق ويثبته على iPhone الموصول
#
# الاستخدام (من مجلد المشروع على Mac):
#   chmod +x scripts/setup-and-deploy.sh
#   ./scripts/setup-and-deploy.sh
#
# المتطلبات:
#   - macOS مع Xcode مثبت من App Store
#   - iPhone موصول بكابل USB ومسموح بالثقة (Trust This Computer)
#   - حساب Apple ID (مجاني يكفي للتثبيت على جهازك)
# ============================================================

set -e

GREEN='\033[0;32m'; BLUE='\033[0;34m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "\n${BLUE}▶ $1${NC}"; }
ok()   { echo -e "${GREEN}✓ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }
err()  { echo -e "${RED}✗ $1${NC}"; exit 1; }

# ============================================================
# 0) فحوصات أولية
# ============================================================
[ "$(uname)" = "Darwin" ] || err "هذا السكريبت يعمل فقط على macOS"

if ! xcode-select -p >/dev/null 2>&1; then
  log "تثبيت Xcode Command Line Tools..."
  xcode-select --install || true
  warn "بعد ما تخلص التثبيت من النافذة المنبثقة، شغّل السكريبت مرة ثانية."
  exit 0
fi
ok "Xcode Command Line Tools موجودة"

# ============================================================
# 1) Homebrew
# ============================================================
if ! command -v brew >/dev/null 2>&1; then
  log "تثبيت Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  # إضافة brew إلى PATH للجلسة الحالية
  if [ -x /opt/homebrew/bin/brew ]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  elif [ -x /usr/local/bin/brew ]; then
    eval "$(/usr/local/bin/brew shellenv)"
  fi
fi
ok "Homebrew جاهز"

# ============================================================
# 2) Node.js + npm
# ============================================================
if ! command -v node >/dev/null 2>&1; then
  log "تثبيت Node.js..."
  brew install node
fi
ok "Node $(node -v) جاهز"

# ============================================================
# 3) CocoaPods
# ============================================================
if ! command -v pod >/dev/null 2>&1; then
  log "تثبيت CocoaPods..."
  brew install cocoapods
fi
ok "CocoaPods جاهز"

# ============================================================
# 4) ios-deploy
# ============================================================
if ! command -v ios-deploy >/dev/null 2>&1; then
  log "تثبيت ios-deploy..."
  brew install ios-deploy
fi
ok "ios-deploy جاهز"

# ============================================================
# 5) سحب آخر إصدار من GitHub
# ============================================================
if [ -d ".git" ]; then
  log "سحب آخر إصدار من GitHub..."
  git fetch --all --prune
  BRANCH=$(git rev-parse --abbrev-ref HEAD)
  git reset --hard "origin/${BRANCH}"
  ok "تم التحديث للفرع ${BRANCH}"
else
  warn "ما في مستودع Git في هذا المجلد. تأكد إنك داخل مجلد المشروع."
fi

# ============================================================
# 6) تثبيت الاعتمادات
# ============================================================
log "تثبيت اعتمادات npm..."
npm install
ok "تم تثبيت الحزم"

# ============================================================
# 7) إضافة منصة iOS لأول مرة
# ============================================================
if [ ! -d "ios" ]; then
  log "إضافة منصة iOS لأول مرة..."
  npx cap add ios
  ok "تمت إضافة iOS"
fi

# ============================================================
# 8) بناء الويب
# ============================================================
log "بناء المشروع..."
npm run build
ok "تم البناء"

# ============================================================
# 9) مزامنة Capacitor + Pods
# ============================================================
log "مزامنة Capacitor مع iOS..."
npx cap sync ios
npx cap update ios || true
ok "تمت المزامنة"

# ============================================================
# 10) كشف الجهاز المتصل
# ============================================================
log "البحث عن iPhone موصول بـ USB..."
DEVICE_ID=$(xcrun xctrace list devices 2>&1 \
  | grep -E "iPhone.*\([0-9A-F-]{25,}\)" \
  | grep -v "Simulator" \
  | head -n1 \
  | sed -E 's/.*\(([0-9A-F-]{25,})\).*/\1/')

if [ -z "$DEVICE_ID" ]; then
  warn "ما في iPhone حقيقي موصول."
  warn "سأفتح Xcode لتختار الجهاز وتعمل Run يدوياً (أول مرة فقط لإعداد التوقيع)."
  npx cap open ios
  echo ""
  ok "افتح Xcode → اختر مشروع App → Signing & Capabilities → اختر Team (Apple ID حقك)"
  ok "ثم اضغط زر التشغيل ▶ في Xcode."
  exit 0
fi
ok "تم العثور على الجهاز: $DEVICE_ID"

# ============================================================
# 11) بناء التطبيق وتثبيته على الجهاز
# ============================================================
log "بناء التطبيق وتثبيته على iPhone..."
cd ios/App

if ! xcodebuild \
  -workspace App.xcworkspace \
  -scheme App \
  -configuration Debug \
  -destination "id=${DEVICE_ID}" \
  -derivedDataPath build \
  -allowProvisioningUpdates \
  clean build 2>&1 | tail -40; then
  warn "فشل البناء. هذا غالباً بسبب التوقيع (Code Signing)."
  warn "افتح Xcode وأضف Apple ID من: Xcode → Settings → Accounts"
  warn "ثم: App target → Signing & Capabilities → اختر Team"
  cd ../..
  npx cap open ios
  exit 1
fi

APP_PATH=$(find build/Build/Products/Debug-iphoneos -name "*.app" -maxdepth 2 | head -n1)
[ -z "$APP_PATH" ] && err "تعذر العثور على ملف .app"

log "تثبيت التطبيق على الجهاز..."
ios-deploy --id "$DEVICE_ID" --bundle "$APP_PATH" --no-wifi --justlaunch

echo ""
ok "🎉 تم تثبيت التطبيق وتشغيله على هاتفك بنجاح!"
ok "في المرات القادمة، شغّل نفس السكريبت لجلب آخر تحديث وتثبيته."
