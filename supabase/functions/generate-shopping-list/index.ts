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

    const { planData, user_id } = await req.json();

    if (!planData || !planData.days) {
      throw new Error("Plan de repas invalide");
    }

    if (!user_id) {
      throw new Error("User ID requis");
    }

    const { data: existingPlan, error: fetchError } = await supabase
      .from("meal_plans")
      .select("shopping_list, id")
      .eq("user_id", user_id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error("Erreur récupération plan:", fetchError);
    }

    if (existingPlan?.shopping_list) {
      console.log("✅ Liste de courses trouvée en cache");
      return new Response(JSON.stringify(existingPlan.shopping_list), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log(`🛒 Génération liste de courses pour ${planData.days.length} jours`);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const systemPrompt = `
      Tu es un assistant ménager expert. Analyse ce plan de repas complet de 7 jours.

      TÂCHE :
      1. Extraire tous les ingrédients de chaque repas
      2. Additionner les quantités pour les mêmes items (ex: 200g riz + 300g riz = 500g riz)
      3. Grouper les ingrédients par rayon de supermarché
      4. Estimer les quantités manquantes de manière réaliste

      RAYONS STANDARDS :
      - Fruits & Légumes
      - Boucherie & Poissonnerie
      - Produits Frais (laitages, fromages)
      - Épicerie Salée (pâtes, riz, conserves)
      - Épicerie Sucrée (sucre, farine, chocolat)
      - Surgelés
      - Condiments & Épices
      - Boissons

      PLAN DE REPAS :
      ${JSON.stringify(planData, null, 2)}

      RENVOIE UNIQUEMENT LE JSON (pas de markdown, pas de balises) :
      {
        "categories": [
          {
            "name": "Fruits & Légumes",
            "items": [
              {"name": "Tomates (500g)", "checked": false},
              {"name": "Salade (1 pièce)", "checked": false}
            ]
          },
          {
            "name": "Boucherie & Poissonnerie",
            "items": [
              {"name": "Poulet (400g)", "checked": false},
              {"name": "Saumon (300g)", "checked": false}
            ]
          }
        ]
      }
    `;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: systemPrompt }]
        }]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${errorText}`);
    }

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const shoppingList = JSON.parse(text);

    console.log(`✅ Liste générée avec ${shoppingList.categories?.length || 0} catégories`);

    if (existingPlan?.id) {
      const { error: updateError } = await supabase
        .from("meal_plans")
        .update({ shopping_list: shoppingList })
        .eq("id", existingPlan.id);

      if (updateError) {
        console.error("Erreur sauvegarde liste:", updateError);
      } else {
        console.log("💾 Liste sauvegardée en cache");
      }
    }

    return new Response(JSON.stringify(shoppingList), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("❌ Erreur génération liste:", error);
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