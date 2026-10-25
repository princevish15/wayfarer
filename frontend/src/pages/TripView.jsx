import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Copy, MapPin, Printer, RefreshCw, Share2, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { regenerateDay } from "../lib/api";
import ActImage from "../components/ActImage";
import { useDestImage } from "../lib/destinations";
import { dayRouteUrl, fmtDate, fmtMoney, fmtRange, placeUrl } from "../lib/format";

const TYPE_LABEL = {
  attraction: "Sightseeing",
  food: "Food",
  stay: "Stay",
  transport: "Transport",
  experience: "Experience",
};

function recompute(itinerary) {
  let total = 0;
  const days = itinerary.days.map((d) => {
    const cost = d.activities.reduce((s, a) => s + (Number(a.estimated_cost) || 0), 0);
    total += cost;
    return { ...d, estimated_cost: cost };
  });
  return { ...itinerary, days, estimated_total_cost: total };
}

export default function TripView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const wikiHero = useDestImage(trip?.destination, 1280);
  const heroImg = trip?.cover_image || wikiHero;
  const [activeDay, setActiveDay] = useState(1);
  const [error, setError] = useState("");
  const [busyDay, setBusyDay] = useState(null);
  const [instruction, setInstruction] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase
      .from("trips")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setTrip(data);
      });
  }, [id]);

  const persist = async (itinerary) => {
    setSaving(true);
    const { error } = await supabase.from("trips").update({ itinerary }).eq("id", id);
    setSaving(false);
    if (error) setError(error.message);
  };

  const update = (itinerary) => {
    const next = recompute(itinerary);
    setTrip((t) => ({ ...t, itinerary: next }));
    persist(next);
  };

  const removeActivity = (dayNo, idx) => {
    const it = trip.itinerary;
    update({
      ...it,
      days: it.days.map((d) =>
        d.day === dayNo ? { ...d, activities: d.activities.filter((_, i) => i !== idx) } : d
      ),
    });
  };

  const editCost = (dayNo, idx, value) => {
    const it = trip.itinerary;
    update({
      ...it,
      days: it.days.map((d) =>
        d.day === dayNo
          ? {
              ...d,
              activities: d.activities.map((a, i) => (i === idx ? { ...a, estimated_cost: Number(value) || 0 } : a)),
            }
          : d
      ),
    });
  };

  const regen = async (dayNo) => {
    setBusyDay(dayNo);
    setError("");
    try {
      const updated = await regenerateDay(trip.preferences, dayNo, trip.itinerary, instruction);
      setTrip((t) => ({ ...t, itinerary: updated }));
      await persist(updated);
      setInstruction("");
    } catch (e) {
      setError(e.message);
    }
    setBusyDay(null);
  };

  const shareUrl = trip?.share_token ? `${window.location.origin}/share/${trip.share_token}` : "";

  const toggleShare = async () => {
    const share_token = trip.share_token ? null : crypto.randomUUID();
    const { error } = await supabase.from("trips").update({ share_token }).eq("id", id);
    if (error) return setError(`${error.message} (run supabase/share.sql in Supabase first)`);
    setTrip((t) => ({ ...t, share_token }));
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt("Copy this link:", shareUrl);
    }
  };

  const removeTrip = async () => {
    if (!confirm("Delete this trip?")) return;
    await supabase.from("trips").delete().eq("id", id);
    navigate("/");
  };

  if (error && !trip) return <div className="alert error">{error}</div>;
  if (!trip) return <p className="muted">Loading...</p>;

  const it = trip.itinerary;
  const day = it.days.find((d) => d.day === activeDay) || it.days[0];
  const over = it.estimated_total_cost > trip.budget;
  const pct = Math.min(100, Math.round((it.estimated_total_cost / trip.budget) * 100));

  return (
    <>
      <div
        className="hero"
        style={heroImg ? { backgroundImage: `linear-gradient(rgba(0,0,0,.35),rgba(0,0,0,.55)),url(${heroImg})` } : undefined}
      >
        <Link to="/trips" className="back">
          <ArrowLeft size={14} /> My trips
        </Link>
        <h1>{it.title}</h1>
        <p>
          {trip.destination} · {fmtRange(trip.start_date, trip.end_date)} · {trip.preferences.travelers} traveler
          {trip.preferences.travelers > 1 ? "s" : ""}
        </p>
      </div>

      <div className="layout">
        <section>
          {it.summary && <p className="summary">{it.summary}</p>}
          {error && <div className="alert error">{error}</div>}

          <div className="tabs">
            {it.days.map((d) => (
              <button key={d.day} className={`tab ${d.day === day.day ? "on" : ""}`} onClick={() => setActiveDay(d.day)}>
                Day {d.day}
              </button>
            ))}
          </div>

          <div className="day-head">
            <div>
              <h2>
                Day {day.day}: {day.theme}
              </h2>
              <p className="muted">
                {fmtDate(day.date)} · {fmtMoney(day.estimated_cost, it.currency)}
              </p>
            </div>
            {dayRouteUrl(day, trip.destination) && (
              <a className="btn btn-ghost btn-sm" href={dayRouteUrl(day, trip.destination)} target="_blank" rel="noreferrer">
                View day route on map
              </a>
            )}
          </div>

          <div className="timeline">
            {day.activities.map((a, i) => (
              <motion.div
                className="act card"
                key={`${day.day}-${i}-${a.title}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
              >
                <ActImage a={a} />
                <div className="act-body">
                  <div className="act-top">
                    <span className="time">
                      <Clock size={14} /> {a.time}
                    </span>
                    <span className={`tag tag-${a.type}`}>{TYPE_LABEL[a.type] || a.type}</span>
                  </div>
                  <h3>{a.title}</h3>
                  <p>{a.description}</p>
                  <p className="muted small">
                    {a.location}
                    {a.duration_minutes ? ` · ${a.duration_minutes} min` : ""}
                    {a.location && (
                      <>
                        {" · "}
                        <a href={placeUrl(a, trip.destination)} target="_blank" rel="noreferrer" className="maplink">
                          <MapPin size={13} /> Map
                        </a>
                      </>
                    )}
                  </p>
                  <div className="act-foot">
                    <label className="cost">
                      {it.currency}
                      <input
                        type="number"
                        min="0"
                        defaultValue={a.estimated_cost}
                        onBlur={(e) => Number(e.target.value) !== a.estimated_cost && editCost(day.day, i, e.target.value)}
                      />
                    </label>
                    <button className="btn btn-ghost btn-sm" onClick={() => removeActivity(day.day, i)}>
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
            {day.activities.length === 0 && <p className="muted">No activities left. Try regenerating this day.</p>}
          </div>

          <div className="card regen">
            <h3>Not feeling this day?</h3>
            <input
              placeholder='Optional: "more food stops", "something indoors", "start later"'
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
            />
            <button className="btn btn-primary" disabled={busyDay !== null} onClick={() => regen(day.day)}>
              <RefreshCw size={16} className={busyDay === day.day ? "spin" : ""} />
              {busyDay === day.day ? "Regenerating..." : `Regenerate Day ${day.day}`}
            </button>
          </div>
        </section>

        <aside>
          <div className="card side">
            <h3>Budget</h3>
            <div className="bar">
              <div className={`bar-fill ${over ? "over" : ""}`} style={{ width: `${pct}%` }} />
            </div>
            <p>
              <strong>{fmtMoney(it.estimated_total_cost, it.currency)}</strong> of {fmtMoney(trip.budget, it.currency)}
            </p>
            {over && <p className="warn small">Estimated cost is over your budget. Remove items or regenerate a day.</p>}
            <ul className="split">
              {it.days.map((d) => (
                <li key={d.day}>
                  <span>Day {d.day}</span>
                  <span>{fmtMoney(d.estimated_cost, it.currency)}</span>
                </li>
              ))}
            </ul>
            <p className="muted small">{saving ? "Saving..." : "All changes saved"}</p>
          </div>

          {it.tips?.length > 0 && (
            <div className="card side">
              <h3>Travel tips</h3>
              <ul className="tips">
                {it.tips.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="card side">
            <h3>Share trip</h3>
            {trip.share_token ? (
              <>
                <input readOnly value={shareUrl} onFocus={(e) => e.target.select()} />
                <p className="muted small">Anyone with this link can view (not edit) this trip.</p>
                <div className="side-actions">
                  <button className="btn btn-primary btn-sm" onClick={copyLink}>
                    <Copy size={14} /> {copied ? "Copied!" : "Copy link"}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={toggleShare}>
                    Stop sharing
                  </button>
                </div>
              </>
            ) : (
              <button className="btn btn-ghost btn-sm" onClick={toggleShare}>
                <Share2 size={14} /> Create share link
              </button>
            )}
          </div>

          <div className="side-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>
              <Printer size={14} /> Print / save PDF
            </button>
            <button className="btn btn-ghost btn-sm danger" onClick={removeTrip}>
              <Trash2 size={14} /> Delete trip
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
