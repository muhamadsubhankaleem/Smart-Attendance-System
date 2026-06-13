# Smart Attendance System

A modern, full-stack attendance management system with AI-powered features.

## Tech Stack
- **Frontend**: React + Vite (premium dark-mode UI)
- **Backend**: FastAPI + MongoDB
- **Auth**: JWT tokens

## Quick Start

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173

### Backend
```bash
cd backend
pip install -r requirements.txt
python app/main.py
```
API runs at http://localhost:8000

### Environment
Copy `backend/.env` and update `MONGO_URI` if using MongoDB Atlas.

## Features
- Face Recognition attendance
- QR Code scanning
- Real-time analytics dashboard
- JWT authentication
- Course management
- Export reports
