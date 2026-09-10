@echo off
setlocal EnableDelayedExpansion

REM ============================================================
REM  Phat hanh mot phien ban len production.
REM
REM    deploy.bat 1.0.1 "Va loi dang nhap Google"
REM
REM  Vercel chi build khi commit CO TAG (scripts/vercel-ignore-build.sh),
REM  va push tag don thuan KHONG kich hoat build nao - phai co push len
REM  branch voi tag nam san o HEAD. File nay lam dung thu tu do.
REM
REM  LUU Y: file .bat bat buoc dung line ending CRLF. Neu editor luu thanh
REM  LF thi cmd.exe parse loan het, bao "is not recognized" tung dong.
REM ============================================================

if "%~1"=="" goto :huong_dan
if "%~2"=="" goto :huong_dan

set "VERSION=%~1"
set "MESSAGE=%~2"

REM Cho phep go "1.0.1" lan "v1.0.1" - bo tien to v neu co.
if /i "!VERSION:~0,1!"=="v" set "VERSION=!VERSION:~1!"
set "TAG=v!VERSION!"

echo.
echo === Kiem tra truoc khi phat hanh ===

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
  echo [LOI] Khong phai thu muc git.
  exit /b 1
)

set "BRANCH="
for /f "delims=" %%b in ('git branch --show-current') do set "BRANCH=%%b"
if not "!BRANCH!"=="main" (
  echo [LOI] Dang o nhanh "!BRANCH!", khong phai main.
  echo       Chi phat hanh tu main de tag luon tro vao code that su chay production.
  exit /b 1
)

git rev-parse --verify --quiet "refs/tags/!TAG!" >nul 2>&1
if not errorlevel 1 (
  echo [LOI] Tag !TAG! da ton tai. Dung so phien ban khac.
  exit /b 1
)

REM Co thay doi nao khong. KHONG dung `find /c` o day: neu may co cai Git Bash
REM va usr\bin nam truoc System32 trong PATH, `find` bi resolve sang find cua
REM Unix, no bo qua tham so va di quet ca o C - treo may, khong bao loi gi.
set "CO_THAY_DOI="
for /f "delims=" %%i in ('git status --porcelain') do set "CO_THAY_DOI=1"

echo Nhanh   : !BRANCH!
echo Tag moi : !TAG!
echo Ghi chu : !MESSAGE!
echo.
echo === Thay doi se duoc commit ===
if not defined CO_THAY_DOI (
  echo   (khong co thay doi - se tao commit rong de kich hoat build)
) else (
  git status --short
)
echo.

set "XACNHAN="
set /p "XACNHAN=Phat hanh !TAG! len production? [y/N] "
if /i not "!XACNHAN!"=="y" (
  echo Da huy. Khong co gi thay doi.
  exit /b 0
)

echo.
echo === Dang phat hanh ===

if not defined CO_THAY_DOI (
  git commit --allow-empty -m "!MESSAGE!"
) else (
  git add -A
  git commit -m "!MESSAGE!"
)
if errorlevel 1 (
  echo [LOI] Commit that bai.
  exit /b 1
)

REM BAT BUOC dung -a (annotated). Tag nhe khong bao gio duoc --follow-tags day
REM len remote - no bi bo qua im lang, khong bao loi, va build khong chay.
git tag -a "!TAG!" -m "!MESSAGE!"
if errorlevel 1 (
  echo [LOI] Tao tag that bai.
  exit /b 1
)

git push --follow-tags
if errorlevel 1 (
  echo [LOI] Push that bai. Tag !TAG! van con o local:
  echo       go "git tag -d !TAG!" neu muon lam lai.
  exit /b 1
)

echo.
echo === Xong ===
echo Da day !TAG! len GitHub. Vercel se bat dau build trong vai giay.
echo Kiem tra tab Deployments tren Vercel - phai la "Building".
exit /b 0

:huong_dan
echo.
echo   Cach dung:  deploy.bat VERSION "GHI CHU"
echo.
echo   Vi du:      deploy.bat 1.0.1 "Va loi dang nhap Google"
echo               deploy.bat 1.1.0 "Them trang lich su trai bai"
echo.
exit /b 1
