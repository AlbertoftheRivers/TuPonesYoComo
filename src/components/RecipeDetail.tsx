import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Users, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RecipeDisplay } from "@/data/recipeDisplay";
import { useWebLanguage } from "@/lib/WebLanguageContext";
import { deleteRecipe } from "@/api/recipes";
import { toast } from "sonner";

interface RecipeDetailProps {
  recipe: RecipeDisplay;
  onClose: () => void;
  onEdit: (recipe: RecipeDisplay) => void;
  /** After a successful delete (lists refresh). */
  onDeleted?: () => void;
}

const RecipeDetail = ({ recipe, onClose, onEdit, onDeleted }: RecipeDetailProps) => {
  const { t } = useWebLanguage();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteRecipe(recipe.id);
      toast.success(t("toastRecipeDeleted"));
      onDeleted?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toastRecipeDeleteFailed"));
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

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
        className="relative bg-card rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
      >
        <div className="absolute top-3 left-3 right-3 z-10 flex justify-between items-start pointer-events-none">
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="pointer-events-auto h-10 w-10 shrink-0 rounded-full border-border bg-card/95 text-destructive shadow-md backdrop-blur-sm hover:bg-destructive/15 hover:text-destructive hover:border-destructive/50"
            aria-label={t("ariaDeleteRecipe")}
            onClick={(e) => {
              e.stopPropagation();
              setDeleteConfirmOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4 shrink-0" strokeWidth={2.25} />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="pointer-events-auto h-10 w-10 shrink-0 rounded-full border-border bg-card/95 text-foreground shadow-md backdrop-blur-sm hover:bg-primary/15 hover:text-primary hover:border-primary/40"
            aria-label={t("ariaEditRecipe")}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(recipe);
            }}
          >
            <Pencil className="h-4 w-4 shrink-0" strokeWidth={2.25} />
          </Button>
        </div>

        <div className="bg-primary/10 px-6 pt-14 pb-8 text-center">
          <span className="text-7xl block mb-3">{recipe.image}</span>
          <h2 className="font-heading text-3xl px-2">{recipe.title}</h2>
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
              {t("servingsCount", { n: recipe.servings })}
            </div>
          </div>

          <h3 className="font-heading text-lg mb-2">{t("recipeDetailIngredients")}</h3>
          <div className="flex flex-wrap gap-2 mb-5">
            {recipe.ingredients.map((ing) => (
              <span key={ing} className="px-3 py-1 rounded-full bg-muted text-sm">
                {ing}
              </span>
            ))}
          </div>

          <h3 className="font-heading text-lg mb-2">{t("recipeDetailInstructions")}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
            {recipe.instructions}
          </p>

          <Button variant="outline" className="w-full mt-6" onClick={onClose}>
            {t("close")}
          </Button>
        </div>

        <AnimatePresence>
          {deleteConfirmOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center bg-background/95 backdrop-blur-sm p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl text-center space-y-4"
              >
                <p className="font-heading text-lg">{t("deleteRecipeTitle")}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("deleteRecipeMessage", { title: recipe.title })}
                </p>
                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-center pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto min-w-[120px]"
                    disabled={deleting}
                    onClick={() => setDeleteConfirmOpen(false)}
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full sm:w-auto min-w-[120px]"
                    disabled={deleting}
                    onClick={() => void handleConfirmDelete()}
                  >
                    {deleting ? t("deleteRecipeWorking") : t("deleteRecipeConfirm")}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default RecipeDetail;
