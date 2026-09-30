import type { BakeOfWeek, MenuItem, Order, Testimonial, Setting, CakeMenuItemRecord } from '@/types';
import * as fileDb from './db-file';
import * as pgDb from './db-supabase';

/**
 * Data-layer dispatcher.
 *
 * - Local dev (default): file backend (`data/db.json`) — zero setup.
 * - Production (Vercel): set `USE_SUPABASE_DB=true` to use Supabase
 *   (the filesystem is read-only on serverless, so file writes fail).
 *
 * The choice is sticky per server instance: once Supabase fails it falls
 * back to the file backend for reads, so the app keeps serving. Writes
 * (create/update/delete) never fall back — on serverless hosts the file is
 * ephemeral, so a silent fallback turns into ghost orders (visible once via
 * live SSE, gone on refresh). Write failures throw instead.
 */

export type DbBackend = 'supabase' | 'file';

let sticky: DbBackend | null = null;

function supabaseEnabled(): boolean {
  return process.env.USE_SUPABASE_DB === 'true';
}

async function pickBackend(): Promise<DbBackend> {
  if (sticky) return sticky;
  if (!supabaseEnabled()) {
    sticky = 'file';
    return sticky;
  }
  try {
    await pgDb.probe();
    sticky = 'supabase';
  } catch (e) {
    sticky = 'file';
    console.warn(
      '[db] Supabase probe failed, using file backend:',
      e instanceof Error ? e.message : e,
    );
  }
  return sticky;
}

/** For diagnostics (/api/health). Triggers the same sticky selection. */
export async function getBackend(): Promise<DbBackend> {
  return pickBackend();
}

async function run<T>(pg: () => Promise<T>, file: () => Promise<T>): Promise<T> {
  if (await pickBackend()) {
    if (sticky === 'supabase') {
      try {
        return await pg();
      } catch (e) {
        sticky = 'file';
        console.warn(
          '[db] Supabase op failed, falling back to file backend:',
          e instanceof Error ? e.message : e,
        );
        return file();
      }
    }
  }
  return file();
}

/**
 * Writes (create/update/delete) must NEVER silently fall back to the file
 * backend: on serverless hosts the file is ephemeral, so a "successful"
 * checkout would show once via live SSE and vanish on refresh — exactly the
 * ghost-order bug. If Supabase is the selected backend and the write fails,
 * throw so the API returns a real 500 instead of a fake success.
 */
async function runWrite<T>(pg: () => Promise<T>, file: () => Promise<T>): Promise<T> {
  if (await pickBackend()) {
    if (sticky === 'supabase') {
      return pg();
    }
  }
  return file();
}

// ─── Bake of Week ────────────────────────────────────────────────────

export async function getDbBakeOfWeek(): Promise<BakeOfWeek[]> {
  return run(() => pgDb.getDbBakeOfWeek(), () => fileDb.getDbBakeOfWeek());
}

export async function getDbBakeOfWeekById(id: string): Promise<BakeOfWeek | null> {
  return run(() => pgDb.getDbBakeOfWeekById(id), () => fileDb.getDbBakeOfWeekById(id));
}

export async function createDbBakeOfWeek(data: Partial<BakeOfWeek>): Promise<BakeOfWeek> {
  return runWrite(() => pgDb.createDbBakeOfWeek(data), () => fileDb.createDbBakeOfWeek(data));
}

export async function updateDbBakeOfWeek(id: string, updates: Partial<BakeOfWeek>): Promise<BakeOfWeek | null> {
  return runWrite(() => pgDb.updateDbBakeOfWeek(id, updates), () => fileDb.updateDbBakeOfWeek(id, updates));
}

export async function deleteDbBakeOfWeek(id: string): Promise<boolean> {
  return runWrite(() => pgDb.deleteDbBakeOfWeek(id), () => fileDb.deleteDbBakeOfWeek(id));
}

// ─── Products ────────────────────────────────────────────────────────

export async function getDbProducts(): Promise<MenuItem[]> {
  return run(() => pgDb.getDbProducts(), () => fileDb.getDbProducts());
}

export async function getDbProductById(id: string): Promise<MenuItem | null> {
  return run(() => pgDb.getDbProductById(id), () => fileDb.getDbProductById(id));
}

