import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function ActDetails({ details: d }) {
  const [open, setOpen] = useState(false);
  if (!d) return null;
  return (
    <div className="act-details">
      <button className="btn btn-ghost btn-sm" onClick={() => setOpen((o) => !o)}>
        <ChevronDown size={14} className={open ? "flip" : ""} /> {open ? "Hide details" : "Details"}
      </button>
      {open && (
        <div className="details-body">
          {d.about && <p>{d.about}</p>}
          {d.highlights?.length > 0 && (
            <>
              <h4>Highlights</h4>
              <ul>{d.highlights.map((h, i) => <li key={i}>{h}</li>)}</ul>
            </>
          )}
          {d.tips?.length > 0 && (
            <>
              <h4>Tips</h4>
              <ul>{d.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
            </>
          )}
          {d.best_time && <p><strong>Best time:</strong> {d.best_time}</p>}
          {d.how_to_reach && <p><strong>How to reach:</strong> {d.how_to_reach}</p>}
        </div>
      )}
    </div>
  );
}
