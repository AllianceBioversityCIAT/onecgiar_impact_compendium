#!/usr/bin/env python3
"""
Test Runner for Impact Compendium Backend
=========================================

Simple test runner script for running the test suite.
"""

import subprocess
import sys
import os

def run_tests():
    """Run the test suite with appropriate options"""
    
    # Change to backend directory
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(backend_dir)
    
    print("🧪 Running Impact Compendium Backend Tests")
    print("=" * 50)
    
    # Test commands
    commands = {
        "unit": ["python", "-m", "pytest", "tests/test_studies_crud.py", "-v", "--tb=short"],
        "all": ["python", "-m", "pytest", "tests/", "-v", "--tb=short"],
        "coverage": ["python", "-m", "pytest", "tests/", "--cov=app", "--cov-report=html", "--cov-report=term"],
        "integration": ["python", "-m", "pytest", "tests/", "-m", "integration", "-v"],
        "performance": ["python", "-m", "pytest", "tests/", "-m", "performance", "-v"]
    }
    
    # Default to unit tests
    test_type = sys.argv[1] if len(sys.argv) > 1 else "unit"
    
    if test_type not in commands:
        print(f"❌ Unknown test type: {test_type}")
        print(f"Available options: {', '.join(commands.keys())}")
        return 1
    
    try:
        print(f"Running {test_type} tests...")
        result = subprocess.run(commands[test_type], check=True)
        print(f"✅ {test_type.title()} tests completed successfully!")
        return 0
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Tests failed with exit code {e.returncode}")
        return e.returncode
    except FileNotFoundError:
        print("❌ pytest not found. Install with: pip install pytest")
        return 1

if __name__ == "__main__":
    exit_code = run_tests()
    sys.exit(exit_code)
