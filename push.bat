@echo off
git add .
set /p msg="Nhap noi dung commit (hoac nhan Enter de dung mac dinh 'auto commit'): "
if "%msg%"=="" set msg=auto commit
git commit -m "%msg%"
git push
echo.
echo ==========================================
echo OKE! Da day code len Github thanh cong!
echo ==========================================
