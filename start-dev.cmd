@echo off
set JWT_SECRET=dev-secret-123
start /B node server\index.cjs
start /B npx vite --port=3002 --host=0.0.0.0
