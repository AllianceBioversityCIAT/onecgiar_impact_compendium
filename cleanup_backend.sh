#!/bin/bash

# Backend Cleanup Script
# Removes unnecessary files and directories from Backend folder

BACKEND_DIR="/Users/jcadavid/Desktop/DEV/Desarrollos/onecgiar_impact_compendium/impact-compendium-app/Backend"

echo "🧹 Starting Backend cleanup..."

cd "$BACKEND_DIR" || exit 1

# Remove large zip files
echo "📦 Removing Lambda zip packages..."
rm -f lambda-*.zip
rm -f *.zip

# Remove duplicate lambda directories
echo "📁 Removing duplicate lambda directories..."
rm -rf lambda_simple/
rm -rf lambda_deploy/

# Remove build artifacts
echo "🔨 Removing build artifacts..."
rm -rf .aws-sam/
rm -rf __pycache__/
find . -name "*.pyc" -delete
find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null

# Remove virtual environment
echo "🐍 Removing virtual environment..."
rm -rf .venv/

# Remove deployment packages (large dependencies)
echo "📦 Removing deployment packages..."
rm -rf deployment/packages/
rm -f deployment/lambda-complete.zip

# Remove test files (keep structure but remove large test files)
echo "🧪 Cleaning test files..."
rm -f tests/TESTING_SUMMARY.md
rm -f tests/README.md
rm -f tests/JWT_TESTING_README.md

# Remove architecture documentation (keep essential files only)
echo "📚 Cleaning documentation..."
rm -rf architecture/jwt/
rm -rf architecture/cognito_integration/
rm -f architecture/API_DOCUMENTATION.md
rm -f architecture/DEPLOYMENT_GUIDE.md
rm -f architecture/DATABASE_LAYER.md
rm -f architecture/API_LAYER.md

# Remove temporary files
echo "🗑️  Removing temporary files..."
rm -f .DS_Store
find . -name ".DS_Store" -delete

# Remove unnecessary config files
echo "⚙️  Cleaning config files..."
rm -f pytest.ini
rm -f alembic.ini
rm -f run_tests.py

# Keep only essential files
echo "✅ Cleanup completed!"
echo ""
echo "📋 Remaining structure:"
find . -type f -name "*.py" | head -10
echo "..."
echo ""
echo "💾 Disk space saved:"
du -sh . 2>/dev/null || echo "Unable to calculate size"
