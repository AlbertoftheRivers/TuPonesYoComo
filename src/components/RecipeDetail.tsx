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
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-foreground/40 px-4 py-6 backdrop-blur-sm sm:px-5 sm:py-10"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative my-auto flex w-full max-w-lg max-h-[min(calc(100dvh-3rem),calc(100vh-3rem))] sm:max-h-[min(calc(100dvh-5rem),calc(100vh-5rem))] flex-col overflow-hidden rounded-2xl bg-card shadow-2xl"
      >
        {/* Toolbar: always visible */}
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-card px-3 py-2">
          <button
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-stone-300 bg-white text-red-600 shadow-md transition-colors hover:border-red-400 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            aria-label={t("ariaDeleteRecipe")}
            onClick={(e) => {
              e.stopPropagation();
              setDeleteConfirmOpen(true);
            }}
          >
            <Trash2 className="h-5 w-5" strokeWidth={2.5} aria-hidden />
          </button>
          <button
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-stone-300 bg-white text-orange-600 shadow-md transition-colors hover:border-orange-400 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
            aria-label={t("ariaEditRecipe")}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(recipe);
            }}
          >
            <Pencil className="h-5 w-5" strokeWidth={2.5} aria-hidden />
          </button>
        </div>

        {/* Recipe body: scrolls independently */}
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain">
          <div className="bg-primary/10 px-6 pb-6 pt-5 text-center">
            <span className="mb-3 block text-7xl">{recipe.image}</span>
            <h2 className="px-2 font-heading text-3xl">{recipe.title}</h2>
            <p className="mt-1 text-muted-foreground">{recipe.cuisine}</p>
          </div>
          <div className="p-6">
            <div className="mb-5 flex gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {recipe.time}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                {t("servingsCount", { n: recipe.servings })}
              </div>
            </div>

            <h3 className="mb-2 font-heading text-lg">{t("recipeDetailIngredients")}</h3>
            <div className="mb-5 flex flex-wrap gap-2">
              {recipe.ingredients.map((ing) => (
                <span key={ing} className="rounded-full bg-muted px-3 py-1 text-sm">
                  {ing}
                </span>
              ))}
            </div>

            <h3 className="mb-2 font-heading text-lg">{t("recipeDetailInstructions")}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap pb-1">
              {recipe.instructions}
            </p>
          </div>
        </div>

        {/* Close: always visible */}
        <div className="shrink-0 border-t border-border bg-card p-4">
          <Button variant="outline" className="w-full" onClick={onClose}>
            {t("close")}
          </Button>
        </div>

        <AnimatePresence>
          {deleteConfirmOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center bg-background/95 p-6 backdrop-blur-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-sm space-y-4 rounded-xl border border-border bg-card p-6 text-center shadow-xl"
              >
                <p className="font-heading text-lg">{t("deleteRecipeTitle")}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t("deleteRecipeMessage", { title: recipe.title })}
                </p>
                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    className="min-w-[120px] w-full sm:w-auto"
                    disabled={deleting}
                    onClick={() => setDeleteConfirmOpen(false)}
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="min-w-[120px] w-full sm:w-auto"
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
