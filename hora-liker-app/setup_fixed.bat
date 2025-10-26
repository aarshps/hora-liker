@echo off
echo Setting up the Hora-Liker application...

echo.
echo === Checking for Python ===
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed or not in PATH.
    echo Please install Python from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation.
    pause
    exit /b 1
) else (
    echo Python is installed.
    python --version
)

echo.
echo === Checking for CMake (required for dlib) ===
where cmake >nul 2>&1
if %errorlevel% EQU 0 (
    echo CMake is installed.
    cmake --version
    echo CMake check passed.
    goto cmake_check_passed
) else (
    echo CMake is not installed or not in PATH.
    echo CMake is required to install dlib for enhanced facial feature extraction.
    echo.
    echo Please install CMake from https://cmake.org/download/
    echo 1. Download the Windows installer (cmake-*-windows-x86_64.msi)
    echo 2. Run the installer
    echo 3. Make sure to check "Add CMake to system PATH" during installation
    echo.
    echo After installing CMake, please run this setup script again.
    echo.
    pause
    exit /b 1
)

:cmake_check_passed
echo.
echo === Creating Virtual Environment ===
cd /d "%~dp0ml"
if exist venv (
    echo Removing existing virtual environment...
    rmdir /s /q venv
    if %errorlevel% neq 0 (
        echo Failed to remove existing virtual environment.
        pause
        exit /b 1
    )
    echo Existing virtual environment removed.
)

echo Creating virtual environment...
python -m venv venv
if %errorlevel% neq 0 (
    echo Failed to create virtual environment.
    pause
    exit /b 1
)
echo Virtual environment created.

echo.
echo === Activating Virtual Environment ===
call venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo Failed to activate virtual environment.
    pause
    exit /b 1
)
echo Virtual environment activated.

echo.
echo === Upgrading pip ===
python -m pip install --upgrade pip
if %errorlevel% neq 0 (
    echo Failed to upgrade pip.
    pause
    exit /b 1
)
echo pip upgraded.

echo.
echo === Installing setuptools and wheel ===
pip install --upgrade setuptools wheel
if %errorlevel% neq 0 (
    echo Failed to install setuptools and wheel.
    pause
    exit /b 1
)
echo setuptools and wheel installed.

echo.
echo === Installing Python Dependencies ===
echo Installing numpy...
pip install numpy --only-binary=all
if %errorlevel% neq 0 (
    echo Failed to install numpy.
    echo Trying alternative method to install numpy...
    pip install numpy
    if %errorlevel% neq 0 (
        echo Failed to install numpy with alternative method.
        pause
        exit /b 1
    )
)
echo numpy installed.

echo Installing opencv-python...
pip install opencv-python --only-binary=all
if %errorlevel% neq 0 (
    echo Failed to install opencv-python.
    echo Trying alternative method to install opencv-python...
    pip install opencv-python
    if %errorlevel% neq 0 (
        echo Failed to install opencv-python with alternative method.
        pause
        exit /b 1
    )
)
echo opencv-python installed.

echo Installing scikit-learn...
pip install scikit-learn --only-binary=all
if %errorlevel% neq 0 (
    echo Failed to install scikit-learn.
    echo Trying alternative method to install scikit-learn...
    pip install scikit-learn
    if %errorlevel% neq 0 (
        echo Failed to install scikit-learn with alternative method.
        echo Checking if scikit-learn is already installed...
        python -c "import sklearn; print('scikit-learn is already installed')"
        if %errorlevel% neq 0 (
            echo Failed to install scikit-learn with alternative method and it's not already installed.
            pause
            exit /b 1
        ) else (
            echo scikit-learn is already installed, continuing...
        )
    )
)
echo scikit-learn installed.

echo Installing joblib...
pip install joblib
if %errorlevel% neq 0 (
    echo Failed to install joblib.
    echo Checking if joblib is already installed...
    python -c "import joblib; print('joblib is already installed')"
    if %errorlevel% neq 0 (
        echo Failed to install joblib and it's not already installed.
        pause
        exit /b 1
    ) else (
        echo joblib is already installed, continuing...
    )
)
echo joblib installed.

