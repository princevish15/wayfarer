import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
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

export default function SharedTrip() {
  const { token } = useParams();
  const [trip, setTrip] = useState(null);
  const wikiHero = useDestImage(trip?.destination, 1280);
  const heroImg = trip?.cover_image || wikiHero;
  const [activeDay, setActiveDay] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.rpc("get_shared_trip", { p_token: token }).then(({ data, error }) => {
      if (error) setError(error.message);
      else if (!data || data.length === 0) setError("This shared link is invalid or sharing was turned off.");
      else setTrip(data[0]);
    });
  }, [token]);

  if (error) return <div className="center-screen"><div className="card narrow"><p>{error}</p><Link to="/">Go to Wayfarer</Link></div></div>;
  if (!trip) return <div className="center-screen muted">Loading...</div>;

  const it = trip.itinerary;
  const day = it.days.find((d) => d.day === activeDay) || it.days[0];
  const route = dayRouteUrl(day, trip.destination);

  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark">W</span> Wayfarer
        </Link>
        <nav>
          <span className="muted email">Shared trip (view only)</span>
          <Link to="/login" className="btn btn-primary btn-sm">
            Plan your own
          </Link>
        </nav>
      </header>
      <main className="container">
        <div
          className="hero"
          style={heroImg ? { backgroundImage: `linear-gradient(rgba(0,0,0,.35),rgba(0,0,0,.55)),url(${heroImg})` } : undefined}
        >
          <h1>{it.title}</h1>
          <p>
            {trip.destination} · {fmtRange(trip.start_date, trip.end_date)} · {trip.preferences.travelers} traveler
            {trip.preferences.travelers > 1 ? "s" : ""}
          </p>
        </div>

        <div className="layout">
          <section>
            {it.summary && <p className="summary">{it.summary}</p>}
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
              {route && (
                <a className="btn btn-ghost btn-sm" href={route} target="_blank" rel="noreferrer">
                  View day route on map
                </a>
              )}
            </div>
            <div className="timeline">
              {day.activities.map((a, i) => (
                <div className="act card" key={`${day.day}-${i}-${a.title}`}>
                  <ActImage a={a} />
                  <div className="act-body">
                    <div className="act-top">
                      <span className="time">{a.time}</span>
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
                          <a href={placeUrl(a, trip.destination)} target="_blank" rel="noreferrer">
                            Map
                          </a>
                        </>
                      )}
                    </p>
                    <p className="muted small">{fmtMoney(a.estimated_cost, it.currency)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside>
            <div className="card side">
              <h3>Budget</h3>
              <p>
                <strong>{fmtMoney(it.estimated_total_cost, it.currency)}</strong> of {fmtMoney(trip.budget, it.currency)}
              </p>
              <ul className="split">
                {it.days.map((d) => (
                  <li key={d.day}>
                    <span>Day {d.day}</span>
                    <span>{fmtMoney(d.estimated_cost, it.currency)}</span>
                  </li>
                ))}
              </ul>
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
          </aside>
        </div>
      </main>
    </div>
  );
}
