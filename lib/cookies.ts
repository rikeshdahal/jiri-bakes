export interface RecentOrderRecord {
  id: string;
  name: string;
  phone?: string;
  total: number;
  payment_method?: string;
  item_count: number;
  created_at: string;
}

const RECENT_ORDERS_COOKIE = 'jiri_recent_orders';

export function getRecentOrders(): RecentOrderRecord[] {
  if (typeof document === 'undefined') return [];
  try {
    // 1. Try reading from cookie
    const match = document.cookie.match(new RegExp('(^|;\\s*)' + RECENT_ORDERS_COOKIE + '=([^;]*)'));
    if (match && match[2]) {
      const parsed = JSON.parse(decodeURIComponent(match[2]));
      if (Array.isArray(parsed)) return parsed;
    }
    // 2. Fallback to localStorage
    const local = localStorage.getItem(RECENT_ORDERS_COOKIE);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore parsing errors
  }
  return [];
}

export function saveRecentOrder(order: RecentOrderRecord) {
  if (typeof document === 'undefined') return;
  try {
    const list = getRecentOrders();
    const updated = [order, ...list.filter((o) => o.id !== order.id)].slice(0, 10);
    const jsonStr = JSON.stringify(updated);

    // Cookie valid for 60 days
    const expires = new Date(Date.now() + 60 * 864e5).toUTCString();
    document.cookie = `${RECENT_ORDERS_COOKIE}=${encodeURIComponent(jsonStr)}; expires=${expires}; path=/; SameSite=Lax`;

    localStorage.setItem(RECENT_ORDERS_COOKIE, jsonStr);
  } catch {
    // ignore
  }
}

export function removeRecentOrder(id: string) {
  if (typeof document === 'undefined') return;
  try {
    const list = getRecentOrders().filter((o) => o.id !== id);
    const jsonStr = JSON.stringify(list);
    const expires = new Date(Date.now() + 60 * 864e5).toUTCString();
    document.cookie = `${RECENT_ORDERS_COOKIE}=${encodeURIComponent(jsonStr)}; expires=${expires}; path=/; SameSite=Lax`;
    localStorage.setItem(RECENT_ORDERS_COOKIE, jsonStr);
  } catch {
    // ignore
  }
}

export function clearRecentOrders() {
  if (typeof document === 'undefined') return;
  document.cookie = `${RECENT_ORDERS_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
  localStorage.removeItem(RECENT_ORDERS_COOKIE);
}
