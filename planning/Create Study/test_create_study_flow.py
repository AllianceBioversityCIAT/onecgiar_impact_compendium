#!/usr/bin/env python3
"""
Test script for Create Study functionality
Tests the complete flow from form data to database insertion
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_reference_endpoints():
    """Test all reference data endpoints"""
    print("🔍 Testing Reference Data Endpoints...")
    
    endpoints = [
        "categories",
        "intervention-types", 
        "crop-types",
        "impact-areas",
        "initiatives",
        "centers",
        "countries",
        "regions"
    ]
    
    results = {}
    for endpoint in endpoints:
        try:
            response = requests.get(f"{BASE_URL}/reference/{endpoint}")
            if response.status_code == 200:
                data = response.json()
                results[endpoint] = {"status": "✅", "count": len(data), "sample": data[0] if data else None}
                print(f"  ✅ {endpoint}: {len(data)} items")
            else:
                results[endpoint] = {"status": "❌", "error": f"HTTP {response.status_code}"}
                print(f"  ❌ {endpoint}: HTTP {response.status_code}")
        except Exception as e:
            results[endpoint] = {"status": "❌", "error": str(e)}
            print(f"  ❌ {endpoint}: {e}")
    
    return results

def test_create_study():
    """Test create study endpoint with form-like data"""
    print("\n🔍 Testing Create Study Endpoint...")
    
    # Simulate Step 1 form data
    form_data = {
        "title": "Automated Test Study - Impact Assessment",
        "year": 2024,
        "summary": "This study evaluates the impact of improved maize varieties on smallholder farmer productivity in East Africa. The research was conducted over 24 months across multiple sites.",
        "category_id": 1,  # Impact Study
        "doi": "10.1234/automated-test-2024",
        "period_start": "2022-01-01",
        "period_end": "2023-12-31",
        "intervention_details": "Distribution of drought-resistant maize varieties with accompanying training on improved agricultural practices"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/studies-crud/",
            headers={"Content-Type": "application/json"},
            json=form_data
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"  ✅ Study created successfully!")
            print(f"     Study ID: {result['data']['study_id']}")
            print(f"     Title: {result['data']['title']}")
            return result['data']['study_id']
        else:
            print(f"  ❌ Failed to create study: HTTP {response.status_code}")
            print(f"     Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"  ❌ Error creating study: {e}")
        return None

def test_form_validation():
    """Test form validation by sending invalid data"""
    print("\n🔍 Testing Form Validation...")
    
    # Test missing required fields
    invalid_data = {
        "summary": "Study without title",
        "year": 2024
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/studies-crud/",
            headers={"Content-Type": "application/json"},
            json=invalid_data
        )
        
        if response.status_code != 200:
            print(f"  ✅ Validation working: HTTP {response.status_code}")
        else:
            print(f"  ⚠️  Validation might be missing: Study created without required fields")
            
    except Exception as e:
        print(f"  ❌ Error testing validation: {e}")

def main():
    """Run all tests"""
    print("🚀 Starting Create Study Flow Tests")
    print("=" * 50)
    
    # Test 1: Reference endpoints
    ref_results = test_reference_endpoints()
    
    # Test 2: Create study
    study_id = test_create_study()
    
    # Test 3: Form validation
    test_form_validation()
    
    # Summary
    print("\n📊 Test Summary")
    print("=" * 50)
    
    ref_success = sum(1 for r in ref_results.values() if r["status"] == "✅")
    ref_total = len(ref_results)
    
    print(f"Reference Endpoints: {ref_success}/{ref_total} working")
    print(f"Create Study: {'✅ Working' if study_id else '❌ Failed'}")
    
    if ref_success == ref_total and study_id:
        print("\n🎉 All tests passed! Create Study functionality is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Check the output above for details.")

if __name__ == "__main__":
    main()
