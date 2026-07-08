#!/usr/bin/env bash
# File: scripts/start_local.sh
# Purpose: Local build + run of Impact Compendium (frontend + backend)
# Author: Amazon Q Automation
# Usage: ./scripts/start_local.sh

set -e
set -o pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Impact Compendium Local Environment${NC}"

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

command -v node >/dev/null || { echo -e "${RED}❌ Node.js missing${NC}"; exit 1; }
command -v python3 >/dev/null || { echo -e "${RED}❌ Python3 missing${NC}"; exit 1; }
command -v npm >/dev/null || { echo -e "${RED}❌ npm missing${NC}"; exit 1; }

NODE_VERSION=$(node --version)
PYTHON_VERSION=$(python3 --version)
echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"
echo -e "${GREEN}✅ Python: $PYTHON_VERSION${NC}"

# Load environment variables from .env file
echo -e "${YELLOW}🔧 Loading environment variables from .env...${NC}"
if [ -f "Backend/.env" ]; then
    export $(grep -v '^#' Backend/.env | xargs)
    export API_PORT=8000
    export VITE_API_BASE_URL=http://localhost:${API_PORT}
    echo -e "${GREEN}✅ Environment loaded from Backend/.env${NC}"
else
    echo -e "${RED}❌ Backend/.env file not found${NC}"
    exit 1
fi

# Setup Backend
echo -e "${BLUE}🐍 Setting up Python Backend...${NC}"
cd Backend

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo -e "${YELLOW}📦 Creating Python virtual environment...${NC}"
    python3 -m venv .venv
fi

# Activate virtual environment
source .venv/bin/activate

# Install dependencies
echo -e "${YELLOW}📦 Installing Python dependencies...${NC}"
pip install -r requirements.txt

# Test database connection
echo -e "${YELLOW}🔍 Testing database connection...${NC}"
python3 -c "
import pymysql
try:
    conn = pymysql.connect(
        host='${DB_HOST}',
        user='${DB_USER}',
        password='${DB_PASSWORD}',
        database='${DB_NAME}',
        port=${DB_PORT}
    )
    cur = conn.cursor()
    cur.execute('SELECT 1')
    result = cur.fetchone()
    conn.close()
    print('✅ Database connection successful')
except Exception as e:
    print(f'❌ Database connection failed: {e}')
    exit(1)
"

# Setup Frontend
echo -e "${BLUE}⚛️ Setting up React Frontend...${NC}"
cd ../Frontend

# Install frontend dependencies
echo -e "${YELLOW}📦 Installing Node.js dependencies...${NC}"
npm install

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}📝 Creating .env.local...${NC}"
    cat > .env.local << EOF
VITE_API_BASE_URL=http://localhost:${API_PORT}
VITE_APP_NAME=Impact Compendium
EOF
fi

# Go back to project root
cd ..

# Function to cleanup processes
cleanup() {
    echo -e "\n${RED}🛑 Stopping servers...${NC}"
    if [ ! -z "$BACK_PID" ]; then
        kill $BACK_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONT_PID" ]; then
        kill $FRONT_PID 2>/dev/null || true
    fi
    echo -e "${GREEN}✅ Cleanup complete${NC}"
    exit 0
}

# Set trap for cleanup
trap cleanup INT TERM

# Start Backend Server
echo -e "${GREEN}▶️ Starting FastAPI Backend on http://localhost:${API_PORT}${NC}"
cd Backend
source .venv/bin/activate
uvicorn app.main:app --reload --port ${API_PORT} --host 0.0.0.0 &
BACK_PID=$!

# Wait a moment for backend to start
sleep 3

# Start Frontend Server
echo -e "${GREEN}▶️ Starting React Frontend on http://localhost:5173${NC}"
cd ../Frontend
npm run dev &
FRONT_PID=$!

# Display running services
echo -e "\n${BLUE}🌐 Services Running:${NC}"
echo -e "${GREEN}  • Backend API: http://localhost:${API_PORT}${NC}"
echo -e "${GREEN}  • Frontend App: http://localhost:5173${NC}"
echo -e "${GREEN}  • API Docs: http://localhost:${API_PORT}/docs${NC}"
echo -e "\n${YELLOW}Press CTRL+C to stop all services${NC}"

# Wait for processes
wait