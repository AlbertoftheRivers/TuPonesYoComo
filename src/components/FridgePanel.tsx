import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Sparkles, Refrigerator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getRecipesByIngredients } from "@/api/recipes";
import { recipeToDisplay, type RecipeDisplay } from "@/data/recipeDisplay";

interface FridgePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRecipe: (recipe: RecipeDisplay) => void;
}

const FridgePanel = ({ isOpen, onClose, onSelectRecipe }: FridgePanelProps) => {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [matches, setMatches] = useState<RecipeDisplay[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ingredients.length === 0) {
      setMatches([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getRecipesByIngredients(ingredients)
      .then((list) => setMatches(list.map(recipeToDisplay)))
      .finally(() => setLoading(false));
  }, [ingredients]);

  const addIngredient = () => {
    const trimmed = input.trim().toLowerCase();
    if (trimmed && !ingredients.includes(trimmed)) {
      setIngredients([...ingredients, trimmed]);
      setInput("");
    }
  };

  const removeIngredient = (item: string) => {
    setIngredients(ingredients.filter((i) => i !== item));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: -300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -300 }}
          transition={{ type: "spring", damping: 25 }}
          className="fixed inset-y-0 left-0 z-50 w-full max-w-md bg-card shadow-2xl border-r border-border overflow-y-auto"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                  <Refrigerator className="w-5 h-5 text-secondary" />
                </div>
                <h2 className="font-heading text-2xl">My Fridge</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <p className="text-muted-foreground text-sm mb-4">
              Add ingredients you have and we&apos;ll find matching recipes!
            </p>

            <div className="flex gap-2 mb-4">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addIngredient()}
                placeholder="e.g. tomato, chicken..."
                className="flex-1"
              />
              <Button onClick={addIngredient} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              <AnimatePresence>
                {ingredients.map((item) => (
                  <motion.span
                    key={item}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
                  >
                    {item}
                    <button type="button" onClick={() => removeIngredient(item)}>
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>

            {matches.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <h3 className="font-heading text-lg">Matching Recipes</h3>
                  {loading && <span className="text-xs text-muted-foreground">(searching…)</span>}
                </div>
                <div className="space-y-3">
                  {matches.map((recipe) => (
                    <motion.button
                      key={recipe.id}
                      type="button"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => onSelectRecipe(recipe)}
                      className="w-full text-left p-4 rounded-lg bg-muted hover:bg-primary/5 transition-colors border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{recipe.image}</span>
                        <div>
                          <p className="font-medium">{recipe.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {recipe.cuisine} · {recipe.time}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {ingredients.length > 0 && !loading && matches.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-8">
                No recipes found with these ingredients. Try different ingredients or add a recipe that uses them!
              </p>
            )}

            {ingredients.length > 0 && loading && matches.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-8">
                Searching recipes…
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FridgePanel;
