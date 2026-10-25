import { supabase } from "./supabase";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

async function post(path, body) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const err = await res.json();
      if (typeof err.detail === "string") msg = err.detail;
      else if (Array.isArray(err.detail)) msg = err.detail.map((d) => d.msg).join(", ");
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return res.json();
}

export const generateItinerary = (preferences) => post("/api/itinerary/generate", preferences);

export const regenerateDay = (preferences, dayNumber, existingItinerary, instruction) =>
  post("/api/itinerary/regenerate-day", {
    preferences,
    day_number: dayNumber,
    existing_itinerary: existingItinerary,
    instruction: instruction || null,
  });
