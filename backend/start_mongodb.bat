@echo off
echo Starting MongoDB with Docker Compose...
echo.

REM Check if Docker is running
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

REM Start MongoDB and Mongo Express
echo Starting MongoDB and Mongo Express...
docker-compose up -d

echo.
echo MongoDB is starting up...
echo You can access:
echo - MongoDB: localhost:27017
echo - Mongo Express (Web UI): http://localhost:8081
echo   Username: admin
echo   Password: password
echo.
echo Starting Flask application...
echo.
python app.py 