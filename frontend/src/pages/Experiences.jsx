import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { EXPERIENCES, PAGES } from "../lib/experiences";
import { useWikiImage } from "../lib/destinations";
import { fmtMoney } from "../lib/format";

export function ExpCard({ e }) {
  const img = useWikiImage(e.wiki, 960);
  return (
    <Link className="dest" to={`/new?dest=${encodeURIComponent(e.place)}`} style={img ? { backgroundImage: `url(${img})` } : undefined}>
      <div className="dest-info">
        <span className="dest-region">
          <MapPin size={11} /> {e.place}
        </span>
        <h3>{e.name}</h3>
        <p>{e.tag}</p>
        <p className="price-tag">{fmtMoney(e.price, "INR")} / person</p>
      </div>
    </Link>
  );
}

export default function Experiences({ kind }) {
  const list = EXPERIENCES[kind];
  const types = ["All", ...new Set(list.map((e) => e.type))];
  const [type, setType] = useState("All");
  const shown = list.filter((e) => type === "All" || e.type === type);

  return (
    <>
      <div className="page-head">
        <div>
          <h2>{PAGES[kind].title}</h2>
          <p className="muted">{PAGES[kind].sub}</p>
        </div>
        <div className="chips">
          {types.map((t) => (
            <button key={t} className={`chip ${type === t ? "on" : ""}`} onClick={() => setType(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="dest-grid">
        {shown.map((e) => (
          <ExpCard key={e.name} e={e} />
        ))}
      </div>
    </>
  );
}
