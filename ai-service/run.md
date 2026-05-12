
cd ai-service

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt

uvicorn main:app --reload


# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: AI Service
cd ai-service && uvicorn main:app --reload --port 8000
