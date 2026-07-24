import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

serve(async (req: Request) => {
  if (req.headers.get("upgrade") !== "websocket") {
    return new Response("Not a websocket request", { status: 400 });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("access_token");

  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Validate the Supabase JWT
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const SARVAM_API_KEY = Deno.env.get("SARVAM_API_KEY");
  if (!SARVAM_API_KEY) {
    return new Response("API key not configured", { status: 500 });
  }

  const { socket: clientWs, response } = Deno.upgradeWebSocket(req);

  // Connect to Sarvam
  const languageCode = url.searchParams.get("language-code") || "en-IN";
  const model = url.searchParams.get("model") || "saaras:v3";
  const targetUrl = `wss://api.sarvam.ai/speech-to-text/ws?language-code=${languageCode}&model=${model}`;

  let sarvamWs: WebSocket;
  const messageQueue: unknown[] = [];

  clientWs.onopen = async () => {
    try {
      const { default: WebSocket } = await import("npm:ws");
      sarvamWs = new WebSocket(targetUrl, {
        headers: {
          "api-subscription-key": SARVAM_API_KEY
        }
      });

      sarvamWs.on('open', () => {
        console.log('Connected to Sarvam WS for user:', user.id);
        // Flush any buffered messages from client
        while (messageQueue.length > 0) {
           const msg = messageQueue.shift();
           sarvamWs.send(msg);
        }
      });

      sarvamWs.on('message', (data: unknown) => {
        if (clientWs.readyState === clientWs.OPEN) {
          clientWs.send(data.toString());
        }
      });

      sarvamWs.on('close', () => {
        if (clientWs.readyState === clientWs.OPEN) {
          clientWs.close();
        }
      });

      sarvamWs.on('error', (err: unknown) => {
        console.error('Sarvam WS Error:', err);
      });
    } catch (e) {
      console.error('Error establishing Sarvam WS:', e);
      clientWs.close();
    }
  };

  clientWs.onmessage = (event) => {
    if (sarvamWs && sarvamWs.readyState === 1) { // 1 is OPEN
      sarvamWs.send(event.data);
    } else {
      messageQueue.push(event.data);
    }
  };

  clientWs.onclose = () => {
    if (sarvamWs && sarvamWs.readyState === 1) {
      sarvamWs.close();
    }
  };

  clientWs.onerror = (e) => {
    console.error('Client WS Error:', e);
  };

  return response;
});
