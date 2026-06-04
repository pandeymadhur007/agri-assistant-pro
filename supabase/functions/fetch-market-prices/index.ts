import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Map Agmarknet commodity names → the names the app expects
const COMMODITY_MAP: Record<string, { name: string; nameHi: string }> = {
  "Rice": { name: "Rice", nameHi: "चावल" },
  "Paddy(Dhan)(Common)": { name: "Rice", nameHi: "चावल" },
  "Paddy(Dhan)(Basmati)": { name: "Rice", nameHi: "चावल" },
  "Wheat": { name: "Wheat", nameHi: "गेहूं" },
  "Maize": { name: "Maize", nameHi: "मक्का" },
  "Bajra(Pearl Millet/Cumbu)": { name: "Bajra", nameHi: "बाजरा" },
  "Jowar(Sorghum)": { name: "Jowar", nameHi: "ज्वार" },
  "Arhar (Tur/Red Gram)(Whole)": { name: "Arhar Dal", nameHi: "अरहर दाल" },
  "Bengal Gram(Gram)(Whole)": { name: "Chana Dal", nameHi: "चना दाल" },
  "Green Gram (Moong)(Whole)": { name: "Moong Dal", nameHi: "मूंग दाल" },
  "Black Gram (Urd Beans)(Whole)": { name: "Urad Dal", nameHi: "उड़द दाल" },
  "Lentil (Masur)(Whole)": { name: "Masoor Dal", nameHi: "मसूर दाल" },
  "Soyabean": { name: "Soyabean", nameHi: "सोयाबीन" },
  "Mustard": { name: "Mustard", nameHi: "सरसों" },
  "Groundnut": { name: "Groundnut", nameHi: "मूंगफली" },
  "Cotton": { name: "Cotton", nameHi: "कपास" },
  "Sugarcane": { name: "Sugarcane", nameHi: "गन्ना" },
  "Onion": { name: "Onion", nameHi: "प्याज" },
  "Potato": { name: "Potato", nameHi: "आलू" },
  "Tomato": { name: "Tomato", nameHi: "टमाटर" },
  "Green Chilli": { name: "Green Chilli", nameHi: "हरी मिर्च" },
  "Turmeric": { name: "Turmeric", nameHi: "हल्दी" },
  "Garlic": { name: "Garlic", nameHi: "लहसुन" },
  "Banana": { name: "Banana", nameHi: "केला" },
  "Apple": { name: "Apple", nameHi: "सेब" },
  "Mango": { name: "Mango", nameHi: "आम" },
};

const AGMARKNET_RESOURCE = "9ef84268-d588-465a-a308-a864a43d0070";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DATA_GOV_API_KEY = Deno.env.get("DATA_GOV_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!DATA_GOV_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: "Service configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch live mandi prices from data.gov.in (Agmarknet)
    const url = `https://api.data.gov.in/resource/${AGMARKNET_RESOURCE}?api-key=${DATA_GOV_API_KEY}&format=json&limit=2000`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25_000);
    let agmark: { records?: any[] } = {};
    try {
      const r = await fetch(url, { signal: controller.signal });
      if (!r.ok) {
        const t = await r.text();
        console.error("data.gov.in error:", r.status, t.slice(0, 300));
        return new Response(
          JSON.stringify({ error: "Live mandi feed unavailable" }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      agmark = await r.json();
    } catch (e) {
      console.error("data.gov.in fetch failed:", e instanceof Error ? e.message : e);
      return new Response(
        JSON.stringify({ error: "Live mandi feed unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } finally {
      clearTimeout(timer);
    }

    const records: any[] = Array.isArray(agmark.records) ? agmark.records : [];
    const parseDate = (s: string): string | null => {
      if (!s) return null;
      // Agmarknet uses DD/MM/YYYY
      const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (m) return `${m[3]}-${m[2]}-${m[1]}`;
      const d = new Date(s);
      return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
    };

    // Load previous prices to compute trend
    const { data: previous } = await supabase
      .from("market_prices")
      .select("crop_name,state,mandi,price");
    const prevMap = new Map<string, number>();
    for (const p of previous || []) {
      prevMap.set(`${p.crop_name}|${p.state}|${p.mandi}`, Number(p.price));
    }

    const priceRows: any[] = [];
    for (const rec of records) {
      const commodity = String(rec.commodity || "").trim();
      const mapped = COMMODITY_MAP[commodity];
      if (!mapped) continue;
      const modal = Number(rec.modal_price);
      if (!modal || modal <= 0) continue;
      const state = String(rec.state || "").trim();
      const district = String(rec.district || "").trim();
      const mandi = String(rec.market || "").trim();
      if (!state || !district || !mandi) continue;
      const price_date = parseDate(rec.arrival_date) || new Date().toISOString().split("T")[0];

      const key = `${mapped.name}|${state}|${mandi}`;
      const prev = prevMap.get(key);
      let price_trend: "up" | "down" | "stable" = "stable";
      if (prev && prev > 0) {
        const delta = (modal - prev) / prev;
        if (delta > 0.02) price_trend = "up";
        else if (delta < -0.02) price_trend = "down";
      }

      priceRows.push({
        crop_name: mapped.name,
        crop_name_hi: mapped.nameHi,
        state,
        district,
        mandi,
        price: Math.round(modal),
        unit: "quintal",
        price_date,
        price_trend,
      });
    }

    if (priceRows.length === 0) {
      return new Response(
        JSON.stringify({ error: "Live mandi feed returned no usable records" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Replace old prices with fresh feed
    await supabase.from("market_prices").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    let insertedCount = 0;
    for (let i = 0; i < priceRows.length; i += 100) {
      const batch = priceRows.slice(i, i + 100);
      const { error: insertError } = await supabase.from("market_prices").insert(batch);
      if (insertError) {
        console.error("Insert error:", insertError.message);
      } else {
        insertedCount += batch.length;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        count: insertedCount,
        source: "data.gov.in/agmarknet",
        updated_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("fetch-market-prices error:", e);
    return new Response(
      JSON.stringify({ error: "Failed to update market prices" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
