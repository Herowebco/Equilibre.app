/*
  # Ajout de la colonne shopping_list à meal_plans

  1. Modifications
    - Ajout de la colonne `shopping_list` (type JSONB) à la table `meal_plans`
    - Cette colonne stockera la liste de courses générée à partir du plan de repas
    - Structure attendue: {"categories": [{"name": "Fruits & Légumes", "items": [{"name": "...", "checked": false}]}]}

  2. Sécurité
    - Les policies RLS existantes couvrent déjà cette colonne (SELECT, INSERT, UPDATE)
    - Pas besoin de nouvelles policies
*/

-- Ajout de la colonne shopping_list
ALTER TABLE meal_plans 
ADD COLUMN IF NOT EXISTS shopping_list jsonb;
