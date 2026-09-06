-- ============================================================
-- Jiri Bakes — Complete Production Database Schema for Supabase
-- v2 — Fully idempotent & error-free.
-- Safe to run multiple times (re-running NEVER duplicates data
-- and NEVER throws). Copy & Run in Supabase SQL Editor.
--
-- Fixes vs v1:
--   * Removed deprecated auth.role() (errors on new projects)
--   * Fixed insecure "or true" RLS policies
--   * Order status now accepts every status the app uses
--     (pending / confirmed / baking / preparing / ready /
--      delivered / completed / cancelled)
--   * Seeds are duplicate-proof (unique name + guard clauses)
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
  images           jsonb not null default '[]'::jsonb,
  rating           integer not null default 5 check (rating between 1 and 5),
  featured         boolean not null default false,
  is_bake_of_week  boolean not null default false,
  display_order    integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Ensure columns exist on older installs
alter table products add column if not exists is_bake_of_week boolean not null default false;
alter table products add column if not exists featured boolean not null default false;
alter table products add column if not exists display_order integer not null default 0;
alter table products add column if not exists images jsonb not null default '[]'::jsonb;

-- Unique name keeps seeding idempotent (no duplicate products on re-run)
create unique index if not exists uniq_products_name on products (lower(name));

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
  status           text not null default 'pending',
  notes            text not null default '',
  variant          text not null default 'Egg',
  message_on_item  text not null default '',
  item_note        text not null default '',
  delivery_date    text not null default '',
  delivery_time    text not null default '',
  delivery_location text not null default '',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table orders add column if not exists variant text not null default 'Egg';
alter table orders add column if not exists message_on_item text not null default '';
alter table orders add column if not exists item_note text not null default '';
alter table orders add column if not exists delivery_date text not null default '';
alter table orders add column if not exists delivery_time text not null default '';
alter table orders add column if not exists delivery_location text not null default '';
alter table orders add column if not exists payment_method text not null default 'Cash on Delivery';

-- Recreate the status check so it covers EVERY status used by the app.
-- (Old constraint rejected 'confirmed' and 'preparing' → order updates failed.)
do $$
begin
  alter table orders drop constraint if exists orders_status_check;
  -- Drop any legacy constraint regardless of its name
  if exists (
    select 1 from pg_constraint
    where conrelid = 'orders'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%status%'
  ) then
    execute (
      select string_agg(format('alter table orders drop constraint %I;', conname), ' ')
      from pg_constraint
      where conrelid = 'orders'::regclass
        and contype = 'c'
        and pg_get_constraintdef(oid) like '%status%'
    );
  end if;
end $$;

alter table orders add constraint orders_status_check
  check (status in ('pending','confirmed','baking','preparing','ready','delivered','completed','cancelled'));

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
create index if not exists idx_products_category     on products(category);
create index if not exists idx_products_featured     on products(featured);
create index if not exists idx_products_bake_of_week on products(is_bake_of_week);
create index if not exists idx_orders_status         on orders(status);
create index if not exists idx_orders_created        on orders(created_at desc);
create index if not exists idx_orders_phone          on orders(customer_phone);
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
-- Full set of keys used by the app (admin Settings page + file backend),
-- so Supabase and a fresh db.json always start with identical values.
insert into settings (key, value) values
  ('site_name', 'Jiri Bakes'),
  ('tagline', 'Simply Organic'),
  ('site_title', 'Jiri Bakes – Simply Organic Artisan Bakery'),
  ('site_tagline', 'Where Flour Meets Feeling'),
  ('phone', '+977 1-4567890'),
  ('whatsapp_phone', '9779841234567'),
  ('email', 'hello@jiribakes.com.np'),
  ('address', 'Lokanthali, Araniko Highway, Bhaktapur, Nepal'),
  ('hours_weekday', 'Mon – Sat: 7:00 AM – 8:00 PM'),
  ('hours_sunday', 'Sunday: 8:00 AM – 6:00 PM'),
  ('fresh_bread_time', '7:30 AM'),
  ('delivery_fee', '100'),
  ('currency_symbol', 'NPR'),
  ('hero_headline', 'Baked Like Art.'),
  ('hero_subheadline', 'Handcrafted organic breads, cakes, and morning pastries. Baked fresh daily at dawn in Lokanthali, Nepal.'),
  ('announcement_banner', 'Fresh organic sourdough available every morning at 7:30 AM!'),
  ('street_dog_image', '/we care.png'),
  ('street_dog_title', '5% of Total Sales Goes to Street Dog Charity'),
  ('street_dog_percent', '5%'),
  ('street_dog_desc', 'At Jiri Bakes, we believe kindness should be shared with every living being. 5% of our total sales directly funds daily nutritious meals, medical treatment, vaccines, and shelter for neighborhood street dogs in Lokanthali.'),
  ('street_dog_social_url', 'https://www.instagram.com/jiribakes'),
  ('street_dog_qr_image', '')
on conflict (key) do nothing;  -- never overwrite live edits on re-run

