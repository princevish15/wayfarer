# Wayfarer: Personalized Travel Itinerary Planner

An AI-powered full-stack web app that generates customized day-by-day travel itineraries from a traveler's destination, dates, budget, interests and pace.

## Architecture

```
User -> Frontend (React + Vite, Vercel) <-> Backend (FastAPI, Render)
                                              |-> Supabase   (Auth + Postgres database)
                                              |-> Groq AI    (generative itinerary)
                                              |-> Unsplash   (images)
```

- **Frontend** talks to Supabase directly for sign-in and for saving trips (protected by Row Level Security), and to the FastAPI backend for AI generation.
- **Backend** verifies the Supabase session token, builds the prompt, calls Groq for structured JSON, validates and normalises the result (recomputes costs), and attaches Unsplash photos.

## Features

- Email/password sign-up and sign-in (Supabase Auth)
- Dashboard with saved trips and summary stats
- Smart trip builder: destination, dates, budget, travelers, trip type, interests, pace, stay type, free-text notes
- AI itinerary: attractions, food, stay and transport per day with timings, costs and photos
- Edit costs, remove activities, and **regenerate a single day** with an optional instruction
- Live budget tracker with over-budget warning
- Print / save as PDF
- Google Maps links per place and a multi-stop route for each day
- Read-only share link for a trip (run `supabase/share.sql` once in the SQL editor)

## Project structure

```
backend/    FastAPI app (main.py, requirements.txt, .env.example)
frontend/   React + Vite app
supabase/   schema.sql (tables + Row Level Security)
```

## Prerequisites

- Node.js 18+ and Python 3.10+
- A [Supabase](https://supabase.com) project (free tier)
- A [Groq](https://console.groq.com) API key
- An [Unsplash](https://unsplash.com/developers) access key (optional; without it the app works without photos)

## Setup

### 1. Supabase
1. Create a project.
2. Open **SQL Editor** and run `supabase/schema.sql`.
3. Under **Authentication > Providers**, keep Email enabled (turn off "Confirm email" for quicker local testing).
4. Copy the **Project URL** and **anon public key** from **Project Settings > API**.

### 2. Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env    # fill in the keys
uvicorn main:app --reload --port 8000
```
API docs: http://localhost:8000/docs

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env    # fill in Supabase URL/key and VITE_API_URL
npm run dev
```
Open http://localhost:5173

## API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Liveness check |
| POST | `/api/itinerary/generate` | Generate a full itinerary from trip preferences |
| POST | `/api/itinerary/regenerate-day` | Regenerate one day, avoiding places used on other days |

Both POST endpoints require `Authorization: Bearer <Supabase access token>`.

## Deployment

**Backend on Render**
- New **Web Service** from your repo, root directory `backend`
- Build: `pip install -r requirements.txt`
- Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Add the environment variables from `backend/.env.example`; set `ALLOWED_ORIGINS` to your Vercel URL

**Frontend on Vercel**
- Import the repo, root directory `frontend`, framework preset **Vite**
- Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL` (your Render URL)
- Add a rewrite so client-side routes work: create `frontend/vercel.json` with
  `{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }` (already included)

## Testing checklist

- Solo weekend trip (2 days, low budget, food + sightseeing)
- Couple trip (relaxed pace, premium stay), then regenerate one day
- Group trip (5 travelers, adventure + culture, 5 days)
- Edge cases: end date before start date, 14+ day trips, missing API keys, expired session

## Future improvements

Real-time maps and routes, live pricing and booking links, collaborative editing for groups, offline access.
