-- Fix: custom_recipe_items was missing RLS, allowing any authenticated user
-- to read recipe items from other users. Access is now gated through the parent
-- custom_recipes table which already has client_id-based RLS.
ALTER TABLE custom_recipe_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client manage own recipe items"
  ON custom_recipe_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM custom_recipes
      WHERE custom_recipes.id = recipe_id
        AND custom_recipes.client_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM custom_recipes
      WHERE custom_recipes.id = recipe_id
        AND custom_recipes.client_id = auth.uid()
    )
  );
