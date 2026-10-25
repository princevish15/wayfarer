import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { fmtMoney, fmtRange } from "../lib/format";
import { useDestImage } from "../lib/destinations";

function Cover({ t }) {
  const wiki = useDestImage(t.destination, 500);
  const img = t.cover_image || wiki;
  return (
    <div className="trip-cover" style={img ? { backgroundImage: `url(${img})` } : undefined}>
      {!img && <span>{t.destination[0]}</span>}
    </div>
  );
}

export default function Dashboard() {
  const [trips, setTrips] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    const { data, error } = await supabase
      .from("trips")
      .select("id,title,destination,start_date,end_date,budget,currency,cover_image,itinerary,created_at")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setTrips(data);
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id) => {
    if (!confirm("Delete this trip?")) return;
    await supabase.from("trips").delete().eq("id", id);
    setTrips((t) => t.filter((x) => x.id !== id));
  };

  const upcoming = trips?.filter((t) => new Date(t.end_date) >= new Date()).length ?? 0;
  const totalBudget = trips?.reduce((s, t) => s + Number(t.budget), 0) ?? 0;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>My trips</h1>
          <p className="muted">Everything you've planned, in one place.</p>
        </div>
        <Link className="btn btn-primary" to="/new">
          + Plan a new trip
        </Link>
      </div>

      {error && <div className="alert error">{error}</div>}

      {trips && (
        <div className="stats">
          <div className="card stat">
            <span className="muted">Trips planned</span>
            <strong>{trips.length}</strong>
          </div>
          <div className="card stat">
            <span className="muted">Upcoming</span>
            <strong>{upcoming}</strong>
          </div>
          <div className="card stat">
            <span className="muted">Total budgeted</span>
            <strong>{trips.length ? fmtMoney(totalBudget, trips[0].currency) : "-"}</strong>
          </div>
        </div>
      )}

      {trips === null && !error && <p className="muted">Loading trips...</p>}

      {trips?.length === 0 && (
        <div className="card empty">
          <h3>No trips yet</h3>
          <p className="muted">Create your first AI-generated itinerary in under a minute.</p>
          <Link className="btn btn-primary" to="/new">
            Plan a trip
          </Link>
        </div>
      )}

      <div className="grid">
        {trips?.map((t) => (
          <div className="card trip-card" key={t.id}>
            <Link to={`/trip/${t.id}`}>
              <Cover t={t} />
              <div className="trip-body">
                <h3>{t.title}</h3>
                <p className="muted">{t.destination}</p>
                <p className="muted small">
                  {fmtRange(t.start_date, t.end_date)} · {fmtMoney(t.budget, t.currency)} budget
                </p>
              </div>
            </Link>
            <button className="btn btn-ghost btn-sm del" onClick={() => remove(t.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
