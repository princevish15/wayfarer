import { Link } from "react-router-dom";
import { Heart, Mountain, ShoppingBag, Utensils } from "lucide-react";
import { ExpCard } from "./Experiences";
import { useSaved } from "../lib/saved";
import { fmtMoney } from "../lib/format";

const GROUPS = [
  { kind: "food", title: "Food", icon: Utensils, to: "/food" },
  { kind: "adventure", title: "Adventures", icon: Mountain, to: "/adventures" },
  { kind: "shopping", title: "Shopping", icon: ShoppingBag, to: "/shopping" },
];

export default function Saved() {
  const saved = useSaved();
  const total = GROUPS.flatMap((g) => saved.items(g.kind)).reduce((s, e) => s + e.price, 0);

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Saved</h2>
          <p className="muted">Food, adventures and shopping you have hearted. These stay separate from your trips.</p>
        </div>
        {total > 0 && (
          <div className="saved-total">
            <span className="muted small">Rough spend per person</span>
            <strong>{fmtMoney(total, "INR")}</strong>
          </div>
        )}
      </div>

      {saved.saved.length === 0 && (
        <div className="card empty">
          <Heart size={32} className="muted" />
          <h3>Nothing saved yet</h3>
          <p className="muted">Tap the heart on any food, adventure or shopping card to keep it here.</p>
          <Link to="/food" className="btn btn-primary">
            Browse food
          </Link>
        </div>
      )}

      {GROUPS.map(({ kind, title, icon: Icon, to }) => {
        const list = saved.items(kind);
        if (!list.length) return null;
        return (
          <section className="dest-section" key={kind}>
            <div className="strip-head">
              <h3 className="saved-title">
                <Icon size={18} /> {title} <span className="muted small">({list.length})</span>
              </h3>
              <Link to={to} className="btn btn-ghost btn-sm">
                Add more
              </Link>
            </div>
            <div className="dest-grid">
              {list.map((e) => (
                <ExpCard key={e.name} e={e} kind={kind} saved={saved} />
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
