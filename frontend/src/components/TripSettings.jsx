import { useState } from "react";
import { Settings2 } from "lucide-react";
import { CURRENCIES, INTERESTS } from "../pages/NewTrip";

// onSave(prefs, regenerate): regenerate=false only updates budget/preferences, true rebuilds the whole itinerary.
export default function TripSettings({ trip, busy, onSave }) {
  const [open, setOpen] = useState(false);
  const p = trip.preferences;
  const [f, setF] = useState(null);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const start = () => {
    setF({ ...p, destination: trip.destination, start_date: trip.start_date, end_date: trip.end_date, budget: trip.budget, currency: trip.currency, origin: p.origin || "", travel_mode: p.travel_mode || "any", notes: p.notes || "" });
    setOpen(true);
  };

  if (!open)
    return (
      <button className="btn btn-ghost btn-sm" onClick={start}>
        <Settings2 size={14} /> Edit trip settings
      </button>
    );

  // dates, destination, currency and journey change the whole plan, so they force a rebuild
  const structural = ["destination", "start_date", "end_date", "currency", "origin", ...(f.origin.trim() ? ["travel_mode"] : [])].some((k) => (f[k] || "") !== ((k in trip ? trip[k] : p[k]) || (k === "travel_mode" ? "any" : "")));
  const submit = (regen) => {
    if (f.end_date < f.start_date) return alert("End date must be on or after the start date.");
    const prefs = { ...f, budget: Number(f.budget), travelers: Number(f.travelers), notes: f.notes || null, origin: f.origin.trim() || null };
    onSave(prefs, regen || structural);
    setOpen(false);
  };

  return (
    <div className="card side settings">
      <h3>Edit trip settings</h3>
      <label>Destination<input value={f.destination} onChange={(e) => set("destination", e.target.value)} /></label>
      <div className="row">
        <label className="grow">Start<input type="date" value={f.start_date} onChange={(e) => set("start_date", e.target.value)} /></label>
        <label className="grow">End<input type="date" min={f.start_date} value={f.end_date} onChange={(e) => set("end_date", e.target.value)} /></label>
      </div>
      <div className="row">
        <label className="grow">Budget<input type="number" min="1" value={f.budget} onChange={(e) => set("budget", e.target.value)} /></label>
        <label>Currency
          <select value={f.currency} onChange={(e) => set("currency", e.target.value)}>
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label>Travelers<input type="number" min="1" max="30" value={f.travelers} onChange={(e) => set("travelers", e.target.value)} /></label>
      </div>
      <span className="label">Interests</span>
      <div className="chips">
        {INTERESTS.map((i) => (
          <button type="button" key={i} className={`chip ${f.interests.includes(i) ? "on" : ""}`}
            onClick={() => set("interests", f.interests.includes(i) ? f.interests.filter((x) => x !== i) : [...f.interests, i])}>
            {i}
          </button>
        ))}
      </div>
      <div className="row">
        <label className="grow">Pace
          <select value={f.pace} onChange={(e) => set("pace", e.target.value)}>
            <option value="relaxed">Relaxed</option><option value="balanced">Balanced</option><option value="packed">Packed</option>
          </select>
        </label>
        <label className="grow">Stay
          <select value={f.stay_type} onChange={(e) => set("stay_type", e.target.value)}>
            <option value="budget">Budget</option><option value="mid-range">Mid-range</option><option value="premium">Premium</option>
          </select>
        </label>
      </div>
      <div className="row">
        <label className="grow">Travelling from<input placeholder="optional" value={f.origin} onChange={(e) => set("origin", e.target.value)} /></label>
        <label className="grow">Travel by
          <select value={f.travel_mode} onChange={(e) => set("travel_mode", e.target.value)}>
            <option value="any">Any</option><option value="flight">Flight</option><option value="train">Train</option><option value="bus">Bus</option><option value="car">Own car / cab</option>
          </select>
        </label>
      </div>
      <label>Notes<textarea rows={2} maxLength={500} value={f.notes} onChange={(e) => set("notes", e.target.value)} /></label>
      {structural && <p className="muted small">Destination, dates, currency or journey changed: the whole trip will be regenerated.</p>}
      <div className="side-actions">
        {!structural && <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => submit(false)}>Save (keep plan)</button>}
        <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => submit(true)}>Save &amp; regenerate trip</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Cancel</button>
      </div>
      <p className="muted small">Regenerating replaces your current plan, including manual edits.</p>
    </div>
  );
}
