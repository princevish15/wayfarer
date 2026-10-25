import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useWikiImage } from "../lib/destinations";
import PasswordInput from "../components/PasswordInput";

export default function Login() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const bg = useWikiImage("Santorini", 1280);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setInfo("");
    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset` });
      setBusy(false);
      if (error) return setError(error.message);
      return setInfo("If an account exists for this email, a reset link has been sent. Check your inbox (and spam).");
    }
    const fn = mode === "signin" ? supabase.auth.signInWithPassword : supabase.auth.signUp;
    const { data, error } = await fn.call(supabase.auth, { email, password });
    setBusy(false);
    if (error) return setError(error.message);
    if (mode === "signup" && !data.session) setInfo("Account created. Check your email to confirm, then sign in.");
  };

  return (
    <div className="login-wrap" style={bg ? { "--login-bg": `url(${bg})` } : undefined}>
      <div className="login-hero">
        <div className="brand big">
          <span className="brand-mark">W</span> Wayfarer
        </div>
        <h1>Plan the trip, not the research.</h1>
        <p>
          Tell us where, when and how you like to travel. Get a day-by-day plan with attractions, food, stays and
          transport in seconds, then tweak and regenerate any day.
        </p>
      </div>
      <form className="card login-card" onSubmit={submit}>
        <h2>{mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset your password"}</h2>
        <label>
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        {mode !== "forgot" && (
          <label>
            Password
            <PasswordInput required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
        )}
        {mode === "signin" && (
          <button type="button" className="btn btn-link forgot" onClick={() => { setMode("forgot"); setError(""); setInfo(""); }}>
            Forgot password?
          </button>
        )}
        {error && <div className="alert error">{error}</div>}
        {info && <div className="alert ok">{info}</div>}
        <button className="btn btn-primary" disabled={busy}>
          {busy ? "Please wait..." : mode === "signin" ? "Sign in" : mode === "signup" ? "Sign up" : "Send reset link"}
        </button>
        <button
          type="button"
          className="btn btn-link"
          onClick={() => { setMode(mode === "signup" ? "signin" : mode === "forgot" ? "signin" : "signup"); setError(""); setInfo(""); }}
        >
          {mode === "signin" ? "New here? Create an account" : mode === "signup" ? "Already have an account? Sign in" : "Back to sign in"}
        </button>
      </form>
    </div>
  );
}
