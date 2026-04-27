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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const apiKey = Deno.env.get("GEMINI_API_KEY");

    const supabase = createClient(supabaseUrl!, supabaseKey!);

    const { currentMeal, diet, allergies, mealType, user_id } = await req.json();

    const finalDiet = diet || "standard";
    const finalAllergies = allergies || [];

    console.log(`🔄 Régénération repas - Type: ${mealType} - Diet: ${finalDiet}`);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const systemPrompt = `
      Tu es nutritionniste. Remplace ce repas : "${currentMeal.name}" par une alternative équivalente mais DIFFÉRENTE.

      RÈGLES IMPÉRATIVES :
      - Respecte le régime : ${finalDiet}
      - Allergies à éviter : ${JSON.stringify(finalAllergies)}
      - Si Végétarien = ZÉRO VIANDE/POISSON
      - Si Vegan = AUCUN PRODUIT ANIMAL
      - Calories similaires : environ ${currentMeal.calories} kcal
      - Type de repas : ${mealType}

      RENVOIE UNIQUEMENT LE JSON DU NOUVEAU REPAS (pas de markdown, pas de balises) :
      {
        "type": "${mealType}",
        "name": "Nom du nouveau plat",
        "calories": ${currentMeal.calories},
        "ingredients": ["ingredient1", "ingredient2", "..."],
        "macros": {"protein": 20, "carbs": 50, "fat": 10}
      }
    `;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] }),
    });

    if (!response.ok) throw new Error(await response.text());

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const newMeal = JSON.parse(text);

    console.log(`✅ Nouveau repas généré: ${newMeal.name}`);

    if (user_id) {
      const { data: activePlan, error: fetchError } = await supabase
        .from("meal_plans")
        .select("id")
        .eq("user_id", user_id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        console.error("Erreur récupération plan actif:", fetchError);
      } else if (activePlan) {
        const { error: updateError } = await supabase
          .from("meal_plans")
          .update({ shopping_list: null })
          .eq("id", activePlan.id);

        if (updateError) {
          console.error("Erreur suppression cache liste:", updateError);
        } else {
          console.log("🗑️ Cache liste de courses supprimé");
        }
      }
    }

    return new Response(JSON.stringify(newMeal), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("❌ Erreur régénération repas:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
