@echo off

RMDIR /S /Q ".build" > nul

echo Copying resources...
ROBOCOPY "assets" ".build/assets" /e > nul 
ROBOCOPY "images" ".build/images" /e > nul 
ROBOCOPY "src" ".build/src" /e > nul 
copy /b icon.png .build\icon.png > nul
copy /b manifest-chromium.json .build\manifest.json > nul

"C:\Program Files\7-Zip\7z.exe" a BillKolumbert-Chrome.zip ./.build/* -tzip > nul
RMDIR /S /Q ".build" > nul

