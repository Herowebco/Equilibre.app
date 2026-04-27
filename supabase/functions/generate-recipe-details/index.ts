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
    const { mealName, diet, allergies } = body;

    console.log(`🍳 Looking up recipe for: ${mealName}`);

    const dietProfile = allergies && allergies.length > 0
      ? `${diet || "standard"}_${allergies.sort().join("_")}`
      : diet || "standard";

    const { data: cachedRecipe, error: cacheError } = await supabase
      .from("recipe_cache")
      .select("content")
      .eq("meal_name", mealName)
      .eq("diet_profile", dietProfile)
      .maybeSingle();

    if (cachedRecipe && !cacheError) {
      console.log(`✅ Cache HIT for: ${mealName} (${dietProfile})`);
      return new Response(JSON.stringify(cachedRecipe.content), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log(`⚡ Cache MISS - Generating recipe for: ${mealName}`);

    const allergyText = allergies && allergies.length > 0
      ? `ALLERGIES À ÉVITER: ${JSON.stringify(allergies)}.`
      : "";

    const systemPrompt = `
      Tu es un chef cuisinier professionnel. Pour le plat "${mealName}", génère une recette détaillée.
      RÉGIME ALIMENTAIRE: ${diet || "standard"}
      ${allergyText}

      RÈGLES STRICTES:
      - Si végétarien: AUCUNE viande, poisson, fruits de mer
      - Si vegan: AUCUN produit animal (pas de lait, œufs, miel, etc.)
      - Respecte absolument les allergies mentionnées
      - Quantités précises pour les ingrédients
      - Instructions claires et numérotées

      OUTPUT JSON STRICT (pas de texte avant/après):
      {
        "ingredients": ["200g de farine", "2 œufs", "100ml de lait"...],
        "instructions": ["1. Préchauffer le four à 180°C", "2. Mélanger la farine et les œufs", "3. Cuire 20 minutes"...],
        "prep_time": "15 min",
        "cook_time": "20 min",
        "macros_detailed": {
          "protein": "20g",
          "carbs": "50g",
          "fat": "10g",
          "fiber": "5g"
        }
      }
    `;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${errorText}`);
    }

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const recipeDetails = JSON.parse(text);

    const { error: insertError } = await supabase
      .from("recipe_cache")
      .insert({
        meal_name: mealName,
        diet_profile: dietProfile,
        content: recipeDetails,
      });

    if (insertError) {
      console.warn(`⚠️ Failed to cache recipe: ${insertError.message}`);
    } else {
      console.log(`💾 Recipe cached for: ${mealName} (${dietProfile})`);
    }

    console.log(`✅ Recipe generated for: ${mealName}`);

    return new Response(JSON.stringify(recipeDetails), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("❌ Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erreur inconnue"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});