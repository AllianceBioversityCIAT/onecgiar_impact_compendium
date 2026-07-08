# Backend Linting and Code Quality Setup

This Python backend uses multiple tools to maintain code quality and consistency.

## Tools Configured

### Black (Code Formatter)
- **Purpose**: Automatic code formatting
- **Configuration**: `pyproject.toml`
- **Line length**: 88 characters
- **Target**: Python 3.9+

### isort (Import Sorter)
- **Purpose**: Organize and sort imports
- **Configuration**: `pyproject.toml`
- **Profile**: Black-compatible
- **Groups**: Standard library, third-party, first-party

### Flake8 (Linter)
- **Purpose**: Code quality and style checking
- **Configuration**: `.flake8`
- **Max line length**: 88 characters
- **Plugins**: docstrings, import-order, bugbear

### MyPy (Type Checker)
- **Purpose**: Static type checking
- **Configuration**: `pyproject.toml`
- **Target**: Python 3.9
- **Mode**: Gradual typing (allows untyped code)

## Available Commands

### Using Make
```bash
# Format code
make format

# Check formatting without changes
make check-format

# Run linter
make lint

# Run type checker
make type-check

# Run all checks
make check-all

# Fix formatting issues
make fix

# Run tests
make test

# Clean cache files
make clean
```

### Using Scripts
```bash
# Run all linting tools
./lint.sh

# Individual tools
python3 -m black app/ tests/ main.py
python3 -m isort app/ tests/ main.py
python3 -m flake8 app/ tests/ main.py
python3 -m mypy app/ main.py
```

### Using pip directly
```bash
# Install dev dependencies
pip3 install -r requirements-dev.txt

# Format code
python3 -m black app/ tests/ main.py

# Sort imports
python3 -m isort app/ tests/ main.py

# Lint code
python3 -m flake8 app/ tests/ main.py

# Type check
python3 -m mypy app/ main.py --ignore-missing-imports
```

## Current Status

✅ **Implemented Features:**
- Black code formatting with 88-character line length
- isort import organization with Black compatibility
- Flake8 linting with relaxed docstring requirements
- MyPy type checking with gradual typing
- Makefile with common commands
- Shell script for easy execution

⚠️ **Relaxed Rules:**
- Docstring requirements (D100-D107) - disabled for faster development
- Import order warnings (I100-I202) - handled by isort
- Function call defaults (B008) - common FastAPI pattern
- Complex functions - increased limit to 15

## Configuration Files

```
Backend/
├── .flake8              # Flake8 configuration
├── pyproject.toml       # Black, isort, and MyPy configuration
├── requirements-dev.txt # Development dependencies
├── Makefile            # Build commands
├── lint.sh             # Linting script
└── LINTING.md          # This documentation
```

## Integration with IDEs

### VS Code
Install these extensions:
- Python (Microsoft)
- Black Formatter
- isort
- Flake8
- MyPy Type Checker

Add to `.vscode/settings.json`:
```json
{
  "python.formatting.provider": "black",
  "python.linting.enabled": true,
  "python.linting.flake8Enabled": true,
  "python.linting.mypyEnabled": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  }
}
```

### PyCharm
1. Install Black plugin
2. Configure Black as external tool
3. Enable Flake8 in Code Quality Tools
4. Configure MyPy as external tool

## Pre-commit Hooks (Optional)

Install pre-commit hooks to run linting automatically:

```bash
# Install pre-commit
pip3 install pre-commit

# Install hooks
pre-commit install

# Run on all files
pre-commit run --all-files
```

## Troubleshooting

### Common Issues

1. **Black formatting conflicts**: Run `black` before `flake8`
2. **Import order issues**: Run `isort` to fix automatically
3. **Type checking errors**: Add `# type: ignore` for external libraries
4. **Line too long**: Black handles most cases, manual breaks for complex lines

### Performance Tips

- Black processes ~60 files in ~2 seconds
- isort handles imports in ~1 second
- Flake8 checks ~60 files in ~3 seconds
- MyPy initial run is slow, subsequent runs are faster

## Best Practices

1. **Before committing**: Run `make check-all` or `./lint.sh`
2. **Fix issues incrementally**: Address critical errors first
3. **Use type hints**: Add gradual typing over time
4. **Keep functions simple**: Break down complex functions
5. **Document public APIs**: Add docstrings for public functions

## CI/CD Integration

Example GitHub Actions workflow:
```yaml
- name: Lint Python Code
  run: |
    pip install -r requirements-dev.txt
    python -m black --check app/ tests/ main.py
    python -m isort --check-only app/ tests/ main.py
    python -m flake8 app/ tests/ main.py
    python -m mypy app/ main.py --ignore-missing-imports
```

## Metrics

Current code quality metrics:
- **Files processed**: ~60 Python files
- **Critical errors**: 0 (after fixes)
- **Warnings**: ~50 (mostly docstrings and imports)
- **Type coverage**: Gradual (improving over time)
- **Complexity**: Functions under 15 complexity score
