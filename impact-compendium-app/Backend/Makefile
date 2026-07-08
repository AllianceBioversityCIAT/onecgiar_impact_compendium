.PHONY: lint format check-format type-check test clean

# Linting and formatting
lint:
	python3 -m flake8 app/ tests/ main.py

format:
	python3 -m black app/ tests/ main.py
	python3 -m isort app/ tests/ main.py

check-format:
	python3 -m black --check app/ tests/ main.py
	python3 -m isort --check-only app/ tests/ main.py

type-check:
	python3 -m mypy app/ main.py

# Combined checks
check-all: lint check-format type-check

# Fix all formatting issues
fix: format

# Run tests
test:
	python3 -m pytest tests/ -v

# Clean cache files
clean:
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".mypy_cache" -exec rm -rf {} +
