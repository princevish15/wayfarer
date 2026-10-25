import { useState } from "react";

const ICON = { attraction: "🏛️", food: "🍽️", stay: "🏨", transport: "🚆", experience: "🎭" };

// Activity photo; shows a themed placeholder when there is no photo or it fails to load.
export default function ActImage({ a }) {
  const [bad, setBad] = useState(false);
  if (a.image_url && !bad) return <img src={a.image_url} alt={a.title} loading="lazy" onError={() => setBad(true)} />;
  return (
    <div className={`act-ph ph-${a.type}`} aria-hidden="true">
      <span>{ICON[a.type] || "📍"}</span>
    </div>
  );
}
