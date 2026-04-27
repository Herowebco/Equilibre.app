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
    const mealsPerDay = userProfile?.dietary_preferences?.meals_per_day || 3;
    const userId = user_id || userProfile?.id;

    // Fetch daily goals from profile in DB if not provided in the request
    let dailyGoals = userProfile?.daily_goals;
    if (!dailyGoals && userId) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("daily_goals")
        .eq("id", userId)
        .maybeSingle();
      if (profileData?.daily_goals) {
        dailyGoals = profileData.daily_goals;
      }
    }

    const targetCalories = dailyGoals?.calories || 2000;
    const targetProtein = dailyGoals?.protein || 150;
    const targetCarbs = dailyGoals?.carbs || 200;
    const targetFats = dailyGoals?.fats || 65;

    // Distribute calories across meals based on meals_per_day
    const mealDistribution = mealsPerDay === 4
      ? { breakfast: 0.25, lunch: 0.35, snack: 0.10, dinner: 0.30 }
      : { breakfast: 0.25, lunch: 0.40, snack: 0, dinner: 0.35 };

    const breakfastCal = Math.round(targetCalories * mealDistribution.breakfast);
    const lunchCal = Math.round(targetCalories * mealDistribution.lunch);
    const snackCal = mealsPerDay === 4 ? Math.round(targetCalories * mealDistribution.snack) : 0;
    const dinnerCal = targetCalories - breakfastCal - lunchCal - snackCal;

    const mealTypesInstruction = mealsPerDay === 4
      ? `4 repas par jour: breakfast (${breakfastCal} kcal), lunch (${lunchCal} kcal), snack (${snackCal} kcal), dinner (${dinnerCal} kcal)`
      : `3 repas par jour: breakfast (${breakfastCal} kcal), lunch (${lunchCal} kcal), dinner (${dinnerCal} kcal)`;

    console.log(`🚀 Start Gen - User: ${userId} - Diet: ${finalDiet} - Target: ${targetCalories} kcal`);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    const systemPrompt = `Tu es nutritionniste expert. Crée un plan alimentaire de 7 jours au format JSON STRICT.

PROFIL UTILISATEUR:
- Régime: ${finalDiet}
- Allergies: ${finalAllergies.length > 0 ? finalAllergies.join(", ") : "Aucune"}

OBJECTIFS NUTRITIONNELS QUOTIDIENS OBLIGATOIRES:
- Calories: EXACTEMENT ${targetCalories} kcal par jour (±50 kcal toléré)
- Protéines: ${targetProtein}g
- Glucides: ${targetCarbs}g
- Lipides: ${targetFats}g

RÈGLES ABSOLUES:
1. La SOMME des calories de tous les repas d'une journée DOIT être égale à ${targetCalories} kcal.
2. ${mealsPerDay === 4 ? "Chaque jour contient EXACTEMENT 4 repas." : "Chaque jour contient EXACTEMENT 3 repas."}
3. Répartition calorique par repas: ${mealTypesInstruction}
4. Ajuste les portions pour atteindre exactement les calories cibles.
5. Si Végétarien ou Vegan = ZÉRO VIANDE, ZÉRO POISSON.
6. Chaque repas doit avoir des macros réalistes (protein + carbs*4 + fat*9 ≈ calories).

FORMAT JSON (output JSON uniquement, sans markdown):
{
  "days": [
    {
      "day_number": 1,
      "meals": [
        { "type": "breakfast", "name": "...", "calories": ${breakfastCal}, "ingredients": ["..."], "macros": {"protein": 25, "carbs": 60, "fat": 12} }${mealsPerDay === 4 ? `,
        { "type": "snack", "name": "...", "calories": ${snackCal}, "ingredients": ["..."], "macros": {"protein": 8, "carbs": 15, "fat": 4} }` : ""},
        { "type": "lunch", "name": "...", "calories": ${lunchCal}, "ingredients": ["..."], "macros": {"protein": 40, "carbs": 70, "fat": 18} },
        { "type": "dinner", "name": "...", "calories": ${dinnerCal}, "ingredients": ["..."], "macros": {"protein": 45, "carbs": 65, "fat": 20} }
      ]
    }
  ]
}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] }),
    });

    if (!response.ok) throw new Error(await response.text());

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
