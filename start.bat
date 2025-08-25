@echo off
REM Start local server and open browser; requires Python installed.
start "" /B python -m http.server 8080
timeout /t 1 >nul
start "" "http://127.0.0.1:8080/index.html"
echo Server started at http://127.0.0.1:8080
pause
