@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
set "SRC=%cd%"
set "DEST=%SRC%\bouillante fiche"
if not exist "%DEST%" mkdir "%DEST%"
echo === Copie fiches Bouillante - fichiers PDF trouves par nom ===
echo Source : %SRC%
echo Destination : %DEST%
echo.
set /a NB=0
call :COPIER "ABENAQUI"
call :COPIER "ASDRUBAL"
call :COPIER "BALTUS"
call :COPIER "BAPTISTE"
call :COPIER "BENJAMIN"
call :COPIER "BOISDUR"
call :COPIER "CAFFA"
call :COPIER "CLARKE"
call :COPIER "DABRIOU"
call :COPIER "DAMBURY"
call :COPIER "DARLIS"
call :COPIER "ELIEN"
call :COPIER "ELISABETH"
call :COPIER "ELMACIN"
call :COPIER "ENGOULEVENT"
call :COPIER "FELIX"
call :COPIER "FEUILLARD"
call :COPIER "FICADIERE"
call :COPIER "FIRPION"
call :COPIER "GUERET"
call :COPIER "GUILLAUME"
call :COPIER "HATIL"
call :COPIER "LABIRIN"
call :COPIER "LANCASTRE"
call :COPIER "LAURENT"
call :COPIER "LEGRAVE"
call :COPIER "LOISEAU"
call :COPIER "LUCE"
call :COPIER "MACIN"
call :COPIER "MICOLON"
call :COPIER "MONTOUT"
call :COPIER "PALMYRE"
call :COPIER "RACON"
call :COPIER "SAINT-JULIEN"
call :COPIER "SAINT-PHOR"
echo.
echo Nombre de fichiers copies : %NB%
pause
exit /b

:COPIER
set "NOM=%~1"
set "TROUVE=0"
for %%F in ("%SRC%\*%NOM%*.pdf") do (
  if exist "%%~fF" (
    copy /Y "%%~fF" "%DEST%\" >nul
    echo Copie : %%~nxF
    set /a NB+=1
    set "TROUVE=1"
  )
)
if "%TROUVE%"=="0" echo Non trouve : %NOM%
exit /b
