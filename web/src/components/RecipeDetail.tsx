import { motion } from "framer-motion";
import { X, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Recipe } from "@/data/recipes";

interface RecipeDetailProps {
  recipe: Recipe;
  onClose: () => void;
}

const RecipeDetail = ({ recipe, onClose }: RecipeDetailProps) => {
  return (
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
        className="bg-card rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
      >
        <div className="bg-primary/10 p-8 text-center">
          <span className="text-7xl block mb-3">{recipe.image}</span>
          <h2 className="font-heading text-3xl">{recipe.title}</h2>
          <p className="text-muted-foreground mt-1">{recipe.cuisine}</p>
        </div>
        <div className="p-6">
          <div className="flex gap-4 mb-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              {recipe.time}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              {recipe.servings} servings
            </div>
          </div>

          <h3 className="font-heading text-lg mb-2">Ingredients</h3>
          <div className="flex flex-wrap gap-2 mb-5">
            {recipe.ingredients.map((ing) => (
              <span key={ing} className="px-3 py-1 rounded-full bg-muted text-sm">
                {ing}
              </span>
            ))}
          </div>

          <h3 className="font-heading text-lg mb-2">Instructions</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{recipe.instructions}</p>

          <Button variant="outline" className="w-full mt-6" onClick={onClose}>
            Close
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default RecipeDetail;
