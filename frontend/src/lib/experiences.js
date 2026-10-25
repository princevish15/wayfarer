// Add new items here; each shows up on its page with a photo (from the Wikipedia page `wiki`) and a price.
// `price` is per person in INR. `place` pre-fills the trip form when the card is clicked.
export const EXPERIENCES = {
  food: [
    { name: "Chole Bhature", place: "Delhi, India", wiki: "Chole_bhature", tag: "Paharganj classic breakfast", price: 150, type: "Street food" },
    { name: "Vada Pav", place: "Mumbai, India", wiki: "Vada_pav", tag: "Mumbai's favourite snack", price: 30, type: "Street food" },
    { name: "Dal Baati Churma", place: "Jaipur, India", wiki: "Dal_baati_churma", tag: "Rajasthani thali", price: 350, type: "Local meal" },
    { name: "Goan Fish Curry Rice", place: "Goa, India", wiki: "Goan_cuisine", tag: "Beach shack lunch", price: 400, type: "Local meal" },
    { name: "Kerala Sadya", place: "Kerala, India", wiki: "Sadya", tag: "Banana-leaf feast", price: 300, type: "Local meal" },
    { name: "Amritsari Kulcha", place: "Amritsar, India", wiki: "Kulcha", tag: "With lassi near the Golden Temple", price: 180, type: "Street food" },
    { name: "Varanasi Chaat & Lassi", place: "Varanasi, India", wiki: "Chaat", tag: "Kachori, tamatar chaat, malaiyo", price: 120, type: "Street food" },
    { name: "Ramen Crawl", place: "Tokyo, Japan", wiki: "Ramen", tag: "Three bowls, three neighbourhoods", price: 4500, type: "Food tour" },
  ],
  shopping: [
    { name: "Johari Bazaar", place: "Jaipur, India", wiki: "Johari_Bazaar", tag: "Jewellery & gems", price: 500, type: "Market" },
    { name: "Chandni Chowk", place: "Delhi, India", wiki: "Chandni_Chowk", tag: "Textiles, spices, attar", price: 300, type: "Market" },
    { name: "Colaba Causeway", place: "Mumbai, India", wiki: "Colaba_Causeway", tag: "Street fashion & trinkets", price: 800, type: "Market" },
    { name: "Anjuna Flea Market", place: "Goa, India", wiki: "Anjuna_Flea_Market", tag: "Wednesday hippie market", price: 600, type: "Market" },
    { name: "Mysore Silk & Sandalwood", place: "Mysore, India", wiki: "Mysore_silk", tag: "Government silk emporium", price: 2500, type: "Souvenirs" },
    { name: "Tibetan Market", place: "Manali, India", wiki: "Manali,_Himachal_Pradesh", tag: "Woollens & shawls", price: 700, type: "Souvenirs" },
    { name: "Dubai Gold Souk", place: "Dubai, UAE", wiki: "Gold_Souk", tag: "Gold and window shopping", price: 3000, type: "Market" },
    { name: "Ubud Art Market", place: "Bali, Indonesia", wiki: "Ubud", tag: "Handicrafts & sarongs", price: 1500, type: "Souvenirs" },
  ],
  adventure: [
    { name: "Paragliding", place: "Manali, India", wiki: "Paragliding", tag: "Solang Valley, 15 min flight", price: 3000, type: "Air" },
    { name: "River Rafting", place: "Rishikesh, India", wiki: "Rishikesh", tag: "Grade 3-4 rapids, 16 km", price: 1500, type: "Water" },
    { name: "Scuba Diving", place: "Andaman Islands, India", wiki: "Scuba_diving", tag: "Havelock, beginner dive", price: 4500, type: "Water" },
    { name: "Desert Safari & Camp", place: "Jaisalmer, India", wiki: "Thar_Desert", tag: "Camel ride, dunes, night camp", price: 2500, type: "Land" },
    { name: "Chadar / Pangong Bike Trip", place: "Leh Ladakh, India", wiki: "Pangong_Tso", tag: "Royal Enfield, 5 days", price: 28000, type: "Land" },
    { name: "Parasailing", place: "Goa, India", wiki: "Parasailing", tag: "Calangute beach", price: 1200, type: "Air" },
    { name: "Hampi Bouldering", place: "Hampi, India", wiki: "Hampi", tag: "Guided half-day climb", price: 1800, type: "Land" },
    { name: "Surf Lesson", place: "Bali, Indonesia", wiki: "Surfing", tag: "Kuta, 2 hours with board", price: 2200, type: "Water" },
    { name: "Skydiving", place: "Dubai, UAE", wiki: "Skydiving", tag: "Palm Jumeirah tandem", price: 45000, type: "Air" },
  ],
};

export const PAGES = {
  food: { title: "Food to try", sub: "Local dishes and food tours, with a rough price per person." },
  shopping: { title: "Shopping", sub: "Markets and things worth bringing home, with a rough spend per person." },
  adventure: { title: "Adventures", sub: "Things to do that get your heart going, priced per person." },
};
