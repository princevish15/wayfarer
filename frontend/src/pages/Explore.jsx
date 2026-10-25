import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Search } from "lucide-react";
import { DESTINATIONS, useWikiImage } from "../lib/destinations";

function DestCard({ d }) {
  const img = useWikiImage(d.wiki, 960);
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
    <Link
      className="dest"
      to={`/new?dest=${encodeURIComponent(d.query)}&cur=${d.currency}&budget=${d.budget}`}
      style={img ? { backgroundImage: `url(${img})` } : undefined}
    >
      <div className="dest-info">
        <span className="dest-region">
          <MapPin size={11} /> {d.region}
        </span>
        <h3>{d.name}</h3>
        <p>{d.tag}</p>
      </div>
    </Link>
    </motion.div>
  );
}

const SLIDES = [
  { wiki: "Oia,_Greece", place: "Santorini, Greece", quote: "The world is a book, and those who do not travel read only one page." },
  { wiki: "Hawa_Mahal", place: "Jaipur, India", quote: "Not all those who wander are lost." },
  { wiki: "Alleppey", place: "Kerala, India", quote: "Travel is the only thing you buy that makes you richer." },
  { wiki: "Pangong_Tso", place: "Ladakh, India", quote: "Take only memories, leave only footprints." },
  { wiki: "Uluwatu_Temple", place: "Bali, Indonesia", quote: "Once a year, go someplace you've never been before." },
];

function Slide({ s, on }) {
  const img = useWikiImage(s.wiki, 1280);
  return <div className={`slide ${on ? "on" : ""}`} style={img ? { backgroundImage: `url(${img})` } : undefined} />;
}

const STEPS = [
  { icon: "📍", t: "Pick a place", d: "Choose a destination from the list or search any city in the world." },
  { icon: "🎒", t: "Tell us your style", d: "Dates, budget, who is travelling, what you love: food, adventure, culture." },
  { icon: "🗺️", t: "Get your plan", d: "A day-by-day itinerary with costs, photos and Google Maps links. Edit any day." },
];

const QUOTES = [
  { q: "Travel makes one modest. You see what a tiny place you occupy in the world.", a: "Gustave Flaubert" },
  { q: "To travel is to live.", a: "Hans Christian Andersen" },
  { q: "The journey, not the arrival, matters.", a: "T. S. Eliot" },
];

const LIMIT = 6;

function Section({ region }) {
  const [all, setAll] = useState(false);
  const list = DESTINATIONS.filter((d) => d.region === region);
  const shown = all ? list : list.slice(0, LIMIT);
  return (
    <section className="dest-section">
      <h3 className="dest-section-title">{region === "India" ? "Incredible India" : "Around the world"}</h3>
      <div className="dest-grid">
        {shown.map((d) => (
          <DestCard key={d.name} d={d} />
        ))}
      </div>
      {list.length > LIMIT && (
        <div className="see-all">
          <button className="btn btn-ghost" onClick={() => setAll(!all)}>
            {all ? "Show less" : `See all ${list.length} places`}
          </button>
        </div>
      )}
    </section>
  );
}

export default function Explore() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("All");
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSlide((x) => (x + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const go = (e) => {
    e.preventDefault();
    navigate(`/new${q.trim() ? `?dest=${encodeURIComponent(q.trim())}` : ""}`);
  };

  const sections = ["India", "International"].filter((r) => region === "All" || region === r);

  return (
    <>
      <section className="explore-hero">
        {SLIDES.map((sl, i) => (
          <Slide key={sl.wiki} s={sl} on={i === slide} />
        ))}
        <div className="explore-hero-in">
          <h1>Where to next?</h1>
          <p>Pick a place, tell us your style, and get a day-by-day plan with photos, costs and map links.</p>
          <blockquote className="hero-quote" key={slide}>
            "{SLIDES[slide].quote}"
            <cite>{SLIDES[slide].place}</cite>
          </blockquote>
          <form className="hero-search" onSubmit={go}>
            <input placeholder="Search any city or country..." value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="btn btn-primary">
              <Search size={16} /> Plan trip
            </button>
          </form>
          <div className="dots">
            {SLIDES.map((_, i) => (
              <button key={i} aria-label={`Slide ${i + 1}`} className={i === slide ? "on" : ""} onClick={() => setSlide(i)} />
            ))}
          </div>
        </div>
      </section>

      <section className="steps">
        {STEPS.map((st, i) => (
          <div className="card step" key={st.t}>
            <motion.span className="step-icon" initial={{ scale: 0.6, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }}>
              {st.icon}
            </motion.span>
            <h3>
              {i + 1}. {st.t}
            </h3>
            <p className="muted">{st.d}</p>
          </div>
        ))}
      </section>

      <div className="page-head">
        <div>
          <h2>Popular destinations</h2>
          <p className="muted">Tap a place to start planning. Or search any destination above.</p>
        </div>
        <div className="chips">
          {["All", "India", "International"].map((r) => (
            <button key={r} className={`chip ${region === r ? "on" : ""}`} onClick={() => setRegion(r)}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {sections.map((r) => (
        <Section key={r} region={r} />
      ))}

      <section className="quotes">
        {QUOTES.map((x) => (
          <figure key={x.a}>
            <blockquote>"{x.q}"</blockquote>
            <figcaption>{x.a}</figcaption>
          </figure>
        ))}
      </section>
    </>
  );
}
