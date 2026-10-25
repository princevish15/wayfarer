import { useEffect, useState } from "react";
import { Compass, Luggage, Mountain, Plus, ShoppingBag, Utensils } from "lucide-react";
import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { supabase, supabaseConfigured } from "./lib/supabase";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Explore from "./pages/Explore";
import Experiences from "./pages/Experiences";
import ResetPassword from "./pages/ResetPassword";
import NewTrip from "./pages/NewTrip";
import TripView from "./pages/TripView";
import SharedTrip from "./pages/SharedTrip";

function Shell({ session, children }) {
  const navigate = useNavigate();
  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };
  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark">W</span> Wayfarer
        </Link>
        <nav>
          <Link to="/" className="navlink">
            <Compass size={16} /> Explore
          </Link>
          <Link to="/food" className="navlink">
            <Utensils size={16} /> Food
          </Link>
          <Link to="/shopping" className="navlink">
            <ShoppingBag size={16} /> Shopping
          </Link>
          <Link to="/adventures" className="navlink">
            <Mountain size={16} /> Adventures
          </Link>
          <Link to="/trips" className="navlink">
            <Luggage size={16} /> My trips
          </Link>
          <Link to="/new" className="btn btn-primary btn-sm">
            <Plus size={14} /> New trip
          </Link>
          <span className="muted email">{session.user.email}</span>
          <button className="btn btn-ghost btn-sm" onClick={signOut}>
            Sign out
          </button>
        </nav>
      </header>
      <main className="container">{children}</main>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!supabaseConfigured) {
    return (
      <div className="center-screen">
        <div className="card narrow">
          <h2>Setup needed</h2>
          <p className="muted">
            Copy <code>frontend/.env.example</code> to <code>frontend/.env</code> and fill in{" "}
            <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>, then restart the dev server.
          </p>
        </div>
      </div>
    );
  }

  if (session === undefined) return <div className="center-screen muted">Loading...</div>;

  const guard = (el) => (session ? <Shell session={session}>{el}</Shell> : <Navigate to="/login" replace />);

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/share/:token" element={<SharedTrip />} />
      <Route path="/" element={guard(<Explore />)} />
      <Route path="/food" element={guard(<Experiences kind="food" />)} />
      <Route path="/shopping" element={guard(<Experiences kind="shopping" />)} />
      <Route path="/adventures" element={guard(<Experiences kind="adventure" />)} />
      <Route path="/trips" element={guard(<Dashboard />)} />
      <Route path="/reset" element={guard(<ResetPassword />)} />
      <Route path="/new" element={guard(<NewTrip />)} />
      <Route path="/trip/:id" element={guard(<TripView />)} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
