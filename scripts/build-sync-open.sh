#!/bin/bash
set -e

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building project..."
npm run build

echo "📱 Checking iOS platform..."
if [ ! -d "ios" ]; then
    echo "   Adding iOS platform..."
    npx cap add ios
fi

echo "🔄 Syncing iOS..."
npx cap sync ios

echo "🚀 Opening Xcode..."
npx cap open ios
