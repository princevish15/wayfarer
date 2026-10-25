import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { generateItinerary } from "../lib/api";
import { DESTINATIONS, useDestImage, useWikiImage } from "../lib/destinations";

const LOADING_TIPS = [
  "Picking the best sights for your interests...",
  "Finding local food worth the queue...",
  "Balancing the plan with your budget...",
  "Lining up stays and transport...",
  "Adding map links for every stop...",
];
const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "JPY"];

const INTERESTS = [
  "Food",
  "Sightseeing",
  "Culture & history",
  "Adventure",
  "Nature",
  "Nightlife",
  "Shopping",
  "Relaxation",
  "Photography",
];
const TYPES = [
  { v: "solo", l: "Solo" },
  { v: "couple", l: "Couple" },
  { v: "group", l: "Friends" },
  { v: "family", l: "Family" },
];
const today = new Date().toISOString().slice(0, 10);

export default function NewTrip() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const known = DESTINATIONS.find((d) => d.query === params.get("dest"));
  const photo = useWikiImage(known?.wiki, 1280);
  const [f, setF] = useState({
    destination: params.get("dest") || "",
    start_date: today,
    end_date: today,
    budget: Number(params.get("budget")) || 20000,
    currency: CURRENCIES.includes(params.get("cur")) ? params.get("cur") : "INR",
    travelers: 1,
    trip_type: "solo",
    interests: ["Food", "Sightseeing"],
    pace: "balanced",
    stay_type: "mid-range",
    notes: "",
  });
  const [busy, setBusy] = useState(false);
  const loadPhoto = useDestImage(busy ? f.destination : "", 1280);
  const [tip, setTip] = useState(0);
  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => setTip((x) => (x + 1) % LOADING_TIPS.length), 2500);
    return () => clearInterval(t);
  }, [busy]);
  const [error, setError] = useState("");

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const toggleInterest = (i) =>
    set("interests", f.interests.includes(i) ? f.interests.filter((x) => x !== i) : [...f.interests, i]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (f.end_date < f.start_date) return setError("End date must be on or after the start date.");
    setBusy(true);
    try {
      const prefs = { ...f, budget: Number(f.budget), travelers: Number(f.travelers), notes: f.notes || null };
      const itinerary = await generateItinerary(prefs);
      const { data: u } = await supabase.auth.getUser();
      const { data, error: dbErr } = await supabase
        .from("trips")
        .insert({
          user_id: u.user.id,
          title: itinerary.title,
          destination: f.destination,
          start_date: f.start_date,
          end_date: f.end_date,
          budget: prefs.budget,
          currency: f.currency,
          preferences: prefs,
          itinerary,
          cover_image: itinerary.cover_image || null,
        })
        .select("id")
        .single();
      if (dbErr) throw new Error(dbErr.message);
      navigate(`/trip/${data.id}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form className="card form" onSubmit={submit}>
      {busy && (
        <div className="gen-overlay" style={loadPhoto ? { backgroundImage: `url(${loadPhoto})` } : undefined}>
          <div className="gen-box">
            <div className="spinner" />
            <h2>Crafting your {f.destination.split(",")[0]} trip</h2>
            <p>{LOADING_TIPS[tip]}</p>
          </div>
        </div>
      )}
      {known && (
        <div className="form-banner" style={photo ? { backgroundImage: `url(${photo})` } : undefined}>
          <span>{known.name}</span>
        </div>
      )}
      <h1>{known ? `Plan your ${known.name} trip` : "Plan a new trip"}</h1>
      <p className="muted">The more you tell us, the more personal the itinerary.</p>
      {!known && (
        <div className="chips">
          {DESTINATIONS.slice(0, 8).map((d) => (
            <button type="button" key={d.name} className="chip" onClick={() => set("destination", d.query)}>
              {d.name}
            </button>
          ))}
        </div>
      )}

      <div className="row">
        <label className="grow">
          Destination
          <input
            required
            placeholder="e.g. Goa, India"
            value={f.destination}
            onChange={(e) => set("destination", e.target.value)}
          />
        </label>
      </div>

      <div className="row">
        <label>
          Start date
          <input type="date" required min={today} value={f.start_date} onChange={(e) => set("start_date", e.target.value)} />
        </label>
        <label>
          End date
          <input type="date" required min={f.start_date} value={f.end_date} onChange={(e) => set("end_date", e.target.value)} />
        </label>
      </div>

      <div className="row">
        <label className="grow">
          Total budget
          <input type="number" min="1" required value={f.budget} onChange={(e) => set("budget", e.target.value)} />
        </label>
        <label>
          Currency
          <select value={f.currency} onChange={(e) => set("currency", e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Travelers
          <input type="number" min="1" max="30" value={f.travelers} onChange={(e) => set("travelers", e.target.value)} />
        </label>
      </div>

      <div className="field">
        <span className="label">Who's travelling?</span>
        <div className="chips">
          {TYPES.map((t) => (
            <button
              type="button"
              key={t.v}
              className={`chip ${f.trip_type === t.v ? "on" : ""}`}
              onClick={() => set("trip_type", t.v)}
            >
              {t.l}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="label">Interests</span>
        <div className="chips">
          {INTERESTS.map((i) => (
            <button
              type="button"
              key={i}
              className={`chip ${f.interests.includes(i) ? "on" : ""}`}
              onClick={() => toggleInterest(i)}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      <div className="row">
        <label className="grow">
          Pace
          <select value={f.pace} onChange={(e) => set("pace", e.target.value)}>
            <option value="relaxed">Relaxed</option>
            <option value="balanced">Balanced</option>
            <option value="packed">Packed</option>
          </select>
        </label>
        <label className="grow">
          Stay
          <select value={f.stay_type} onChange={(e) => set("stay_type", e.target.value)}>
            <option value="budget">Budget</option>
            <option value="mid-range">Mid-range</option>
            <option value="premium">Premium</option>
          </select>
        </label>
      </div>

      <label>
        Anything else? (optional)
        <textarea
          rows={3}
          maxLength={500}
          placeholder="Vegetarian food, travelling with a toddler, avoid long drives..."
          value={f.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </label>

      {error && <div className="alert error">{error}</div>}
      <button className="btn btn-primary btn-lg" disabled={busy}>
        {busy ? "Crafting your itinerary... (10-20s)" : "Generate itinerary"}
      </button>
    </form>
  );
}
