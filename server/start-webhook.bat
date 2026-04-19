@echo off
:restart
echo [%date% %time%] Webhook sunucusu baslatiliyor...
npx tsx server/webhook-server.ts
echo [%date% %time%] Sunucu durdu, 3 saniye sonra yeniden baslatiliyor...
timeout /t 3 /nobreak >nul
goto restart
