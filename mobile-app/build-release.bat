@echo off
REM Build release APK + AAB with a short Gradle home (avoids Windows 260-char path limit)
set "GRADLE_USER_HOME=D:\gradle-home"
if not exist "%GRADLE_USER_HOME%" mkdir "%GRADLE_USER_HOME%"
cd /d "%~dp0"
echo Generating Android launcher icons...
call node scripts\generate-android-icons.js
cd android
call gradlew.bat assembleRelease bundleRelease %*
echo.
echo APK: %~dp0android\app\build\outputs\apk\release\app-release.apk
echo AAB: %~dp0android\app\build\outputs\bundle\release\app-release.aab
