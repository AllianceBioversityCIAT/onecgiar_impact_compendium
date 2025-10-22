# Impact Compendium Application

## Quick Start

### Local Development
```bash
# Start both frontend and backend servers
./scripts/start_local.sh
```

**Services:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Prerequisites
- Node.js ≥16
- Python ≥3.11
- npm
- Access to RDS database

### Project Structure
```
impact-compendium-app/
├── Frontend/          # React + Vite application
├── Backend/           # FastAPI Python application  
├── Infrastructure/    # AWS SAM templates
└── scripts/          # Automation scripts
```

### Environment Configuration
The startup script automatically configures:
- Database connection to RDS instance
- API port (8000) and frontend port (5173)
- Environment variables for both services

### Stopping Services
Press `CTRL+C` to stop all running services.