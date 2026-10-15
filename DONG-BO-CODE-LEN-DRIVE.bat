@echo off
chcp 65001 > nul
echo ========================================================
echo 🚀 ĐANG ĐÓNG GÓI VÀ ĐỒNG BỘ MÃ NGUỒN SANG GOOGLE DRIVE...
echo 📁 Đích đến: G:\My Drive\Ace Games Sync\repomix-codebase.txt
echo ========================================================

cd /d "%~dp0"
call npm run sync:gemini

echo.
echo ========================================================
echo ✅ ĐÃ ĐỒNG BỘ THÀNH CÔNG LÊN GOOGLE DRIVE!
echo 👉 Gemini Web đã có thể đọc mã nguồn mới nhất!
echo ========================================================
timeout /t 5
