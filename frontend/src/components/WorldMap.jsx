// Outline world map (public/world-outline.svg) with pins and animated flight routes drawn on top.
// Pin positions are [x, y] in the map's own 950x620 coordinate space.
const PINS = {
  delhi: [669, 251],
  goa: [660, 292],
  paris: [458, 196],
  dubai: [600, 266],
  bali: [762, 371],
  tokyo: [818, 223],
  santorini: [503, 222],
};

const ROUTES = [
  ["delhi", "paris"],
  ["delhi", "tokyo"],
  ["goa", "bali"],
  ["dubai", "santorini"],
];

function arc([x1, y1], [x2, y2]) {
  const lift = Math.hypot(x2 - x1, y2 - y1) * 0.35;
  return `M${x1},${y1} Q${(x1 + x2) / 2},${(y1 + y2) / 2 - lift} ${x2},${y2}`;
}

export default function WorldMap({ className = "" }) {
  return (
    <div className={`world-map ${className}`} aria-hidden="true">
      <svg viewBox="0 0 950 620" preserveAspectRatio="xMidYMid meet">
        <image href="/world-outline.svg" width="950" height="620" opacity="0.55" />
        {ROUTES.map(([a, b], i) => (
          <path key={a + b} className="route" d={arc(PINS[a], PINS[b])} style={{ animationDelay: `${i * 0.8}s` }} />
        ))}
        {Object.entries(PINS).map(([name, [x, y]], i) => (
          <g key={name} transform={`translate(${x} ${y})`}>
            <circle className="pin-pulse" r="4" style={{ animationDelay: `${i * 0.4}s` }} />
            <circle className="pin" r="3.2" />
          </g>
        ))}
      </svg>
    </div>
  );
}
