import fs from 'fs';
import path from 'path';
import type { MenuItem, Order, Testimonial, Setting } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface DatabaseSchema {
  products: MenuItem[];
  orders: Order[];
  testimonials: Testimonial[];
  settings: Setting[];
}

const defaultProducts: MenuItem[] = [
  {
    id: 'c1',
    name: 'Sunflower Cream Cake',
    description: 'A light layered sponge kissed with organic cream and sunflower honey, decorated with seasonal blooms.',
    price: 1800,
    unit: '/whole',
    category: 'cake',
    badge: 'Fresh Today',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=500&fit=crop',
    rating: 5,
    featured: true,
    display_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c2',
    name: 'Chocolate Hazelnut Tart',
    description: 'Rich dark chocolate ganache poured into a hand-pressed pastry shell, crowned with roasted hazelnuts.',
    price: 950,
    unit: '/piece',
    category: 'pastry',
    badge: 'Organic',
    image: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=600&h=500&fit=crop',
    rating: 5,
    featured: true,
    display_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c3',
    name: 'Heritage Sourdough Loaf',
    description: '72-hour cold-fermented sourdough made with heritage wheat and a century-old starter culture.',
    price: 650,
    unit: '/loaf',
    category: 'bread',
    badge: 'Organic',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=500&fit=crop',
    rating: 5,
    featured: true,
    display_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c4',
    name: 'Butter Croissant',
    description: 'Flaky golden layers of French-style buttery pastry, hand-laminated and baked fresh each morning.',
    price: 180,
    unit: '/piece',
    category: 'pastry',
    badge: 'Fresh Today',
    image: 'https://images.unsplash.com/photo-1623334044303-241021148842?w=600&h=500&fit=crop',
    rating: 5,
    featured: false,
    display_order: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c5',
    name: 'Strawberry Tart',
    description: 'Crisp pastry shell filled with vanilla custard and topped with fresh Himalayan strawberries.',
    price: 650,
    unit: '/piece',
    category: 'pastry',
    badge: 'Seasonal',
    image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&h=500&fit=crop',
    rating: 4,
    featured: false,
    display_order: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c6',
    name: 'Cinnamon Roll',
    description: 'Soft dough rolled with Ceylon cinnamon and topped with tangy cream cheese glaze.',
    price: 220,
    unit: '/piece',
    category: 'pastry',
    badge: 'Popular',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=500&fit=crop',
    rating: 5,
    featured: false,
    display_order: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c7',
    name: 'Rustic Country Loaf',
    description: 'Stone-ground whole wheat with a deep caramelized crust and nutty interior crumb.',
    price: 480,
    unit: '/loaf',
    category: 'bread',
    badge: 'Organic',
    image: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=600&h=500&fit=crop',
    rating: 5,
    featured: false,
    display_order: 7,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c8',
    name: 'Chocolate Hazelnut Cake',
    description: 'Dark Belgian chocolate layered with roasted hazelnut praline and velvety ganache.',
    price: 2200,
    unit: '/whole',
    category: 'cake',
    badge: 'Best Seller',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=500&fit=crop',
    rating: 5,
    featured: true,
    display_order: 8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const defaultTestimonials: Testimonial[] = [
  {
    id: 't1',
    name: 'Anita Shrestha',
    initials: 'AS',
    role: 'Regular Customer',
    text: 'The sourdough here is on another level. I drive 30 minutes just for their bread. The crust, the flavor, the texture — absolute perfection every single time.',
    rating: 5,
    approved: true,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 't2',
    name: 'Rajesh Patel',
    initials: 'RP',
    role: 'Birthday Order',
    text: 'Ordered a custom birthday cake and it was stunning. Not only did it look beautiful, but every slice was moist and delicious. Everyone at the party was amazed.',
    rating: 5,
    approved: true,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 't3',
    name: 'Sunita Gurung',
    initials: 'SG',
    role: 'Food Blogger',
    text: 'Their croissants remind me of the ones I had in Paris. Flaky, buttery, and absolutely heavenly. Jiri Bakes has become my weekend ritual.',
    rating: 5,
    approved: true,
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
];

const defaultOrders: Order[] = [
  {
    id: 'ord-101',
    customer_name: 'Pooja Sharma',
    customer_phone: '+977 9841234567',
    customer_email: 'pooja.sharma@example.com',
    customer_address: 'Lokanthali, Bhaktapur',
    items: [
      { product_id: 'c1', name: 'Sunflower Cream Cake', price: 1800, quantity: 1 },
      { product_id: 'c4', name: 'Butter Croissant', price: 180, quantity: 4 },
    ],
    total: 2520,
    status: 'completed',
    notes: 'Please add birthday candles and write Happy Birthday Pooja.',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'ord-102',
    customer_name: 'Bikram Thapa',
    customer_phone: '+977 9801987654',
    customer_email: 'bikram.thapa@example.com',
    customer_address: 'Koteshwor, Kathmandu',
    items: [
      { product_id: 'c3', name: 'Heritage Sourdough Loaf', price: 650, quantity: 2 },
      { product_id: 'c2', name: 'Chocolate Hazelnut Tart', price: 950, quantity: 2 },
    ],
    total: 3200,
    status: 'baking',
    notes: 'Please slice the sourdough loaf.',
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'ord-103',
    customer_name: 'Srijana KC',
    customer_phone: '+977 9860112233',
    customer_email: 'srijana.kc@example.com',
    customer_address: 'Thimi, Bhaktapur',
    items: [
      { product_id: 'c8', name: 'Chocolate Hazelnut Cake', price: 2200, quantity: 1 },
    ],
    total: 2200,
    status: 'pending',
    notes: 'Delivery by 4 PM today please.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const defaultSettings: Setting[] = [
  { key: 'site_name', value: 'Jiri Bakes' },
  { key: 'tagline', value: 'Simply Organic Artisan Bakery' },
  { key: 'site_title', value: 'Jiri Bakes – Simply Organic Artisan Bakery' },
  { key: 'site_tagline', value: 'Where Flour Meets Feeling' },
  { key: 'phone', value: '+977 1-4567890' },
  { key: 'email', value: 'hello@jiribakes.com.np' },
  { key: 'address', value: 'Lokanthali, Bhaktapur, Nepal' },
  { key: 'hours_weekday', value: 'Mon – Sat: 7:00 AM – 8:00 PM' },
  { key: 'hours_sunday', value: 'Sunday: 8:00 AM – 6:00 PM' },
  { key: 'fresh_bread_time', value: '7:30 AM' },
  { key: 'delivery_fee', value: '100' },
  { key: 'currency_symbol', value: 'NPR' },
];

function readDB(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initialData: DatabaseSchema = {
        products: defaultProducts,
        orders: defaultOrders,
        testimonials: defaultTestimonials,
        settings: defaultSettings,
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      return initialData;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    return {
      products: Array.isArray(parsed.products) ? parsed.products : defaultProducts,
      orders: Array.isArray(parsed.orders) ? parsed.orders : defaultOrders,
      testimonials: Array.isArray(parsed.testimonials) ? parsed.testimonials : defaultTestimonials,
      settings: Array.isArray(parsed.settings) ? parsed.settings : defaultSettings,
    };
  } catch {
    return {
      products: defaultProducts,
      orders: defaultOrders,
      testimonials: defaultTestimonials,
      settings: defaultSettings,
    };
  }
}

function writeDB(data: DatabaseSchema) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write database file:', err);
  }
}

// ─── Products ───
export async function getDbProducts(): Promise<MenuItem[]> {
  const db = readDB();
  return db.products.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
}

export async function getDbProductById(id: string): Promise<MenuItem | null> {
  const db = readDB();
  return db.products.find((p) => String(p.id) === String(id)) || null;
}

export async function createDbProduct(data: Partial<MenuItem>): Promise<MenuItem> {
  const db = readDB();
  const newProduct: MenuItem = {
    id: data.id || `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: data.name || 'Untitled Product',
    description: data.description || '',
    price: Number(data.price) || 0,
    unit: data.unit || '/piece',
    category: data.category || 'pastry',
    badge: data.badge || undefined,
    image: data.image || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=500&fit=crop',
    rating: Number(data.rating) || 5,
    featured: Boolean(data.featured),
    display_order: Number(data.display_order) || db.products.length + 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  db.products.push(newProduct);
  writeDB(db);
  return newProduct;
}

export async function updateDbProduct(id: string, updates: Partial<MenuItem>): Promise<MenuItem | null> {
  const db = readDB();
  const idx = db.products.findIndex((p) => String(p.id) === String(id));
  if (idx === -1) return null;
  db.products[idx] = {
    ...db.products[idx],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  writeDB(db);
  return db.products[idx];
}

export async function deleteDbProduct(id: string): Promise<boolean> {
  const db = readDB();
  const initialLen = db.products.length;
  db.products = db.products.filter((p) => String(p.id) !== String(id));
  if (db.products.length !== initialLen) {
    writeDB(db);
    return true;
  }
  return false;
}

// ─── Orders ───
export async function getDbOrders(): Promise<Order[]> {
  const db = readDB();
  return db.orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getDbOrderById(id: string): Promise<Order | null> {
  const db = readDB();
  return db.orders.find((o) => String(o.id) === String(id)) || null;
}

export async function createDbOrder(data: Partial<Order> & { payment_method?: string }): Promise<Order> {
  const db = readDB();
  const newOrder: Order = {
    id: `ord-${Date.now().toString().slice(-5)}`,
    customer_name: data.customer_name || 'Guest Customer',
    customer_phone: data.customer_phone || '',
    customer_email: data.customer_email || '',
    customer_address: data.customer_address || '',
    items: Array.isArray(data.items) ? data.items : [],
    total: Number(data.total) || 0,
    payment_method: data.payment_method || 'Cash on Delivery',
    status: (data.status as Order['status']) || 'pending',
    notes: data.notes || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  db.orders.unshift(newOrder);
  writeDB(db);
  return newOrder;
}

export async function updateDbOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
  const db = readDB();
  const idx = db.orders.findIndex((o) => String(o.id) === String(id));
  if (idx === -1) return null;
  db.orders[idx] = {
    ...db.orders[idx],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  writeDB(db);
  return db.orders[idx];
}

export async function deleteDbOrder(id: string): Promise<boolean> {
  const db = readDB();
  const initialLen = db.orders.length;
  db.orders = db.orders.filter((o) => String(o.id) !== String(id));
  if (db.orders.length !== initialLen) {
    writeDB(db);
    return true;
  }
  return false;
}

// ─── Testimonials ───
export async function getDbTestimonials(): Promise<Testimonial[]> {
  const db = readDB();
  return db.testimonials.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
}

export async function createDbTestimonial(data: Partial<Testimonial>): Promise<Testimonial> {
  const db = readDB();
  const newT: Testimonial = {
    id: data.id || `t-${Date.now()}`,
    name: data.name || 'Anonymous',
    initials: data.initials || data.name?.slice(0, 2).toUpperCase() || 'JB',
    role: data.role || 'Verified Customer',
    text: data.text || '',
    rating: Number(data.rating) || 5,
    approved: data.approved !== undefined ? data.approved : true,
    created_at: new Date().toISOString(),
  };
  db.testimonials.unshift(newT);
  writeDB(db);
  return newT;
}

export async function updateDbTestimonial(id: string, updates: Partial<Testimonial>): Promise<Testimonial | null> {
  const db = readDB();
  const idx = db.testimonials.findIndex((t) => String(t.id) === String(id));
  if (idx === -1) return null;
  db.testimonials[idx] = {
    ...db.testimonials[idx],
    ...updates,
  };
  writeDB(db);
  return db.testimonials[idx];
}

export async function deleteDbTestimonial(id: string): Promise<boolean> {
  const db = readDB();
  const initialLen = db.testimonials.length;
  db.testimonials = db.testimonials.filter((t) => String(t.id) !== String(id));
  if (db.testimonials.length !== initialLen) {
    writeDB(db);
    return true;
  }
  return false;
}

// ─── Settings ───
export async function getDbSettings(): Promise<Setting[]> {
  const db = readDB();
  return db.settings;
}

export async function updateDbSettings(settingsToUpdate: Array<{ key: string; value: string }>): Promise<Setting[]> {
  const db = readDB();
  for (const item of settingsToUpdate) {
    const idx = db.settings.findIndex((s) => s.key === item.key);
    if (idx !== -1) {
      db.settings[idx].value = item.value;
      db.settings[idx].updated_at = new Date().toISOString();
    } else {
      db.settings.push({
        key: item.key,
        value: item.value,
        updated_at: new Date().toISOString(),
      });
    }
  }
  writeDB(db);
  return db.settings;
}
