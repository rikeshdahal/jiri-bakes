import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';

// Global set of SSE writer functions – one per connected admin tab
const clients = new Set<(data: string) => void>();

// Called externally (from order creation) to push a new-order event
export function pushOrderNotification(order: {
  id: string;
  customer_name: string;
  payment_method?: string;
  total: number;
  items: { name: string; quantity: number }[];
  created_at: string;
}) {
  const payload = JSON.stringify({ type: 'new_order', order });
  clients.forEach((send) => send(payload));
}

// GET /api/notifications – SSE stream for admin only.
// NOTE: in-memory fan-out is a fast-path only (single instance). The admin
// bell also polls /api/orders, so notifications still arrive on serverless /
// multi-instance deployments where this process never sees the order POST.
export async function GET(request: Request) {
  // Only authenticated admins may subscribe to order notifications.
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const encoder = new TextEncoder();

  let send: ((data: string) => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const cleanup = () => {
    if (heartbeat) {
      clearInterval(heartbeat);
      heartbeat = null;
    }
    if (send) {
      clients.delete(send);
      send = null;
    }
  };

  const stream = new ReadableStream({
    start(controller) {
      // Send an initial heartbeat so the browser confirms connection
      controller.enqueue(encoder.encode('data: {"type":"connected"}\n\n'));

      // Register this client
      send = (data: string) => {
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {
          // stream already closed — drop this client
          cleanup();
        }
      };

      clients.add(send);

      // Heartbeat every 25 s to keep connection alive through proxies
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          cleanup();
        }
      }, 25_000);

      // If the admin tab goes away, the request signal aborts — clean up.
      request.signal.addEventListener('abort', () => {
        cleanup();
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
    cancel() {
      cleanup();
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
