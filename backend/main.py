"""Personalized Travel Itinerary Planner - FastAPI backend.

Endpoints
  GET  /health                          liveness check
  POST /api/itinerary/generate          full multi-day itinerary
  POST /api/itinerary/regenerate-day    regenerate a single day

Auth: the frontend sends the Supabase access token as `Authorization: Bearer <jwt>`.
The token is verified against Supabase Auth. Trips are saved by the frontend
directly to Supabase (protected by Row Level Security).
"""
import json
import asyncio
import os
from datetime import date
from typing import List, Optional

import httpx
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
REQUIRE_AUTH = os.getenv("REQUIRE_AUTH", "true").lower() == "true"
ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",") if o.strip()]

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

app = FastAPI(title="Personalized Travel Itinerary Planner", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Models ----------
class TripPreferences(BaseModel):
    destination: str = Field(..., min_length=2, max_length=120)
    start_date: date
    end_date: date
    budget: float = Field(..., gt=0, description="Total budget for the whole trip")
    currency: str = "INR"
    travelers: int = Field(1, ge=1, le=30)
    trip_type: str = "solo"  # solo | couple | group | family
    interests: List[str] = []
    pace: str = "balanced"  # relaxed | balanced | packed
    stay_type: str = "mid-range"  # budget | mid-range | premium
    notes: Optional[str] = Field(None, max_length=500)


class RegenerateDayRequest(BaseModel):
    preferences: TripPreferences
    day_number: int = Field(..., ge=1)
    existing_itinerary: dict
    instruction: Optional[str] = Field(None, max_length=300)


# ---------- Auth ----------
async def current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not REQUIRE_AUTH:
        return {"id": "anonymous"}
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Missing bearer token")
    token = authorization.split(" ", 1)[1]
    if not SUPABASE_URL:
        raise HTTPException(500, "SUPABASE_URL is not configured")
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={"Authorization": f"Bearer {token}", "apikey": SUPABASE_ANON_KEY},
        )
    if r.status_code != 200:
        raise HTTPException(401, "Invalid or expired session")
    return r.json()


# ---------- Prompt building ----------
SCHEMA_HINT = """{
  "title": "string",
  "summary": "string (2-3 sentences)",
  "estimated_total_cost": number,
  "currency": "string",
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "theme": "string",
      "estimated_cost": number,
      "activities": [
        {
          "time": "09:00",
          "title": "string",
          "type": "attraction | food | stay | transport | experience",
          "description": "string",
          "location": "string",
          "duration_minutes": number,
          "estimated_cost": number,
          "image_query": "short search phrase for a photo"
        }
      ]
    }
  ],
  "tips": ["string"]
}"""


def num_days(p: TripPreferences) -> int:
    return (p.end_date - p.start_date).days + 1


def prefs_block(p: TripPreferences) -> str:
    return (
        f"Destination: {p.destination}\n"
        f"Dates: {p.start_date} to {p.end_date} ({num_days(p)} days)\n"
        f"Total budget: {p.budget} {p.currency} for {p.travelers} traveler(s)\n"
        f"Trip type: {p.trip_type}\n"
        f"Interests: {', '.join(p.interests) or 'general sightseeing'}\n"
        f"Pace: {p.pace}\n"
        f"Accommodation: {p.stay_type}\n"
        f"Extra notes: {p.notes or 'none'}"
    )


SYSTEM_PROMPT = (
    "You are an expert travel planner. You produce realistic, well-paced itineraries that group "
    "nearby places on the same day to minimise travel time, respect the budget, and include meals, "
    "accommodation and transport. Costs must be realistic estimates in the requested currency. "
    "Respond with ONLY valid JSON matching the requested schema, no markdown fences."
)


async def call_groq(user_prompt: str) -> dict:
    if not GROQ_API_KEY:
        raise HTTPException(500, "GROQ_API_KEY is not configured")
    payload = {
        "model": GROQ_MODEL,
        "temperature": 0.7,
        "response_format": {"type": "json_object"},
        "max_tokens": 16000,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
    }
    if "gpt-oss" in GROQ_MODEL:
        payload["reasoning_effort"] = "low"
    for attempt in range(3):
        async with httpx.AsyncClient(timeout=120) as client:
            r = await client.post(GROQ_URL, json=payload, headers={"Authorization": f"Bearer {GROQ_API_KEY}"})
        if r.status_code != 200:
            if attempt < 2 and "json_validate_failed" in r.text:
                continue
            raise HTTPException(502, f"AI provider error: {r.text[:200]}")
        content = r.json()["choices"][0]["message"]["content"] or ""
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            if attempt == 2:
                raise HTTPException(502, "AI returned invalid JSON, please try again")


# ---------- Images ----------
async def fetch_image(client: httpx.AsyncClient, query: str) -> Optional[str]:
    if not UNSPLASH_ACCESS_KEY or not query:
        return None
    try:
        r = await client.get(
            "https://api.unsplash.com/search/photos",
            params={"query": query, "per_page": 1, "orientation": "landscape"},
            headers={"Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}"},
        )
        if r.status_code == 200:
            results = r.json().get("results", [])
            if results:
                return results[0]["urls"]["regular"]
    except httpx.HTTPError:
        pass
    return None


