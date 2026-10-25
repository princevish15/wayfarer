import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";
import { EXPERIENCES } from "./experiences";

// Saved food / shopping / adventure picks live in the user's Supabase profile (user_metadata.saved),
// separate from trips, so they follow the account across devices without any extra table.
export function useSaved() {
  const [saved, setSaved] = useState([]);
  const latest = useRef(saved);
  latest.current = saved;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSaved(data.session?.user.user_metadata?.saved ?? []));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSaved(s?.user.user_metadata?.saved ?? []));
    return () => sub.subscription.unsubscribe();
  }, []);

  const isSaved = (kind, name) => saved.some((s) => s.kind === kind && s.name === name);

  const toggle = async (kind, name) => {
    const prev = latest.current;
    const next = prev.some((s) => s.kind === kind && s.name === name)
      ? prev.filter((s) => !(s.kind === kind && s.name === name))
      : [...prev, { kind, name }];
    setSaved(next);
    const { error } = await supabase.auth.updateUser({ data: { saved: next } });
    if (error) setSaved(prev);
  };

  // Resolve saved names back to full catalog items; skip anything removed from the catalog.
  const items = (kind) =>
    saved.filter((s) => s.kind === kind).map((s) => EXPERIENCES[kind].find((e) => e.name === s.name)).filter(Boolean);

  return { saved, isSaved, toggle, items };
}
