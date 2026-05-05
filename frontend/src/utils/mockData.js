// ─── Mock Data Engine ────────────────────────────────────────────────────────
// Used when the backend returns 0 live auctions so the UI always feels alive.

const NAMES = ['Harsh', 'Priya', 'Rahul', 'Amit', 'Sneha', 'Vikram', 'Nisha', 'Karan', 'Deepa', 'Rohan'];
const ITEMS = [
  { title: 'iPhone 15 Pro Max', category: 'Electronics', base: 110000 },
  { title: 'Sony WH-1000XM5 Headphones', category: 'Electronics', base: 22000 },
  { title: 'Vintage Rolex Submariner', category: 'Jewelry', base: 380000 },
  { title: 'Royal Enfield Meteor 350', category: 'Vehicles', base: 190000 },
  { title: 'MacBook Pro 14" M3', category: 'Electronics', base: 165000 },
  { title: 'Antique Teak Dining Set', category: 'Furniture', base: 45000 },
  { title: 'Signed Kohli Jersey', category: 'Sports', base: 28000 },
  { title: 'Original Oil Painting — Sunrise', category: 'Art', base: 55000 },
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const makeId = () => Math.random().toString(36).slice(2, 10);

// Build bid history for an item
const makeBids = (basePrice, count = 6) => {
  const bids = [];
  let price = basePrice;
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    price += randInt(500, 5000);
    bids.push({
      _id: makeId(),
      bidAmount: price,
      userId: { name: pick(NAMES) },
      createdAt: new Date(now - (count - i) * randInt(20000, 120000)).toISOString(),
    });
  }
  return bids;
};

// Generate a set of mock auctions
export const generateMockAuctions = (count = 8) => {
  const now = Date.now();
  return ITEMS.slice(0, count).map((item, i) => {
    const bids = makeBids(item.base);
    const currentBid = bids[bids.length - 1].bidAmount;
    const endTime = new Date(now + randInt(120000, 7200000)).toISOString(); // 2min–2hr from now
    return {
      _id: `mock_${i}_${makeId()}`,
      title: item.title,
      category: item.category,
      basePrice: item.base,
      currentBid,
      endTime,
      status: 'active',
      totalBids: bids.length,
      bids,
      bidderCount: randInt(3, 15),
      incrementAmount: randInt(500, 2000),
      image: null,
      sellerId: { name: pick(NAMES) },
      isMock: true,
    };
  });
};

// Activity feed event types
const EVENT_TEMPLATES = [
  (n, item, amt) => ({ icon: '⚡', text: `${n} bid ₹${amt.toLocaleString('en-IN')} on ${item}`, color: '#FF6B00' }),
  (n, item)      => ({ icon: '👁️', text: `${n} is watching ${item}`, color: '#A0A0A0' }),
  (n, item, amt) => ({ icon: '🏆', text: `${n} won ${item} for ₹${amt.toLocaleString('en-IN')}`, color: '#22C55E' }),
  (n, item)      => ({ icon: '🔔', text: `${n} joined auction: ${item}`, color: '#A0A0A0' }),
  (n, item, amt) => ({ icon: '🔥', text: `Hot bid! ₹${amt.toLocaleString('en-IN')} on ${item}`, color: '#FF3B30' }),
];

export const generateActivity = () => {
  const name = pick(NAMES);
  const item = pick(ITEMS);
  const amt = item.base + randInt(1000, 50000);
  const template = pick(EVENT_TEMPLATES);
  return {
    id: makeId(),
    ts: Date.now(),
    ...template(name, item.title.split(' ').slice(0, 3).join(' '), amt),
  };
};

// Initial feed of 8 staggered events
export const generateInitialFeed = () =>
  Array.from({ length: 8 }, (_, i) => ({
    ...generateActivity(),
    ts: Date.now() - i * randInt(8000, 25000),
  }));

export const formatAgo = (ts) => {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5)  return 'just now';
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
};
