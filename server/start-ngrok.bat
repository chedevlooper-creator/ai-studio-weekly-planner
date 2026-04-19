@echo off
REM Tunnels the local OpenClaw proxy (webhook-server.ts) so other devices or webhooks can reach it.
REM Default port matches WEBHOOK_PORT / PORT (see .env.local). Pass a port as first arg if yours differs.
REM Example: start-ngrok.bat 3002
set "TUNNEL_PORT=%~1"
if "%TUNNEL_PORT%"=="" set "TUNNEL_PORT=3001"
echo.
echo Ngrok -> http://127.0.0.1:%TUNNEL_PORT%  (OpenClaw proxy)
echo Set VITE_OPENCLAW_PROXY to the https URL ngrok shows when testing the Vite app against the tunnel.
echo.
ngrok http %TUNNEL_PORT%
