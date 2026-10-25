import { useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Send, X } from "lucide-react";
import { askChat } from "../lib/api";
import { EXPERIENCES } from "../lib/experiences";
import { DESTINATIONS } from "../lib/destinations";

// The app's own catalog, so answers can point at places and prices users can actually find here.
const CONTEXT = [
  `Destinations: ${DESTINATIONS.map((d) => d.name).join(", ")}`,
  ...Object.entries(EXPERIENCES).map(
    ([kind, list]) => `${kind}: ${list.map((e) => `${e.name} (${e.place.split(",")[0]}, ~Rs ${e.price})`).join("; ")}`
  ),
].join("\n");

const SUGGESTIONS = ["Goa ya Kerala, 3 din ke liye kya best rahega?", "Best time to visit Ladakh?", "Beginner ke liye best adventure?"];

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([{ role: "assistant", content: "Hi! Kahan jaane ka plan hai? Destination, budget ya food, kuch bhi poocho." }]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef(null);
  const input = useRef(null);

  useEffect(() => {
    // Braces matter: newer browsers return a Promise from scrollIntoView, which React would treat as a cleanup.
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy]);
  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  const send = async (q) => {
    const content = (q ?? text).trim().slice(0, 1000);
    if (!content || busy) return;
    const next = [...msgs, { role: "user", content }];
    setMsgs(next);
    setText("");
    setBusy(true);
    try {
      // Skip the greeting and keep only the recent history the backend accepts.
      const { reply } = await askChat(next.slice(1).slice(-20), CONTEXT);
      setMsgs((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: "assistant", content: `Sorry, abhi answer nahi aa paaya (${e.message}). Thodi der baad try karo.`, error: true }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button className={`chat-fab ${open ? "hide" : ""}`} aria-label="Open travel assistant" onClick={() => setOpen(true)}>
        <MessageCircle size={24} />
      </button>
      {open && (
        <section className="chat" role="dialog" aria-label="Travel assistant">
          <header className="chat-head">
            <div>
              <strong>Wayfarer assistant</strong>
              <span className="small">Ask what would be best</span>
            </div>
            <button className="icon-btn" aria-label="Close assistant" onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
          </header>
          <div className="chat-body" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={`bubble ${m.role} ${m.error ? "err" : ""}`}>
                {m.content}
              </div>
            ))}
            {msgs.length === 1 && (
              <div className="chat-suggest">
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="chip" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            {busy && (
              <div className="bubble assistant typing">
                <Loader2 size={16} className="spin" /> Soch raha hoon...
              </div>
            )}
            <div ref={end} />
          </div>
          <form
            className="chat-input"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <input ref={input} value={text} maxLength={1000} placeholder="Poocho, jaise: Manali ya Shimla?" onChange={(e) => setText(e.target.value)} />
            <button className="icon-btn icon-btn-primary" aria-label="Send" disabled={busy || !text.trim()}>
              <Send size={17} />
            </button>
          </form>
        </section>
      )}
    </>
  );
}
