import { NextResponse } from 'next/server';

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

// GET /api/notifications – SSE stream for admin
export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send an initial heartbeat so the browser confirms connection
      controller.enqueue(encoder.encode('data: {"type":"connected"}\n\n'));

      // Register this client
      const send = (data: string) => {
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {
          // stream already closed
        }
      };

      clients.add(send);

      // Heartbeat every 25 s to keep connection alive through proxies
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeat);
        }
      }, 25_000);

      // Cleanup when admin disconnects
      return () => {
        clearInterval(heartbeat);
        clients.delete(send);
      };
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