export async function createDbProduct(data: Partial<MenuItem>): Promise<MenuItem> {
  return runWrite(() => pgDb.createDbProduct(data), () => fileDb.createDbProduct(data));
}

export async function updateDbProduct(id: string, updates: Partial<MenuItem>): Promise<MenuItem | null> {
  return runWrite(() => pgDb.updateDbProduct(id, updates), () => fileDb.updateDbProduct(id, updates));
}

export async function deleteDbProduct(id: string): Promise<boolean> {
  return runWrite(() => pgDb.deleteDbProduct(id), () => fileDb.deleteDbProduct(id));
}

// ─── Orders ──────────────────────────────────────────────────────────

export async function getDbOrders(): Promise<Order[]> {
  return run(() => pgDb.getDbOrders(), () => fileDb.getDbOrders());
}

export async function getDbOrderById(id: string): Promise<Order | null> {
  return run(() => pgDb.getDbOrderById(id), () => fileDb.getDbOrderById(id));
}

export async function createDbOrder(data: Partial<Order> & { payment_method?: string }): Promise<Order> {
  return runWrite(() => pgDb.createDbOrder(data), () => fileDb.createDbOrder(data));
}

export async function updateDbOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
  return runWrite(() => pgDb.updateDbOrder(id, updates), () => fileDb.updateDbOrder(id, updates));
}

export async function deleteDbOrder(id: string): Promise<boolean> {
  return runWrite(() => pgDb.deleteDbOrder(id), () => fileDb.deleteDbOrder(id));
}

// ─── Testimonials ────────────────────────────────────────────────────

export async function getDbTestimonials(): Promise<Testimonial[]> {
  return run(() => pgDb.getDbTestimonials(), () => fileDb.getDbTestimonials());
}

export async function createDbTestimonial(data: Partial<Testimonial>): Promise<Testimonial> {
  return runWrite(() => pgDb.createDbTestimonial(data), () => fileDb.createDbTestimonial(data));
}

export async function updateDbTestimonial(id: string, updates: Partial<Testimonial>): Promise<Testimonial | null> {
  return runWrite(() => pgDb.updateDbTestimonial(id, updates), () => fileDb.updateDbTestimonial(id, updates));
}

export async function deleteDbTestimonial(id: string): Promise<boolean> {
  return runWrite(() => pgDb.deleteDbTestimonial(id), () => fileDb.deleteDbTestimonial(id));
}

// ─── Settings ────────────────────────────────────────────────────────

export async function getDbSettings(): Promise<Setting[]> {
  return run(() => pgDb.getDbSettings(), () => fileDb.getDbSettings());
}

export async function updateDbSettings(
  settingsToUpdate: Array<{ key: string; value: string }>,
): Promise<Setting[]> {
  return runWrite(() => pgDb.updateDbSettings(settingsToUpdate), () => fileDb.updateDbSettings(settingsToUpdate));
}

// ─── Cake Menu Items ────────────────────────────────────────────────

export async function getDbCakeMenuItems(): Promise<CakeMenuItemRecord[]> {
  return run(() => pgDb.getDbCakeMenuItems(), () => fileDb.getDbCakeMenuItems());
}

export async function getDbCakeMenuItemById(id: string): Promise<CakeMenuItemRecord | null> {
  return run(() => pgDb.getDbCakeMenuItemById(id), () => fileDb.getDbCakeMenuItemById(id));
}

export async function createDbCakeMenuItem(
  item: Omit<CakeMenuItemRecord, 'id' | 'created_at' | 'updated_at'>
): Promise<CakeMenuItemRecord> {
  return runWrite(() => pgDb.createDbCakeMenuItem(item), () => fileDb.createDbCakeMenuItem(item));
}

export async function updateDbCakeMenuItem(
  id: string,
  updates: Partial<CakeMenuItemRecord>
): Promise<CakeMenuItemRecord | null> {
  return runWrite(() => pgDb.updateDbCakeMenuItem(id, updates), () => fileDb.updateDbCakeMenuItem(id, updates));
}

export async function deleteDbCakeMenuItem(id: string): Promise<boolean> {
  return runWrite(() => pgDb.deleteDbCakeMenuItem(id), () => fileDb.deleteDbCakeMenuItem(id));
}
