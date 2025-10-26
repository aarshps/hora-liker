@echo off
echo Starting Hora-Liker Backend Server...

echo.
echo === Activating Virtual Environment ===
cd /d "%~dp0ml"
call venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo Failed to activate virtual environment.
    pause
    exit /b 1
)
echo Virtual environment activated.

echo.
echo === Starting Backend Server ===
cd /d "%~dp0backend"
npm start