echo Installing dlib...
pip install dlib
if %errorlevel% neq 0 (
    echo Failed to install dlib.
    echo Trying alternative installation method...
    pip install https://pypi.python.org/packages/cp37/d/dlib/dlib-19.19.0-cp37-cp37m-win_amd64.whl
    if %errorlevel% neq 0 (
        echo Failed to install dlib with alternative method.
        echo Checking if dlib is already installed...
        python -c "import dlib; print('dlib is already installed')"
        if %errorlevel% neq 0 (
            echo Failed to install dlib and it's not already installed.
            echo.
            echo Please try the following:
            echo 1. Make sure CMake is properly installed and in PATH
            echo 2. Try installing dlib manually: pip install dlib
            echo 3. If that fails, try: pip install cmake followed by pip install dlib
            echo.
            pause
            exit /b 1
        ) else (
            echo dlib is already installed, continuing...
        )
    ) else (
        echo dlib installed using alternative method.
    )
) else (
    echo dlib installed.
)

echo Installing imutils...
pip install imutils
if %errorlevel% neq 0 (
    echo Failed to install imutils.
    echo Checking if imutils is already installed...
    python -c "import imutils; print('imutils is already installed')"
    if %errorlevel% neq 0 (
        echo Failed to install imutils and it's not already installed.
        pause
        exit /b 1
    ) else (
        echo imutils is already installed, continuing...
    )
)
echo imutils installed.

echo All Python dependencies installed.

echo.
echo === Downloading dlib facial landmark model ===
echo This may take a few minutes as the file is approximately 60MB.
python -c "import urllib.request; urllib.request.urlretrieve('http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2', 'shape_predictor_68_face_landmarks.dat.bz2')"
if %errorlevel% neq 0 (
    echo Failed to download dlib model.
    echo Please manually download the model from:
    echo http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2
    echo Extract it and place it in the ml directory.
    pause
    exit /b 1
)
echo Download completed.

echo Extracting model...
python -c "import bz2; open('shape_predictor_68_face_landmarks.dat', 'wb').write(bz2.decompress(open('shape_predictor_68_face_landmarks.dat.bz2', 'rb').read()))"
if %errorlevel% neq 0 (
    echo Failed to extract dlib model.
    pause
    exit /b 1
)
echo Extraction completed.

echo Cleaning up...
del shape_predictor_68_face_landmarks.dat.bz2
echo Cleanup completed.

echo dlib facial landmark model downloaded and extracted.

echo.
echo === Installing Node.js Backend Dependencies ===
cd /d "%~dp0backend"
if exist node_modules (
    echo Removing existing backend dependencies...
    rmdir /s /q node_modules
    if %errorlevel% neq 0 (
        echo Failed to remove existing backend dependencies.
        pause
        exit /b 1
    )
    echo Existing backend dependencies removed.
)

echo Installing backend dependencies...
npm install
if %errorlevel% neq 0 (
    echo Failed to install backend dependencies.
    pause
    exit /b 1
)
echo Backend dependencies installed.

echo.
echo === Installing Node.js Frontend Dependencies ===
cd /d "%~dp0frontend"
if exist node_modules (
    echo Removing existing frontend dependencies...
    rmdir /s /q node_modules
    if %errorlevel% neq 0 (
        echo Failed to remove existing frontend dependencies.
        pause
        exit /b 1
    )
    echo Existing frontend dependencies removed.
)

echo Installing frontend dependencies...
npm install
if %errorlevel% neq 0 (
    echo Failed to install frontend dependencies.
    pause
    exit /b 1
)
echo Frontend dependencies installed.

echo.
echo === Setup Complete ===
echo.
echo To run the application:
echo 1. Start the backend server:
echo    Double-click start-backend.bat
echo.
echo 2. Start the frontend server (in a new terminal):
echo    Double-click start-frontend.bat
echo.
echo 3. Open your browser and go to http://localhost:5173
echo.
pause