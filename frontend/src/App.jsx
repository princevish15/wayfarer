import { useEffect, useRef, useState } from "react";
import { Compass, Heart, KeyRound, LogOut, Luggage, Menu, Mountain, Plus, ShoppingBag, Utensils, X } from "lucide-react";
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { supabase, supabaseConfigured } from "./lib/supabase";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Explore from "./pages/Explore";
import Experiences from "./pages/Experiences";
import ResetPassword from "./pages/ResetPassword";
import NewTrip from "./pages/NewTrip";
import TripView from "./pages/TripView";
import SharedTrip from "./pages/SharedTrip";
import Saved from "./pages/Saved";
import ChatBot from "./components/ChatBot";

const MENU = [
  { to: "/", icon: Compass, label: "Explore" },
  { to: "/food", icon: Utensils, label: "Food" },
  { to: "/shopping", icon: ShoppingBag, label: "Shopping" },
  { to: "/adventures", icon: Mountain, label: "Adventures" },
  { to: "/trips", icon: Luggage, label: "My trips" },
  { to: "/saved", icon: Heart, label: "Saved" },
];

function Shell({ session, children }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const savedCount = session.user.user_metadata?.saved?.length ?? 0;
  useEffect(() => {
    setOpen(false);
    setProfileOpen(false);
  }, [pathname]);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setProfileOpen(false);
      }
    };
    const onClick = (e) => profileRef.current && !profileRef.current.contains(e.target) && setProfileOpen(false);
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);
  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };
  const email = session.user.email;
  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-left">
          <button className="icon-btn" aria-label="Open menu" title="Menu" onClick={() => setOpen(true)}>
            <Menu size={20} />
          </button>
          <Link to="/" className="brand">
            <span className="brand-mark">W</span> Wayfarer
          </Link>
        </div>
        <nav>
          <NavLink to="/" end className="icon-btn" aria-label="Explore" title="Explore">
            <Compass size={19} />
          </NavLink>
          <NavLink to="/trips" className="icon-btn" aria-label="My trips" title="My trips">
            <Luggage size={19} />
          </NavLink>
          <Link to="/new" className="icon-btn icon-btn-primary" aria-label="New trip" title="New trip">
            <Plus size={19} />
          </Link>
          <div className="profile" ref={profileRef}>
            <button
              className="avatar"
              aria-label="Profile"
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              title={email}
              onClick={() => setProfileOpen((o) => !o)}
            >
              {email[0].toUpperCase()}
            </button>
            {profileOpen && (
              <div className="profile-menu" role="menu">
                <div className="profile-head">
                  <span className="avatar">{email[0].toUpperCase()}</span>
                  <div>
                    <strong>{email.split("@")[0]}</strong>
                    <span className="muted small">{email}</span>
                  </div>
                </div>
                <Link to="/trips" role="menuitem">
                  <Luggage size={17} /> My trips
                </Link>
                <Link to="/saved" role="menuitem">
                  <Heart size={17} /> Saved food & adventures
                  {savedCount > 0 && <span className="count">{savedCount}</span>}
                </Link>
                <Link to="/reset" role="menuitem">
                  <KeyRound size={17} /> Change password
                </Link>
                <button role="menuitem" className="danger" onClick={signOut}>
                  <LogOut size={17} /> Sign out
                </button>
              </div>
            )}
          </div>
        </nav>
      </header>

      <div className={`drawer-backdrop ${open ? "on" : ""}`} onClick={() => setOpen(false)} />
      <aside className={`drawer ${open ? "on" : ""}`} aria-hidden={!open}>
        <div className="drawer-head">
          <span className="brand">
            <span className="brand-mark">W</span> Wayfarer
          </span>
          <button className="icon-btn" aria-label="Close menu" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>
            <X size={20} />
          </button>
        </div>
        <nav className="drawer-nav">
          {MENU.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === "/"} tabIndex={open ? 0 : -1}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <Link to="/new" className="btn btn-primary drawer-cta" tabIndex={open ? 0 : -1}>
          <Plus size={16} /> Plan a new trip
        </Link>
        <p className="muted small drawer-email">{email}</p>
      </aside>

      <main className="container">{children}</main>
      <ChatBot />
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
      <Route path="/saved" element={guard(<Saved />)} />
      <Route path="/trips" element={guard(<Dashboard />)} />
      <Route path="/reset" element={guard(<ResetPassword />)} />
      <Route path="/new" element={guard(<NewTrip />)} />
      <Route path="/trip/:id" element={guard(<TripView />)} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
