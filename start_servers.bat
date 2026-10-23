@echo off
echo Starting DataForge AI Backend on http://localhost:8000 ...
start "DataForge AI Backend" cmd /k "cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

echo Starting DataForge AI Frontend on http://localhost:5173 ...
start "DataForge AI Frontend" cmd /k "cd frontend && npm run dev"

echo Both servers started!
echo Frontend: http://localhost:5173
echo Backend API Docs: http://localhost:8000/docs
pause