-- ─── 8. Seed Default Products (duplicate-proof) ──────────────
-- Each product exposes an `images` array (gallery used by the Quick View).
-- `image` stays as the cover / first image for backwards compatibility.
insert into products (name, description, price, unit, category, badge, image, images, rating, featured, is_bake_of_week, display_order) values
  ('Sunflower Cream Cake', 'A light layered sponge kissed with organic cream and sunflower honey, decorated with seasonal blooms.', 1800, '/whole', 'cake', 'Fresh Today', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=800&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&auto=format&fit=crop&q=80"]'::jsonb, 5, true, true, 1),
  ('Chocolate Hazelnut Tart', 'Rich dark chocolate ganache poured into a hand-pressed pastry shell, crowned with roasted hazelnuts.', 950, '/piece', 'pastry', 'Organic', 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=600&h=500&fit=crop', '["https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=600&h=500&fit=crop","https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&h=500&fit=crop","https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=600&h=500&fit=crop"]'::jsonb, 5, true, false, 2),
  ('Heritage Sourdough Loaf', '72-hour cold-fermented sourdough made with heritage wheat and a century-old starter culture.', 650, '/loaf', 'bread', 'Organic', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=500&fit=crop', '["https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=500&fit=crop","https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=600&h=500&fit=crop","https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=600&h=500&fit=crop"]'::jsonb, 5, true, false, 3),
  ('Butter Croissant', 'Flaky golden layers of French-style buttery pastry, hand-laminated and baked fresh each morning.', 180, '/piece', 'pastry', 'Fresh Today', 'https://images.unsplash.com/photo-1623334044303-241021148842?w=600&auto=format&fit=crop&q=80', '["https://images.unsplash.com/photo-1623334044303-241021148842?w=600&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1567958451986-2de427a4a0be?w=600&auto=format&fit=crop&q=80"]'::jsonb, 5, false, false, 4),
  ('Strawberry Tart', 'Crisp pastry shell filled with vanilla custard and topped with fresh Himalayan strawberries.', 650, '/piece', 'pastry', 'Seasonal', 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&h=500&fit=crop', '["https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&h=500&fit=crop","https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?w=600&h=500&fit=crop","https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&h=500&fit=crop"]'::jsonb, 4, false, false, 5),
  ('Cinnamon Roll', 'Soft dough rolled with Ceylon cinnamon and topped with tangy cream cheese glaze.', 220, '/piece', 'pastry', 'Popular', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=500&fit=crop', '["https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=500&fit=crop","https://images.unsplash.com/photo-1567958451986-2de427a4a0be?w=600&h=500&fit=crop","https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=600&h=500&fit=crop"]'::jsonb, 5, false, false, 6),
  ('Rustic Country Loaf', 'Stone-ground whole wheat with a deep caramelized crust and nutty interior crumb.', 480, '/loaf', 'bread', 'Organic', 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=600&h=500&fit=crop', '["https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=600&h=500&fit=crop","https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&h=500&fit=crop","https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=500&fit=crop"]'::jsonb, 5, false, false, 7),
  ('Chocolate Hazelnut Cake', 'Dark Belgian chocolate layered with roasted hazelnut praline and velvety ganache.', 2200, '/whole', 'cake', 'Best Seller', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=500&fit=crop', '["https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=500&fit=crop","https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=600&h=500&fit=crop","https://images.unsplash.com/photo-1542826438-bd32f43d626f?w=600&h=500&fit=crop"]'::jsonb, 5, true, false, 8)
on conflict (lower(name)) do nothing;

-- ─── 9. Seed Default Testimonials (only once) ────────────────
insert into testimonials (name, initials, role, text, rating, approved)
select * from (values
  ('Anita Shrestha', 'AS', 'Regular Customer', 'The sourdough here is on another level. I drive 30 minutes just for their bread. The crust, the flavor, the texture — absolute perfection every single time.', 5, true),
  ('Rajesh Patel', 'RP', 'Birthday Order', 'Ordered a custom birthday cake and it was stunning. Not only did it look beautiful, but every slice was moist and delicious. Everyone at the party was amazed.', 5, true),
  ('Sunita Gurung', 'SG', 'Food Blogger', 'Their croissants remind me of the ones I had in Paris. Flaky, buttery, and absolutely heavenly. Jiri Bakes has become my weekend ritual.', 5, true)
) as seed(name, initials, role, text, rating, approved)
where not exists (select 1 from testimonials limit 1);

-- ─── 10. Row Level Security (RLS) ───────────────────────────
alter table products     enable row level security;
alter table orders       enable row level security;
alter table testimonials enable row level security;
alter table settings     enable row level security;

-- Clean up ALL old policies first (v1 had broken/insecure ones),
-- then recreate correct ones. Safe to re-run.
do $$
declare pol record;
begin
  for pol in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('products','orders','testimonials','settings')
  loop
    execute format('drop policy if exists %I on %I.%I;', pol.policyname, pol.schemaname, pol.tablename);
  end loop;
end $$;

-- Public (anon) read access
create policy "public_read_products" on products
  for select using (true);

create policy "public_read_approved_testimonials" on testimonials
  for select using (approved = true);

create policy "public_read_settings" on settings
  for select using (true);

-- Public can place orders, but never read/modify others' orders directly
create policy "public_create_orders" on orders
  for insert with check (true);

-- Authenticated admin = full control (uses auth.uid(), NOT deprecated auth.role())
create policy "admin_all_products" on products
  for all using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

create policy "admin_all_orders" on orders
  for all using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

create policy "admin_all_testimonials" on testimonials
  for all using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

create policy "admin_all_settings" on settings
  for all using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);
