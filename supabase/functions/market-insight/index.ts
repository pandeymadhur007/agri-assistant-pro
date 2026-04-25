import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

interface InsightRequest {
  crop_name: string;
  language?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { crop_name, language = "en" } = (await req.json()) as InsightRequest;
    if (!crop_name || typeof crop_name !== "string") {
      return new Response(JSON.stringify({ error: "crop_name required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Pull last 30 days of prices for this crop
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const { data: prices } = await supabase
      .from("market_prices")
      .select("price, price_date, mandi")
      .eq("crop_name", crop_name)
      .gte("price_date", since.toISOString().slice(0, 10))
      .order("price_date", { ascending: true });

    // Pull MSP for context
    const { data: msp } = await supabase
      .from("msp_rates")
      .select("msp_price, season, year")
      .eq("crop_name", crop_name)
      .maybeSingle();

    if (!prices || prices.length === 0) {
      return new Response(
        JSON.stringify({
          trend: "stable",
          recommendation: language === "hi" ? "पर्याप्त डेटा नहीं" : "Not enough data",
          forecast: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Aggregate daily medians (more robust to outlier mandis than mean)
    const byDate = new Map<string, number[]>();
    for (const p of prices) {
      const arr = byDate.get(p.price_date) ?? [];
      arr.push(Number(p.price));
      byDate.set(p.price_date, arr);
    }
    const median = (arr: number[]) => {
      const s = [...arr].sort((a, b) => a - b);
      const m = Math.floor(s.length / 2);
      return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
    };
    const series = [...byDate.entries()]
      .map(([d, arr]) => ({ date: d, price: Math.round(median(arr)) }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Robust trend: compare last-7-day avg vs prior window avg
    const recent = series.slice(-7);
    const prior = series.slice(0, Math.max(0, series.length - 7));
    const avg = (a: { price: number }[]) =>
      a.length ? a.reduce((s, x) => s + x.price, 0) / a.length : 0;
    const recentAvg = avg(recent);
    const priorAvg = avg(prior) || recentAvg;
    const pctChange = priorAvg ? ((recentAvg - priorAvg) / priorAvg) * 100 : 0;

    // Volatility (coefficient of variation %)
    const meanAll = avg(series);
    const variance =
      series.reduce((s, x) => s + (x.price - meanAll) ** 2, 0) / Math.max(1, series.length);
    const stdev = Math.sqrt(variance);
    const volatilityPct = meanAll ? (stdev / meanAll) * 100 : 0;

    // Threshold scales with volatility — noisy markets need bigger moves to count as a trend
    const trendThreshold = Math.max(2, Math.min(6, volatilityPct * 0.5));
    const trend: "rising" | "falling" | "stable" =
      pctChange > trendThreshold ? "rising" : pctChange < -trendThreshold ? "falling" : "stable";

    const last = series[series.length - 1].price;
    const minP = Math.min(...series.map((s) => s.price));
    const maxP = Math.max(...series.map((s) => s.price));

    // Simple linear forecast for next 7 days
    const n = series.length;
    const xs = series.map((_, i) => i);
    const ys = series.map((s) => s.price);
    const meanX = xs.reduce((a, b) => a + b, 0) / n;
    const meanY = ys.reduce((a, b) => a + b, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) { num += (xs[i] - meanX) * (ys[i] - meanY); den += (xs[i] - meanX) ** 2; }
    const slope = den === 0 ? 0 : num / den;
    const intercept = meanY - slope * meanX;
    const forecast = Array.from({ length: 7 }, (_, i) => ({
      day: i + 1,
      price: Math.max(0, Math.round(intercept + slope * (n + i))),
    }));

    // Use Lovable AI for natural-language guidance
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    let recommendation = "";
    if (apiKey) {
      const sysPrompt =
        language === "hi"
          ? "आप एक कृषि बाजार सलाहकार हैं। 1-2 छोटे वाक्यों में हिंदी में किसान को सलाह दें।"
          : "You are a farm market advisor. Give a farmer 1-2 short sentences of advice.";
    const mspLine = msp?.msp_price
      ? `MSP: ₹${msp.msp_price}/quintal (current is ${(((last - msp.msp_price) / msp.msp_price) * 100).toFixed(1)}% vs MSP).`
      : "MSP unknown.";
    const userPrompt = `Crop: ${crop_name}.
Trend (last 7d vs prior): ${trend} (${pctChange.toFixed(1)}% change).
Current price: ₹${last}/quintal. 30-day range: ₹${minP}–₹${maxP}. Volatility: ${volatilityPct.toFixed(1)}%.
7-day forecast end: ₹${forecast[6].price}/quintal.
${mspLine}
Give a concrete sell-now-or-wait call. Mention MSP comparison if relevant. Keep it 1-2 sentences, no disclaimers.`;

      try {
        const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: sysPrompt },
              { role: "user", content: userPrompt },
            ],
          }),
        });
        if (resp.ok) {
          const j = await resp.json();
          recommendation = j.choices?.[0]?.message?.content?.trim() ?? "";
        }
      } catch (e) {
        console.error("AI advice failed:", e);
      }
    }

    if (!recommendation) {
      recommendation =
        trend === "rising"
          ? language === "hi"
            ? "कीमतें बढ़ रही हैं — कुछ दिन रुकने पर बेहतर भाव मिल सकता है।"
            : "Prices are rising — waiting a few days may fetch a better rate."
          : trend === "falling"
          ? language === "hi"
            ? "कीमतें गिर रही हैं — जल्द बेचने पर विचार करें।"
            : "Prices are falling — consider selling soon."
          : language === "hi"
          ? "कीमतें स्थिर हैं — आराम से बेचें।"
          : "Prices are stable — sell at your convenience.";
    }

    return new Response(
      JSON.stringify({
        trend,
        pct_change: Number(pctChange.toFixed(2)),
        current_avg: Math.round(last),
        forecast,
        history: series,
        recommendation,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("market-insight error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
