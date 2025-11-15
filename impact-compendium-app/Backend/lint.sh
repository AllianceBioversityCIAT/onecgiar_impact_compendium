#!/bin/bash

# Backend Linting Script
echo "🔍 Running Python linters..."

echo "📝 Formatting with Black..."
python3 -m black app/ tests/ main.py

echo "📦 Sorting imports with isort..."
python3 -m isort app/ tests/ main.py

echo "🔍 Linting with flake8..."
python3 -m flake8 app/ tests/ main.py --count --statistics

echo "🔍 Type checking with mypy..."
python3 -m mypy app/ main.py --ignore-missing-imports

echo "✅ Linting complete!"
