@echo off
title ImageScreen 100%% Local - Affichage Dynamique
cd /d "%~dp0"

echo ===================================================
echo    ImageScreen (100%% Local) - Affichage Dynamique
echo ===================================================
echo.
echo Verification des dependances...
echo.

if not exist node_modules (
    echo [1/3] Installation des dependances racine...
    call npm install
) else (
    echo [1/3] Dependances racine ok.
)

if not exist backend\node_modules (
    echo [2/3] Installation des dependances Backend...
    call npm install --prefix backend
) else (
    echo [2/3] Dependances Backend ok.
)

if not exist frontend\node_modules (
    echo [3/3] Installation des dependances Frontend...
    call npm install --prefix frontend --legacy-peer-deps
) else (
    echo [3/3] Dependances Frontend ok.
)

echo.
echo Compilation du Frontend pour la production...
call npm run build
echo.

echo ===================================================
echo Demarrage du serveur local...
echo.
echo Accedez a l'administration : http://localhost:5000
echo Accedez au lecteur TV (sur Smart TV / Tablette) :
echo http://[ADRESSE_IP_DU_PC]:5000/tv
echo ===================================================
echo.

npm run backend
pause
