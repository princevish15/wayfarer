import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import PasswordInput from "../components/PasswordInput";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(error.message);
    navigate("/", { replace: true });
  };

  return (
    <form className="card form" onSubmit={submit}>
      <h1>Set a new password</h1>
      <p className="muted">Choose a new password for your account (at least 6 characters).</p>
      <label>
        New password
        <PasswordInput required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {error && <div className="alert error">{error}</div>}
      <button className="btn btn-primary" disabled={busy}>
        {busy ? "Saving..." : "Update password"}
      </button>
    </form>
  );
}
