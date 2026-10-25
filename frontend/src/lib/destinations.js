import { useEffect, useState } from "react";

// `wiki` is the Wikipedia page whose lead photo we show; `query` is what gets pre-filled in the trip form.
export const DESTINATIONS = [
  { name: "Goa", query: "Goa, India", region: "India", wiki: "Goa", tag: "Beaches & nightlife", currency: "INR", budget: 25000 },
  { name: "Jaipur", query: "Jaipur, India", region: "India", wiki: "Hawa_Mahal", tag: "Palaces & royal food", currency: "INR", budget: 20000 },
  { name: "Kerala", query: "Alleppey, Kerala, India", region: "India", wiki: "Alleppey", tag: "Backwaters & houseboats", currency: "INR", budget: 30000 },
  { name: "Manali", query: "Manali, India", region: "India", wiki: "Rohtang_Pass", tag: "Snow & mountain roads", currency: "INR", budget: 22000 },
  { name: "Ladakh", query: "Leh Ladakh, India", region: "India", wiki: "Pangong_Tso", tag: "High passes & lakes", currency: "INR", budget: 45000 },
  { name: "Udaipur", query: "Udaipur, India", region: "India", wiki: "Udaipur", tag: "City of lakes", currency: "INR", budget: 24000 },
  { name: "Agra", query: "Agra, India", region: "India", wiki: "Taj_Mahal", tag: "The Taj & Mughal heritage", currency: "INR", budget: 15000 },
  { name: "Varanasi", query: "Varanasi, India", region: "India", wiki: "Varanasi", tag: "Ghats & Ganga aarti", currency: "INR", budget: 15000 },
  { name: "Mumbai", query: "Mumbai, India", region: "India", wiki: "Gateway_of_India", tag: "Marine Drive & street food", currency: "INR", budget: 25000 },
  { name: "Delhi", query: "Delhi, India", region: "India", wiki: "India_Gate", tag: "Old Delhi, forts & chaat", currency: "INR", budget: 18000 },
  { name: "Darjeeling", query: "Darjeeling, India", region: "India", wiki: "Darjeeling", tag: "Tea gardens & toy train", currency: "INR", budget: 22000 },
  { name: "Shimla", query: "Shimla, India", region: "India", wiki: "Shimla", tag: "Colonial hills & snow", currency: "INR", budget: 20000 },
  { name: "Amritsar", query: "Amritsar, India", region: "India", wiki: "Golden_Temple", tag: "Golden Temple & langar", currency: "INR", budget: 14000 },
  { name: "Mysore", query: "Mysore, India", region: "India", wiki: "Mysore_Palace", tag: "Palaces & silk", currency: "INR", budget: 15000 },
  { name: "Hampi", query: "Hampi, India", region: "India", wiki: "Hampi", tag: "Ruins & boulder hills", currency: "INR", budget: 15000 },
  { name: "Jaisalmer", query: "Jaisalmer, India", region: "India", wiki: "Jaisalmer_Fort", tag: "Golden fort & desert camps", currency: "INR", budget: 20000 },
  { name: "Andaman", query: "Andaman Islands, India", region: "India", wiki: "Radhanagar_Beach", tag: "Islands & scuba", currency: "INR", budget: 50000 },
  { name: "Jodhpur", query: "Jodhpur, India", region: "India", wiki: "Mehrangarh", tag: "The blue city", currency: "INR", budget: 18000 },
  { name: "Coorg", query: "Coorg, India", region: "India", wiki: "Coorg", tag: "Coffee estates & mist", currency: "INR", budget: 18000 },
  { name: "Pushkar", query: "Pushkar, India", region: "India", wiki: "Pushkar", tag: "Holy lake & camel fair", currency: "INR", budget: 12000 },
  { name: "Bali", query: "Bali, Indonesia", region: "International", wiki: "Uluwatu_Temple", tag: "Temples & surf", currency: "INR", budget: 90000 },
  { name: "Dubai", query: "Dubai, UAE", region: "International", wiki: "Burj_Khalifa", tag: "Skyline & desert", currency: "AED", budget: 6000 },
  { name: "Paris", query: "Paris, France", region: "International", wiki: "Paris", tag: "Art, cafes & romance", currency: "EUR", budget: 1800 },
  { name: "Tokyo", query: "Tokyo, Japan", region: "International", wiki: "Shibuya_Crossing", tag: "Neon & street food", currency: "JPY", budget: 250000 },
  { name: "Santorini", query: "Santorini, Greece", region: "International", wiki: "Oia,_Greece", tag: "Sunsets & white villages", currency: "EUR", budget: 2000 },
  { name: "Singapore", query: "Singapore", region: "International", wiki: "Marina_Bay_Sands", tag: "Gardens & food streets", currency: "SGD", budget: 2500 },
];

const cache = new Map();

// Wikimedia only serves standard thumb widths (330, 500, 960, 1280...); 800 or 1400 return HTTP 400.
// Fetches a photo from Wikipedia's public API (no key needed). Falls back to null -> gradient.
export function useWikiImage(title, width = 960) {
  const [src, setSrc] = useState(cache.get(title) ?? null);
  useEffect(() => {
    if (!title) return;
    if (cache.has(title)) {
      setSrc(cache.get(title));
      return;
    }
    let live = true;
    const bySummary = () =>
      fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          const thumb = d?.thumbnail?.source;
          return thumb ? thumb.replace(/\/\d+px-/, `/${width}px-`) : null;
        });
    // Fallback for free-text places with no exact page: search Wikipedia and take the top result's photo.
    const bySearch = () =>
      fetch(
        `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
          title.replace(/_/g, " ")
        )}&gsrlimit=1&prop=pageimages&pithumbsize=${width}&format=json&origin=*`
      )
        .then((r) => r.json())
        .then((d) => Object.values(d?.query?.pages || {})[0]?.thumbnail?.source || null);
    bySummary()
      .catch(() => null)
      .then((url) => url || bySearch().catch(() => null))
      .then((url) => {
        cache.set(title, url);
        if (live) setSrc(url);
      });
    return () => {
      live = false;
    };
  }, [title, width]);
  return src;
}

// Photo for any free-text destination ("Goa, India", "Hampi"): known list first, else Wikipedia page of the first word group.
export function useDestImage(destination, width = 960) {
  const first = (destination || "").split(",")[0].trim();
  const known = DESTINATIONS.find((d) => d.query === destination || d.name.toLowerCase() === first.toLowerCase());
  const title = known ? known.wiki : first.replace(/\s+/g, "_");
  return useWikiImage(title, width);
}
