import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { user_id, userProfile, diet, allergies } = body;

    const finalDiet = diet || userProfile?.dietary_preferences?.diet_type || userProfile?.diet || "standard";
    const finalAllergies = allergies || userProfile?.dietary_preferences?.allergies || userProfile?.allergies || [];
    const userId = user_id || userProfile?.id;

    console.log(`🚀 Start Gen - User: ${userId} - Diet: ${finalDiet}`);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
    const systemPrompt = `
      Tu es nutritionniste. Crée un plan de 7 jours JSON STRICT.
      PROFIL: ${finalDiet}. ALLERGIES: ${JSON.stringify(finalAllergies)}.
      RÈGLE: Si Végétarien = ZÉRO VIANDE/POISSON.
      OUTPUT JSON SEULEMENT:
      {
        "days": [
          {
            "day_number": 1,
            "meals": [
              { "type": "breakfast", "name": "...", "calories": 400, "ingredients": ["..."], "macros": {"protein": 20, "carbs": 50, "fat": 10} },
              { "type": "lunch", "name": "...", "calories": 0, "ingredients": [] },
              { "type": "snack", "name": "...", "calories": 0, "ingredients": [] },
              { "type": "dinner", "name": "...", "calories": 0, "ingredients": [] }
            ]
          }
        ]
      }
    `;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Gemini API Error (${response.status}):`, errorText);
      throw new Error(`Gemini API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const planJson = JSON.parse(text);

    if (userId) {
      await supabase.from("meal_plans").delete().eq("user_id", userId);
      const { error } = await supabase.from("meal_plans").insert({
        user_id: userId,
        plan_data: planJson,
        created_at: new Date().toISOString(),
      });
      if (error) console.error("Erreur DB:", error);
      else console.log("✅ Plan sauvegardé en DB !");
    }

    return new Response(JSON.stringify(planJson), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("❌ Erreur:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});