import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export async function requireUserAndLimit(
  req: Request,
  functionName: string,
  corsHeaders: Record<string, string>,
) {
  const respond = (message: string, status: number) =>
    new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json", ...(status === 429 ? { "Retry-After": "3600" } : {}) },
    });

  const accessToken = req.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!accessToken) return respond("Authentication required", 401);
  if (!supabaseUrl || !anonKey) return respond("Service configuration error", 500);

  const client = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const { data: { user }, error: authError } = await client.auth.getUser(accessToken);
  if (authError || !user) return respond("Authentication required", 401);

  const { data: allowed, error: limitError } = await client.rpc(
    "consume_edge_function_rate_limit",
    { p_function_name: functionName },
  );
  if (limitError) {
    console.error(`${functionName} rate limit check failed:`, limitError.code || "unknown");
    return respond("Service temporarily unavailable", 503);
  }
  if (!allowed) return respond("Rate limit exceeded. Please try again later.", 429);

  return { client, user };
}