_image_cache: dict = {}
MAX_TRIP_PHOTOS = 8  # keeps one trip well under Unsplash's 50 requests/hour demo limit
MAX_DAY_PHOTOS = 3


async def cached_image(client: httpx.AsyncClient, query: str) -> Optional[str]:
    key = query.strip().lower()
    if key in _image_cache:
        return _image_cache[key]
    url = await fetch_image(client, query)
    if url:  # don't cache failures, so a later attempt can still succeed
        _image_cache[key] = url
    return url


async def attach_images(destination: str, itinerary: dict, only_day: Optional[int] = None) -> None:
    """Attach photos to the trip cover and a limited number of sightseeing/experience activities."""
    limit = MAX_DAY_PHOTOS if only_day is not None else MAX_TRIP_PHOTOS
    targets = []
    for day in itinerary.get("days", []):
        if only_day is not None and day.get("day") != only_day:
            continue
        for act in day.get("activities", []):
            act.pop("image_url", None)
            if act.get("type") in ("attraction", "experience") and len(targets) < limit:
                targets.append(act)
    async with httpx.AsyncClient(timeout=10) as client:
        jobs = [cached_image(client, a.get("image_query") or f"{a.get('title', '')} {destination}") for a in targets]
        if only_day is None:
            jobs.append(cached_image(client, f"{destination} travel"))
        results = await asyncio.gather(*jobs)
    for act, url in zip(targets, results):
        act["image_url"] = url
    if only_day is None:
        itinerary["cover_image"] = results[-1]


def normalise(itinerary: dict, p: TripPreferences) -> dict:
    """Make sure the AI output has the fields the frontend relies on, and recompute totals."""
    itinerary.setdefault("title", f"{num_days(p)} days in {p.destination}")
    itinerary.setdefault("summary", "")
    itinerary.setdefault("tips", [])
    itinerary["currency"] = p.currency
    days = itinerary.get("days") or []
    if not days:
        raise HTTPException(502, "AI returned an empty itinerary, please try again")
    total = 0.0
    for i, day in enumerate(days, start=1):
        day["day"] = i
        day.setdefault("theme", f"Day {i}")
        acts = day.get("activities") or []
        for a in acts:
            a["estimated_cost"] = float(a.get("estimated_cost") or 0)
        day["activities"] = acts
        day["estimated_cost"] = round(sum(a["estimated_cost"] for a in acts), 2)
        total += day["estimated_cost"]
    itinerary["estimated_total_cost"] = round(total, 2)
    return itinerary


# ---------- Routes ----------
@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/itinerary/generate")
async def generate(prefs: TripPreferences, user: dict = Depends(current_user)):
    if prefs.end_date < prefs.start_date:
        raise HTTPException(422, "End date must be on or after start date")
    if num_days(prefs) > 14:
        raise HTTPException(422, "Trips are limited to 14 days")
    prompt = (
        f"Create a day-by-day itinerary.\n\n{prefs_block(prefs)}\n\n"
        f"Plan exactly {num_days(prefs)} days. 4-6 activities per day for 'balanced' pace "
        f"(3-4 relaxed, 6-8 packed). Include breakfast/lunch/dinner suggestions, one stay entry on day 1, "
        f"and transport between areas where relevant. Keep total cost within the budget.\n\n"
        f"Return JSON with exactly this shape:\n{SCHEMA_HINT}"
    )
    itinerary = normalise(await call_groq(prompt), prefs)
    await attach_images(prefs.destination, itinerary)
    return itinerary


@app.post("/api/itinerary/regenerate-day")
async def regenerate_day(req: RegenerateDayRequest, user: dict = Depends(current_user)):
    p = req.preferences
    days = req.existing_itinerary.get("days", [])
    target = next((d for d in days if d.get("day") == req.day_number), None)
    if target is None:
        raise HTTPException(404, "Day not found in itinerary")
    others = [
        {"day": d["day"], "theme": d.get("theme"), "places": [a.get("title") for a in d.get("activities", [])]}
        for d in days
        if d.get("day") != req.day_number
    ]
    prompt = (
        f"Regenerate ONLY day {req.day_number} of this trip with a fresh plan.\n\n{prefs_block(p)}\n\n"
        f"Do not repeat places already used on other days: {json.dumps(others)}\n"
        f"User instruction: {req.instruction or 'Give me a different plan for this day.'}\n"
        f"Target date: {target.get('date')}\n\n"
        f"Return JSON of the form {{\"day\": <one day object>}} where the day object follows this shape:\n"
        f"{{\"day\": {req.day_number}, \"date\": \"...\", \"theme\": \"...\", \"estimated_cost\": 0, \"activities\": [...]}} "
        f"and each activity matches the activity shape in:\n{SCHEMA_HINT}"
    )
    result = await call_groq(prompt)
    new_day = result.get("day") or result
    if "activities" not in new_day:
        raise HTTPException(502, "AI returned an invalid day, please try again")
    new_day["day"] = req.day_number
    new_day.setdefault("date", target.get("date"))
    updated = {**req.existing_itinerary, "days": [new_day if d.get("day") == req.day_number else d for d in days]}
    updated = normalise(updated, p)
    await attach_images(p.destination, updated, only_day=req.day_number)
    return updated
