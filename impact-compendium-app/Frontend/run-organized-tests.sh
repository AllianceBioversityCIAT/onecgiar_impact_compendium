#!/bin/bash

# UI Test Execution Script with Organized Results
# Impact Compendium Application - Frontend Testing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULTS_DIR="test-results"
SCREENSHOTS_DIR="$RESULTS_DIR/screenshots"
REPORTS_DIR="$RESULTS_DIR/html-report"

echo -e "${BLUE}🧪 Impact Compendium - UI Test Suite${NC}"
echo -e "${BLUE}======================================${NC}"
echo "Timestamp: $TIMESTAMP"
echo "Results Directory: $RESULTS_DIR"
echo ""

# Create results directories
mkdir -p "$SCREENSHOTS_DIR"
mkdir -p "$REPORTS_DIR"
mkdir -p "$RESULTS_DIR/artifacts"

# Function to run test suite
run_test_suite() {
    local suite_name=$1
    local test_command=$2
    
    echo -e "${YELLOW}Running $suite_name tests...${NC}"
    
    if npm run $test_command; then
        echo -e "${GREEN}✅ $suite_name tests passed${NC}"
        return 0
    else
        echo -e "${RED}❌ $suite_name tests failed${NC}"
        return 1
    fi
}

# Function to check if application is running
check_app_status() {
    echo -e "${BLUE}Checking application status...${NC}"
    
    if curl -s -o /dev/null -w "%{http_code}" https://dt3m7tyug8c1q.cloudfront.net | grep -q "200"; then
        echo -e "${GREEN}✅ Application is accessible${NC}"
        return 0
    else
        echo -e "${RED}❌ Application is not accessible${NC}"
        return 1
    fi
}

# Function to generate test summary
generate_summary() {
    local total_tests=$1
    local passed_tests=$2
    local failed_tests=$3
    
    echo -e "\n${BLUE}📊 Test Execution Summary${NC}"
    echo -e "${BLUE}=========================${NC}"
    echo "Total Test Suites: $total_tests"
    echo -e "Passed: ${GREEN}$passed_tests${NC}"
    echo -e "Failed: ${RED}$failed_tests${NC}"
    echo "Results Location: $RESULTS_DIR"
    echo "Screenshots: $SCREENSHOTS_DIR"
    echo "HTML Report: $REPORTS_DIR"
    
    if [ $failed_tests -eq 0 ]; then
        echo -e "\n${GREEN}🎉 All tests passed successfully!${NC}"
    else
        echo -e "\n${RED}⚠️  Some tests failed. Check the reports for details.${NC}"
    fi
}

# Main execution
main() {
    local total_suites=0
    local passed_suites=0
    local failed_suites=0
    
    # Check application status
    if ! check_app_status; then
        echo -e "${RED}Cannot proceed with tests - application not accessible${NC}"
        exit 1
    fi
    
    echo -e "\n${BLUE}🚀 Starting UI Test Execution${NC}"
    
    # Clean previous results
    echo -e "${YELLOW}Cleaning previous test results...${NC}"
    npm run test:clean
    
    # Test suites to run
    declare -a suite_names=("Authentication" "Dashboard" "Studies_Management" "Responsive_Design" "Performance_Accessibility")
    declare -a test_commands=("test:auth" "test:dashboard" "test:studies" "test:responsive" "test:performance")
    
    # Run each test suite
    for i in "${!suite_names[@]}"; do
        suite_name="${suite_names[$i]// /_}"
        test_command="${test_commands[$i]}"
        total_suites=$((total_suites + 1))
        
        if run_test_suite "${suite_name//_/ }" "$test_command"; then
            passed_suites=$((passed_suites + 1))
        else
            failed_suites=$((failed_suites + 1))
        fi
        
        echo ""
    done
    
    # Run comprehensive test suite
    echo -e "${YELLOW}Running comprehensive test suite...${NC}"
    total_suites=$((total_suites + 1))
    
    if run_test_suite "Full Application Flow" "test:full-suite"; then
        passed_suites=$((passed_suites + 1))
    else
        failed_suites=$((failed_suites + 1))
    fi
    
    # Generate final summary
    generate_summary $total_suites $passed_suites $failed_suites
    
    # Open test report if all tests passed
    if [ $failed_suites -eq 0 ]; then
        echo -e "\n${BLUE}Opening test report...${NC}"
        npm run test:report
    fi
    
    # Exit with appropriate code
    if [ $failed_suites -gt 0 ]; then
        exit 1
    else
        exit 0
    fi
}

# Execute main function
main "$@"
