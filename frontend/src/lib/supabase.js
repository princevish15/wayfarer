import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && key);

// Fall back to placeholders so the app can render a helpful setup message instead of crashing.
export const supabase = createClient(url || "http://localhost", key || "missing-key");
