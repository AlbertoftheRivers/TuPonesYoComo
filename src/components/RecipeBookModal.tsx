import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/data/recipeDisplay";
import type { RecipeDisplay } from "@/data/recipeDisplay";

interface RecipeBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: RecipeDisplay[];
  onSelectRecipe: (recipe: RecipeDisplay) => void;
}

const RecipeBookModal = ({ isOpen, onClose, recipes, onSelectRecipe }: RecipeBookModalProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filtered = selectedCategory
    ? recipes.filter((r) => r._recipe.main_protein === selectedCategory)
    : [];

  const getCountForCategory = (value: string) =>
    recipes.filter((r) => r._recipe.main_protein === value).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {selectedCategory && (
                  <Button variant="ghost" size="icon" onClick={() => setSelectedCategory(null)}>
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                )}
                <h2 className="font-heading text-2xl">
                  {selectedCategory
                    ? CATEGORIES.find((c) => c.value === selectedCategory)?.name ?? selectedCategory
                    : "Recipe Book"}
                </h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {!selectedCategory ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {CATEGORIES.map((cat, i) => {
                  const count = getCountForCategory(cat.value);
                  return (
                    <motion.button
                      key={cat.value}
                      type="button"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setSelectedCategory(cat.value)}
                      className="p-6 rounded-xl bg-muted hover:bg-primary/5 transition-colors border border-border text-center group"
                    >
                      <span className="text-4xl block mb-2 group-hover:scale-110 transition-transform inline-block">
                        {cat.emoji}
                      </span>
                      <p className="font-medium">{cat.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{count} recipes</p>
                    </motion.button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No recipes in this category yet.
                  </p>
                ) : (
                  filtered.map((recipe) => (
                    <motion.button
                      key={recipe.id}
                      type="button"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
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
                  ))
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RecipeBookModal;
