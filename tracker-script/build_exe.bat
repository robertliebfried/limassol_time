@echo off
echo ========================================
echo  Limassol Tracker - Building EXE...
echo ========================================
echo.

pip install requests pyinstaller --quiet

echo Building...
pyinstaller --onefile --windowed --name "LimassolTracker" limassol_sync.py

echo.
echo ========================================
echo  ГОТОВО!
echo  Файл: dist\LimassolTracker.exe
echo ========================================
pause
