import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { BakeOfWeek, MenuItem, Order, OrderItem, Testimonial, Setting } from '@/types';

/**
 * Supabase backend for the bakery data layer.
 *
 * Uses the cookie-aware server client so Row Level Security applies
 * end-to-end: anonymous visitors get public reads (+ order inserts),
 * logged-in admins get full access. No service-role key needed.
 *
 * All reads sort in JS (not in SQL) so the backend keeps working even
 * on older installs that lack newer columns. The `bake_of_week` table
 * may not exist on old installs — reads degrade to empty, writes throw
 * a clear "run supabase/schema.sql" error.
 */

type Row = Record<string, unknown>;

const str = (v: unknown, fallback = ''): string =>
  typeof v === 'string' ? v : v == null ? fallback : String(v);
const num = (v: unknown, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

function toSupabaseError(e: unknown): Error & { code?: string } {
  const err = new Error(
    e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Supabase query failed',
  ) as Error & { code?: string };
  if (e && typeof e === 'object' && 'code' in e) err.code = String((e as { code: unknown }).code);
  return err;
}

function throwIfError(res: { error: unknown }): void {
  if (res.error) throw toSupabaseError(res.error);
}

function isMissingTable(e: unknown): boolean {
  if (!e || typeof e !== 'object') return false;
  const rec = e as Record<string, unknown>;
  if (rec.code === 'PGRST205') return true;
  if (typeof rec.message === 'string') {
    return rec.message.includes('Could not find the table') || rec.message.includes('does not exist');
  }
  return false;
}

/** Connectivity + schema probe used by the dispatcher to pick a backend. */
export async function probe(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('products').select('id').limit(1);
  if (error) throw toSupabaseError(error);
}

// ─── Mappers ─────────────────────────────────────────────────────────

function mapProduct(r: Row): MenuItem {
  const images = arr(r.images).map((i) => String(i)).filter(Boolean);
  return {
    id: str(r.id),
    name: str(r.name, 'Untitled Product'),
    description: str(r.description),
    price: num(r.price),
    unit: str(r.unit, '/piece'),
    category: (['bread', 'cake', 'pastry', 'cookie', 'seasonal'].includes(str(r.category))
      ? str(r.category)
      : 'pastry') as MenuItem['category'],
    badge: str(r.badge) || undefined,
    image: str(r.image) || undefined,
    images: images.length > 0 ? images : undefined,
    rating: num(r.rating, 5),
    featured: Boolean(r.featured),
    is_bake_of_week: Boolean(r.is_bake_of_week),
    display_order: num(r.display_order),
    created_at: str(r.created_at) || undefined,
    updated_at: str(r.updated_at) || undefined,
  };
}

function mapOrder(r: Row): Order {
  return {
    id: str(r.id),
    customer_name: str(r.customer_name, 'Guest Customer'),
    customer_phone: str(r.customer_phone),
    customer_email: str(r.customer_email) || undefined,
    customer_address: str(r.customer_address),
    items: arr<OrderItem>(r.items),
    total: num(r.total),
    payment_method: str(r.payment_method, 'Cash on Delivery'),
    status: (str(r.status, 'pending') as Order['status']),
    notes: str(r.notes) || undefined,
    variant: str(r.variant) || undefined,
    message_on_item: str(r.message_on_item) || undefined,
    item_note: str(r.item_note) || undefined,
    delivery_date: str(r.delivery_date) || undefined,
    delivery_time: str(r.delivery_time) || undefined,
    delivery_location: str(r.delivery_location) || undefined,
    created_at: str(r.created_at, new Date().toISOString()),
    updated_at: str(r.updated_at, new Date().toISOString()),
  };
}

function mapTestimonial(r: Row): Testimonial {
  return {
    id: str(r.id),
    name: str(r.name, 'Anonymous'),
    initials: str(r.initials) || str(r.name).slice(0, 2).toUpperCase() || 'JB',
    role: str(r.role, 'Verified Customer'),
    text: str(r.text),
    rating: num(r.rating, 5),
    approved: r.approved !== false,
    created_at: str(r.created_at) || undefined,
  };
}

function mapBake(r: Row): BakeOfWeek {
  return {
    id: str(r.id),
    product_id: str(r.product_id) || undefined,
    title: str(r.title, 'Bake of the Week'),
    subtitle: str(r.subtitle, 'Bake of the Week'),
    price: num(r.price),
    unit: str(r.unit, '/whole'),
    image: str(r.image),
    description: str(r.description),
    active: r.active !== false,
    created_at: str(r.created_at, new Date().toISOString()),
    updated_at: str(r.updated_at, new Date().toISOString()),
  };
}

const byCreatedDesc = (a: { created_at?: string }, b: { created_at?: string }) =>
  new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();

// ─── Bake of Week ────────────────────────────────────────────────────

export async function getDbBakeOfWeek(): Promise<BakeOfWeek[]> {
  try {
    const supabase = await createClient();
    const res = await supabase.from('bake_of_week').select('*');
    throwIfError(res);
    return ((res.data ?? []) as Row[]).map(mapBake).sort(byCreatedDesc);
  } catch (e) {
    if (isMissingTable(e)) return [];
    throw toSupabaseError(e);
  }
}

export async function getDbBakeOfWeekById(id: string): Promise<BakeOfWeek | null> {
  try {
    const supabase = await createClient();
    const res = await supabase.from('bake_of_week').select('*').eq('id', id).maybeSingle();
    throwIfError(res);
    return res.data ? mapBake(res.data as Row) : null;
  } catch (e) {
    if (isMissingTable(e)) return null;
    throw toSupabaseError(e);
  }
}

export async function createDbBakeOfWeek(data: Partial<BakeOfWeek>): Promise<BakeOfWeek> {
  const supabase = await createClient();
  const res = await supabase
    .from('bake_of_week')
    .insert({
      product_id: data.product_id || null,
      title: data.title || 'Bake of the Week',
      subtitle: data.subtitle || 'Bake of the Week',
      price: num(data.price),
      unit: data.unit || '/whole',
      image: data.image || '',
      description: data.description || '',
      active: data.active !== false,
    })
    .select('*')
    .single();
  if (res.error) {
    if (isMissingTable(res.error)) {
      throw new Error('bake_of_week table is missing — run supabase/schema.sql in the Supabase SQL Editor.');
    }
    throw toSupabaseError(res.error);
  }
  return mapBake(res.data as Row);
}

export async function updateDbBakeOfWeek(id: string, updates: Partial<BakeOfWeek>): Promise<BakeOfWeek | null> {
  const supabase = await createClient();
  const patch: Row = { updated_at: new Date().toISOString() };
  if (updates.product_id !== undefined) patch.product_id = updates.product_id || null;
  if (updates.title !== undefined) patch.title = updates.title;
  if (updates.subtitle !== undefined) patch.subtitle = updates.subtitle;
  if (updates.price !== undefined) patch.price = num(updates.price);
  if (updates.unit !== undefined) patch.unit = updates.unit;
  if (updates.image !== undefined) patch.image = updates.image;
  if (updates.description !== undefined) patch.description = updates.description;
  if (updates.active !== undefined) patch.active = updates.active;
  const res = await supabase.from('bake_of_week').update(patch).eq('id', id).select('*');
  throwIfError(res);
  const rows = (res.data ?? []) as Row[];
  return rows.length > 0 ? mapBake(rows[0]) : null;
}

export async function deleteDbBakeOfWeek(id: string): Promise<boolean> {
  const supabase = await createClient();
  const res = await supabase.from('bake_of_week').delete().eq('id', id).select('id');
  throwIfError(res);
  return ((res.data ?? []) as Row[]).length > 0;
}

// ─── Products ────────────────────────────────────────────────────────

export async function getDbProducts(): Promise<MenuItem[]> {
  const supabase = await createClient();
  const res = await supabase.from('products').select('*');
  throwIfError(res);
  return ((res.data ?? []) as Row[])
    .map(mapProduct)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
}

export async function getDbProductById(id: string): Promise<MenuItem | null> {
  const supabase = await createClient();
  const res = await supabase.from('products').select('*').eq('id', id).maybeSingle();
  throwIfError(res);
  return res.data ? mapProduct(res.data as Row) : null;
}

export async function createDbProduct(data: Partial<MenuItem>): Promise<MenuItem> {
  const supabase = await createClient();
  const images = Array.isArray(data.images) ? data.images.map((i) => String(i).trim()).filter(Boolean) : [];
  const fallbackImage = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=500&fit=crop';
  const res = await supabase
    .from('products')
    .insert({
      name: data.name || 'Untitled Product',
      description: data.description || '',
      price: num(data.price),
      unit: data.unit || '/piece',
      category: data.category || 'pastry',
      badge: data.badge || '',
      image: data.image || images[0] || fallbackImage,
      images: images.length > 0 ? images : data.image ? [data.image] : [],
      rating: num(data.rating, 5),
      featured: Boolean(data.featured),
      is_bake_of_week: Boolean(data.is_bake_of_week),
      display_order: num(data.display_order),
    })
    .select('*')
    .single();
  throwIfError(res);
  return mapProduct(res.data as Row);
}

export async function updateDbProduct(id: string, updates: Partial<MenuItem>): Promise<MenuItem | null> {
  const supabase = await createClient();
  const patch: Row = { updated_at: new Date().toISOString() };
  const fields: (keyof MenuItem)[] = [
    'name', 'description', 'price', 'unit', 'category', 'badge', 'image',
    'images', 'rating', 'featured', 'is_bake_of_week', 'display_order',
  ];
  for (const f of fields) {
    if (updates[f] !== undefined) patch[f] = updates[f] as unknown;
  }
  if (patch.images !== undefined && !Array.isArray(patch.images)) patch.images = [];
  const res = await supabase.from('products').update(patch).eq('id', id).select('*');
  throwIfError(res);
  const rows = (res.data ?? []) as Row[];
  return rows.length > 0 ? mapProduct(rows[0]) : null;
}

export async function deleteDbProduct(id: string): Promise<boolean> {
  const supabase = await createClient();
  const res = await supabase.from('products').delete().eq('id', id).select('id');
  throwIfError(res);
  return ((res.data ?? []) as Row[]).length > 0;
}

// ─── Orders ──────────────────────────────────────────────────────────

export async function getDbOrders(): Promise<Order[]> {
  const supabase = await createClient();
  const res = await supabase.from('orders').select('*');
  throwIfError(res);
  return ((res.data ?? []) as Row[]).map(mapOrder).sort(byCreatedDesc);
}

export async function getDbOrderById(id: string): Promise<Order | null> {
  const supabase = await createClient();
  const res = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
  throwIfError(res);
  return res.data ? mapOrder(res.data as Row) : null;
}

export async function createDbOrder(data: Partial<Order> & { payment_method?: string }): Promise<Order> {
  const supabase = await createClient();
  const res = await supabase
    .from('orders')
    .insert({
      id: typeof data.id === 'string' && data.id.trim() ? data.id.trim().slice(0, 32) : undefined,
      customer_name: data.customer_name || 'Guest Customer',
      customer_phone: data.customer_phone || '',
      customer_email: data.customer_email || '',
      customer_address: data.customer_address || '',
      items: Array.isArray(data.items) ? data.items : [],
      total: num(data.total),
      payment_method: data.payment_method || 'Cash on Delivery',
      status: (data.status as string) || 'pending',
      notes: data.notes || '',
      variant: data.variant || 'Egg',
      message_on_item: data.message_on_item || '',
      item_note: data.item_note || '',
      delivery_date: data.delivery_date || '',
      delivery_time: data.delivery_time || '',
      delivery_location: data.delivery_location || '',
    })
    .select('*')
    .single();
  if (res.error) {
    const msg = String((res.error as { message?: unknown }).message ?? '');
    if (/invalid input syntax.*uuid|invalid.*uuid/i.test(msg)) {
      throw new Error(
        'orders.id is still uuid — run the v4 migration in supabase/schema.sql (orders.id → text) in the Supabase SQL Editor.',
      );
    }
    throw toSupabaseError(res.error);
  }
  return mapOrder(res.data as Row);
}

export async function updateDbOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
  const supabase = await createClient();
  const patch: Row = { updated_at: new Date().toISOString() };
  const fields: (keyof Order)[] = [
    'customer_name', 'customer_phone', 'customer_email', 'customer_address', 'items',
    'total', 'payment_method', 'status', 'notes', 'variant', 'message_on_item',
    'item_note', 'delivery_date', 'delivery_time', 'delivery_location',
  ];
  for (const f of fields) {
    if (updates[f] !== undefined) patch[f] = updates[f] as unknown;
  }
  const res = await supabase.from('orders').update(patch).eq('id', id).select('*');
  throwIfError(res);
  const rows = (res.data ?? []) as Row[];
  return rows.length > 0 ? mapOrder(rows[0]) : null;
}

