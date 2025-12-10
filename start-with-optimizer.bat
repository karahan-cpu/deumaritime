@echo off
echo Starting Maritime Emissions Calculator with Python Optimization...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)

REM Check if pip packages are installed
echo Checking Python dependencies...
pip show scipy >nul 2>&1
if errorlevel 1 (
    echo Installing Python dependencies...
    pip install -r server\requirements.txt
)

echo.
echo Starting Python Optimization Service on port 5001...
start "Python Optimizer" cmd /k "python server\optimizer_api.py"

timeout /t 3 /nobreak >nul

echo.
echo Starting Main Application on port 5000...
start "Main App" cmd /k "npm run dev"

echo.
echo ========================================
echo Maritime Emissions Calculator Started!
echo ========================================
echo.
echo Main App:        http://localhost:5000
echo Optimizer API:   http://localhost:5001
echo.
echo Press any key to stop all services...
pause >nul

taskkill /FI "WINDOWTITLE eq Python Optimizer*" /T /F
taskkill /FI "WINDOWTITLE eq Main App*" /T /F
