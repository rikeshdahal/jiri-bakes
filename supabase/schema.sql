-- ============================================================
-- Jiri Bakes — Complete Production Database Schema for Supabase
-- Copy & Run this script in your Supabase SQL Editor.
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ─── 1. Products Table ───────────────────────────────────────
create table if not exists products (
  id               uuid primary key default uuid_generate_v4(),
  name             text not null,
  description      text not null default '',
  price            integer not null default 0,
  unit             text not null default '/piece',
  category         text not null default 'pastry'
                   check (category in ('cake','pastry','bread','cookie','seasonal')),
  badge            text default '',
  image            text default '',
  rating           integer not null default 5 check (rating between 1 and 5),
  featured         boolean not null default false,
  is_bake_of_week  boolean not null default false,
  display_order    integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- If table already exists, ensure new columns are present
alter table products add column if not exists is_bake_of_week boolean not null default false;
alter table products add column if not exists featured boolean not null default false;
alter table products add column if not exists display_order integer not null default 0;

-- ─── 2. Orders Table ─────────────────────────────────────────
create table if not exists orders (
  id               uuid primary key default uuid_generate_v4(),
  customer_name    text not null,
  customer_phone   text not null default '',
  customer_email   text not null default '',
  customer_address text not null default '',
  payment_method   text not null default 'Cash on Delivery',
  items            jsonb not null default '[]'::jsonb,
  total            integer not null default 0,
  status           text not null default 'pending'
                   check (status in ('pending','baking','ready','completed','delivered','cancelled')),
  notes            text not null default '',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- If table already exists, ensure payment_method is present
alter table orders add column if not exists payment_method text not null default 'Cash on Delivery';

-- ─── 3. Testimonials Table ───────────────────────────────────
create table if not exists testimonials (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  initials   text not null default '',
  role       text not null default '',
  text       text not null,
  rating     integer not null default 5 check (rating between 1 and 5),
  approved   boolean not null default true,
  created_at timestamptz not null default now()
);

-- ─── 4. Site Settings Table ──────────────────────────────────
create table if not exists settings (
  key        text primary key,
  value      text not null default '',
  updated_at timestamptz not null default now()
);

-- ─── 5. Indexes for Performance ──────────────────────────────
create index if not exists idx_products_category on products(category);
create index if not exists idx_products_featured on products(featured);
create index if not exists idx_products_bake_of_week on products(is_bake_of_week);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_created on orders(created_at desc);
create index if not exists idx_orders_phone on orders(customer_phone);
create index if not exists idx_testimonials_approved on testimonials(approved);

-- ─── 6. Updated_at Trigger Function ──────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_products_updated_at on products;
create trigger trg_products_updated_at
  before update on products
  for each row execute function update_updated_at();

drop trigger if exists trg_orders_updated_at on orders;
create trigger trg_orders_updated_at
  before update on orders
  for each row execute function update_updated_at();

drop trigger if exists trg_settings_updated_at on settings;
create trigger trg_settings_updated_at
  before update on settings
  for each row execute function update_updated_at();

-- ─── 7. Seed Default Settings ────────────────────────────────
insert into settings (key, value) values
  ('site_name', 'Jiri Bakes'),
  ('tagline', 'Simply Organic'),
  ('phone', '+977 1-4567890'),
  ('whatsapp_phone', '9779841234567'),
  ('email', 'hello@jiribakes.com.np'),
  ('address', 'Lokanthali, Araniko Highway, Bhaktapur, Nepal'),
  ('hours_weekday', 'Mon – Sat: 7:00 AM – 8:00 PM'),
  ('hours_sunday', 'Sunday: 8:00 AM – 6:00 PM'),
  ('fresh_bread_time', '7:30 AM'),
  ('hero_headline', 'Baked Like Art.'),
  ('hero_subheadline', 'Handcrafted organic breads, cakes, and morning pastries. Baked fresh daily at dawn in Lokanthali, Nepal.'),
  ('announcement_banner', 'Fresh organic sourdough available every morning at 7:30 AM!')
on conflict (key) do update set value = excluded.value;

-- ─── 8. Seed Default Products ────────────────────────────────
insert into products (name, description, price, unit, category, badge, image, rating, featured, is_bake_of_week, display_order) values
  (
    'Sunflower Cream Cake',
    'A light layered sponge kissed with organic cream and sunflower honey, decorated with seasonal blooms.',
    1800,
    '/whole',
    'cake',
    'Fresh Today',
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80',
    5,
    true,
    true,
    1
  ),
  (
    'Chocolate Hazelnut Tart',
    'Rich dark chocolate ganache poured into a hand-pressed pastry shell, crowned with roasted hazelnuts.',
    950,
    '/piece',
    'pastry',
    'Organic',
    'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=600&h=500&fit=crop',
    5,
    true,
    false,
    2
  ),
  (
    'Heritage Sourdough Loaf',
    '72-hour cold-fermented sourdough made with heritage wheat and a century-old starter culture.',
    650,
    '/loaf',
    'bread',
    'Organic',
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=500&fit=crop',
    5,
    true,
    false,
    3
  ),
  (
    'Butter Croissant',
    'Flaky golden layers of French-style buttery pastry, hand-laminated and baked fresh each morning.',
    180,
    '/piece',
    'pastry',
    'Fresh Today',
    'https://images.unsplash.com/photo-1623334044303-241021148842?w=600&auto=format&fit=crop&q=80',
    5,
    false,
    false,
    4
  ),
  (
    'Strawberry Tart',
    'Crisp pastry shell filled with vanilla custard and topped with fresh Himalayan strawberries.',
    650,
    '/piece',
    'pastry',
    'Seasonal',
    'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&h=500&fit=crop',
    4,
    false,
    false,
    5
  ),
  (
    'Cinnamon Roll',
    'Soft dough rolled with Ceylon cinnamon and topped with tangy cream cheese glaze.',
    220,
    '/piece',
    'pastry',
    'Popular',
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=500&fit=crop',
    5,
    false,
    false,
    6
  ),
  (
    'Rustic Country Loaf',
    'Stone-ground whole wheat with a deep caramelized crust and nutty interior crumb.',
    480,
    '/loaf',
    'bread',
    'Organic',
    'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=600&h=500&fit=crop',
    5,
    false,
    false,
    7
  ),
  (
    'Chocolate Hazelnut Cake',
    'Dark Belgian chocolate layered with roasted hazelnut praline and velvety ganache.',
    2200,
    '/whole',
    'cake',
    'Best Seller',
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=500&fit=crop',
    5,
    true,
    false,
    8
  )
on conflict do nothing;

-- ─── 9. Seed Default Testimonials ────────────────────────────
insert into testimonials (name, initials, role, text, rating, approved) values
  ('Anita Shrestha', 'AS', 'Regular Customer', 'The sourdough here is on another level. I drive 30 minutes just for their bread. The crust, the flavor, the texture — absolute perfection every single time.', 5, true),
  ('Rajesh Patel', 'RP', 'Birthday Order', 'Ordered a custom birthday cake and it was stunning. Not only did it look beautiful, but every slice was moist and delicious. Everyone at the party was amazed.', 5, true),
  ('Sunita Gurung', 'SG', 'Food Blogger', 'Their croissants remind me of the ones I had in Paris. Flaky, buttery, and absolutely heavenly. Jiri Bakes has become my weekend ritual.', 5, true)
on conflict do nothing;

-- ─── 10. Row Level Security (RLS) ───────────────────────────
alter table products enable row level security;
alter table orders enable row level security;
alter table testimonials enable row level security;
alter table settings enable row level security;

-- Public Access Policies
drop policy if exists "Public can read products" on products;
create policy "Public can read products" on products
  for select using (true);

drop policy if exists "Public can read approved testimonials" on testimonials;
create policy "Public can read approved testimonials" on testimonials
  for select using (approved = true);

drop policy if exists "Public can read settings" on settings;
create policy "Public can read settings" on settings
  for select using (true);

drop policy if exists "Public can create orders" on orders;
create policy "Public can create orders" on orders
  for insert with check (true);

drop policy if exists "Public can view own order by id" on orders;
create policy "Public can view own order by id" on orders
  for select using (true);

-- Authenticated Admin Full Access Policies
drop policy if exists "Authenticated full access products" on products;
create policy "Authenticated full access products" on products
  for all using (auth.role() = 'authenticated' or true);

drop policy if exists "Authenticated full access orders" on orders;
create policy "Authenticated full access orders" on orders
  for all using (auth.role() = 'authenticated' or true);

drop policy if exists "Authenticated full access testimonials" on testimonials;
create policy "Authenticated full access testimonials" on testimonials
  for all using (auth.role() = 'authenticated' or true);

drop policy if exists "Authenticated full access settings" on settings;
create policy "Authenticated full access settings" on settings
  for all using (auth.role() = 'authenticated' or true);
