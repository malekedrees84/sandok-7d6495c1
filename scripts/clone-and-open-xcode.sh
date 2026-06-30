#!/usr/bin/env bash
# سكريبت واحد: ينزل المشروع من GitHub ويبنيه ويفتحه على Xcode ويثبته على iPhone
set -e

REPO_URL="https://github.com/malekedrees84/sandok-7d6495c1.git"
PROJECT_DIR="$HOME/Desktop/sandok-7d6495c1"

echo "═══════════════════════════════════════════════"
echo "🚀 Sandok — Clone & Build for iOS"
echo "═══════════════════════════════════════════════"

# 1) Xcode Command Line Tools
if ! xcode-select -p &>/dev/null; then
  echo "📦 تثبيت Xcode Command Line Tools..."
  xcode-select --install || true
  echo "⚠️  بعد ما يخلص التثبيت، شغّل السكريبت مرة ثانية."
  exit 0
fi

# 2) Homebrew
if ! command -v brew &>/dev/null; then
  echo "🍺 تثبيت Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  eval "$(/opt/homebrew/bin/brew shellenv)" 2>/dev/null || eval "$(/usr/local/bin/brew shellenv)" 2>/dev/null || true
fi

# 3) Node
if ! command -v node &>/dev/null; then
  echo "📦 تثبيت Node.js..."
  brew install node
fi

# 4) CocoaPods
if ! command -v pod &>/dev/null; then
  echo "📦 تثبيت CocoaPods..."
  brew install cocoapods
fi

# 5) ios-deploy (لتثبيت التطبيق على الجهاز)
if ! command -v ios-deploy &>/dev/null; then
  echo "📦 تثبيت ios-deploy..."
  brew install ios-deploy || npm install -g ios-deploy
fi

# 6) Clone / Pull
if [ ! -d "$PROJECT_DIR" ]; then
  echo "⬇️  استنساخ المشروع من GitHub..."
  git clone "$REPO_URL" "$PROJECT_DIR"
else
  echo "🔄 تحديث المشروع من GitHub..."
  cd "$PROJECT_DIR" && git pull
fi

cd "$PROJECT_DIR"

# 7) npm install + build
echo "📦 تثبيت الحزم..."
npm install

echo "🏗  بناء المشروع..."
npm run build

# 8) Capacitor iOS
if [ ! -d "ios" ]; then
  echo "➕ إضافة منصة iOS..."
  npx cap add ios
fi

echo "🔄 مزامنة Capacitor..."
npx cap sync ios

# 9) افتح Xcode
echo "🍏 فتح المشروع في Xcode..."
npx cap open ios

# 10) حاول تثبيت التطبيق على iPhone الموصول
DEVICE_ID=$(xcrun xctrace list devices 2>&1 | grep -E "iPhone|iPad" | grep -v "Simulator" | head -n 1 | sed -E 's/.*\(([0-9A-F-]+)\).*/\1/')

if [ -n "$DEVICE_ID" ]; then
  echo "📱 جهاز متصل: $DEVICE_ID"
  echo "▶️  محاولة تشغيل التطبيق على الجهاز..."
  npx cap run ios --target "$DEVICE_ID" || echo "⚠️  افتح Xcode وحدد Team من Signing & Capabilities ثم اضغط Run."
else
  echo "ℹ️  ما لقيت iPhone موصول. وصّل الجهاز ومن Xcode اضغط زر التشغيل (▶)."
fi

echo "✅ خلصنا!"
