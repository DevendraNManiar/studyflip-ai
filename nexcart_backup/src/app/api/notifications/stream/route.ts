import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// List of connected SSE clients
const activeClients = new Set<ReadableStreamDefaultController>();

/**
 * Broadcasts an event to all connected clients.
 */
export function broadcastSSE(event: string, data: any) {
  console.log(`📡 [SSE Broadcast] Event: "${event}"`, data);
  const formattedMsg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const encoder = new TextEncoder();
  const encodedMsg = encoder.encode(formattedMsg);
  
  activeClients.forEach((controller) => {
    try {
      controller.enqueue(encodedMsg);
    } catch (e) {
      activeClients.delete(controller);
    }
  });
}

export async function GET(req: NextRequest) {
  const responseStream = new ReadableStream({
    start(controller) {
      activeClients.add(controller);
      
      // Send initial connection verification
      controller.enqueue(new TextEncoder().encode(`event: welcome\ndata: {"status":"connected"}\n\n`));
      
      // Clean up connection on client close/abort
      req.signal.addEventListener('abort', () => {
        activeClients.delete(controller);
      });
    },
    cancel() {
      // Clean up when stream is cancelled
    }
  });

  return new Response(responseStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
