#!/bin/bash

echo "🚀 Impact Compendium Frontend Test Demo"
echo "======================================="
echo ""

# Check if dev server is running
if ! curl -s http://localhost:5173 > /dev/null; then
    echo "❌ Development server not running on localhost:5173"
    echo "Please start the dev server first:"
    echo "   npm run dev"
    echo ""
    exit 1
fi

echo "✅ Development server is running"
echo ""

# Install Playwright browsers if needed
echo "🔧 Installing Playwright browsers..."
npx playwright install --with-deps chromium
echo ""

echo "🎭 Running Playwright Tests with Visual Interface"
echo "This will open the Playwright Test UI where you can:"
echo "- See all tests organized by category"
echo "- Run individual tests or test suites"
echo "- Watch tests execute in real-time"
echo "- Debug failed tests with traces and screenshots"
echo ""

echo "Press Enter to start the test UI..."
read

# Run tests with UI
npm run test:ui
