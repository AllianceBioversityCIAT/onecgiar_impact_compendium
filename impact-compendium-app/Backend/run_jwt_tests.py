#!/usr/bin/env python3
"""
Test runner for JWT authentication tests
"""

import subprocess
import sys
import os

def run_tests():
    """Run JWT authentication tests"""
    
    # Change to backend directory
    backend_dir = "/Users/jcadavid/Desktop/DEV/Desarrollos/onecgiar_impact_compendium/impact-compendium-app/Backend"
    os.chdir(backend_dir)
    
    print("Running JWT Authentication Tests")
    print("=" * 50)
    
    # Test files to run
    test_files = [
        "tests/test_jwt_auth.py",
        "tests/test_api_endpoints.py",
        "tests/test_user_management.py"
    ]
    
    for test_file in test_files:
        print(f"\nRunning {test_file}...")
        try:
            result = subprocess.run([
                sys.executable, "-m", "pytest", 
                test_file, 
                "-v", 
                "--tb=short"
            ], capture_output=True, text=True)
            
            print(f"Exit code: {result.returncode}")
            if result.stdout:
                print("STDOUT:")
                print(result.stdout)
            if result.stderr:
                print("STDERR:")
                print(result.stderr)
                
        except Exception as e:
            print(f"Error running {test_file}: {e}")
    
    print("\n" + "=" * 50)
    print("JWT Authentication Tests Completed")

if __name__ == "__main__":
    run_tests()