export async function deleteDbOrder(id: string): Promise<boolean> {
  const supabase = await createClient();
  const res = await supabase.from('orders').delete().eq('id', id).select('id');
  throwIfError(res);
  return ((res.data ?? []) as Row[]).length > 0;
}

// ─── Testimonials ────────────────────────────────────────────────────

export async function getDbTestimonials(): Promise<Testimonial[]> {
  const supabase = await createClient();
  const res = await supabase.from('testimonials').select('*');
  throwIfError(res);
  return ((res.data ?? []) as Row[]).map(mapTestimonial).sort(byCreatedDesc);
}

export async function createDbTestimonial(data: Partial<Testimonial>): Promise<Testimonial> {
  const supabase = await createClient();
  const res = await supabase
    .from('testimonials')
    .insert({
      name: data.name || 'Anonymous',
      initials: data.initials || data.name?.slice(0, 2).toUpperCase() || 'JB',
      role: data.role || 'Verified Customer',
      text: data.text || '',
      rating: num(data.rating, 5),
      approved: data.approved !== undefined ? data.approved : true,
    })
    .select('*')
    .single();
  throwIfError(res);
  return mapTestimonial(res.data as Row);
}

export async function updateDbTestimonial(id: string, updates: Partial<Testimonial>): Promise<Testimonial | null> {
  const supabase = await createClient();
  const patch: Row = {};
  const fields: (keyof Testimonial)[] = ['name', 'initials', 'role', 'text', 'rating', 'approved'];
  for (const f of fields) {
    if (updates[f] !== undefined) patch[f] = updates[f] as unknown;
  }
  const res = await supabase.from('testimonials').update(patch).eq('id', id).select('*');
  throwIfError(res);
  const rows = (res.data ?? []) as Row[];
  return rows.length > 0 ? mapTestimonial(rows[0]) : null;
}

export async function deleteDbTestimonial(id: string): Promise<boolean> {
  const supabase = await createClient();
  const res = await supabase.from('testimonials').delete().eq('id', id).select('id');
  throwIfError(res);
  return ((res.data ?? []) as Row[]).length > 0;
}

// ─── Settings ────────────────────────────────────────────────────────

export async function getDbSettings(): Promise<Setting[]> {
  const supabase = await createClient();
  const res = await supabase.from('settings').select('*');
  throwIfError(res);
  return ((res.data ?? []) as Row[]).map((r) => ({
    key: str(r.key),
    value: str(r.value),
    updated_at: str(r.updated_at) || undefined,
  }));
}

export async function updateDbSettings(
  settingsToUpdate: Array<{ key: string; value: string }>,
): Promise<Setting[]> {
  const supabase = await createClient();
  for (const item of settingsToUpdate) {
    const res = await supabase
      .from('settings')
      .upsert({ key: item.key, value: item.value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    throwIfError(res);
  }
  return getDbSettings();
}
