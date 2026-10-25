export function fmtMoney(value, currency = "INR") {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(
      Number(value) || 0
    );
  } catch {
    return `${currency} ${Math.round(Number(value) || 0)}`;
  }
}

export function fmtRange(start, end) {
  const f = (d) => new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short" });
  return `${f(start)} - ${f(end)}`;
}

const q = (s) => encodeURIComponent(s);

export function placeUrl(activity, destination) {
  return `https://www.google.com/maps/search/?api=1&query=${q(`${activity.location || activity.title}, ${destination}`)}`;
}

// Multi-stop Google Maps route for a day (max 9 waypoints). Returns null if fewer than 2 distinct stops.
export function dayRouteUrl(day, destination) {
  const stops = [];
  for (const a of day.activities || []) {
    const s = a.location || a.title;
    if (s && s !== stops[stops.length - 1] && a.type !== "transport") stops.push(`${s}, ${destination}`);
  }
  if (stops.length < 2) return null;
  const use = stops.slice(0, 11);
  const mid = use.slice(1, -1).map(q).join("%7C");
  return (
    `https://www.google.com/maps/dir/?api=1&origin=${q(use[0])}&destination=${q(use[use.length - 1])}` +
    (mid ? `&waypoints=${mid}` : "")
  );
}

export function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}
