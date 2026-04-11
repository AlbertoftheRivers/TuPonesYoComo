import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Refrigerator,
  Shuffle,
  BookOpen,
  Plus,
  Globe,
  HelpCircle,
  Settings,
  ChefHat,
  UtensilsCrossed,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FridgePanel from "@/components/FridgePanel";
import RecipeDetail from "@/components/RecipeDetail";
import AddRecipeModal from "@/components/AddRecipeModal";
import RecipeBookModal from "@/components/RecipeBookModal";
import HelpModal from "@/components/HelpModal";
import { recipeToDisplay, type RecipeDisplay } from "@/data/recipeDisplay";
import type { Recipe } from "@/types/recipe";
import { getAllRecipes, getRecentRecipes, getRandomRecipe } from "@/api/recipes";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWebLanguage } from "@/lib/WebLanguageContext";
import { WEB_LANGUAGE_OPTIONS, type SupportedWebLanguage } from "@/lib/webI18n";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&q=80";

const Index = () => {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useWebLanguage();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [fridgeOpen, setFridgeOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDisplay | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [bookOpen, setBookOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const { data: allRecipes = [], isLoading } = useQuery({
    queryKey: ["recipes"],
    queryFn: getAllRecipes,
  });

  const { data: recentRecipes = [] } = useQuery({
    queryKey: ["recentRecipes"],
    queryFn: () => getRecentRecipes(8),
  });

  const recipes: RecipeDisplay[] = useMemo(
    () => allRecipes.map(recipeToDisplay),
    [allRecipes]
  );

  const recentDisplay: RecipeDisplay[] = useMemo(
    () => recentRecipes.map(recipeToDisplay),
    [recentRecipes]
  );

  const filteredRecipes = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return recipes.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.cuisine.toLowerCase().includes(q) ||
        r.ingredients.some((i) => i.toLowerCase().includes(q))
    );
  }, [search, recipes]);

  const uniqueCuisines = useMemo(
    () => new Set(recipes.map((r) => r.cuisine)).size,
    [recipes]
  );

  const recommendRandom = useCallback(async () => {
    const random = await getRandomRecipe();
    if (random) setSelectedRecipe(recipeToDisplay(random));
  }, []);

  const handleRecipeFormClose = useCallback(() => {
    setAddOpen(false);
    setEditingRecipe(null);
  }, []);

  const handleRecipeFormSuccess = useCallback(
    (updated?: Recipe) => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["recentRecipes"] });
      setAddOpen(false);
      setEditingRecipe(null);
      if (updated) setSelectedRecipe(recipeToDisplay(updated));
    },
    [queryClient]
  );

  const openAddRecipeModal = useCallback(() => {
    setEditingRecipe(null);
    setAddOpen(true);
  }, []);

  const featureCards = useMemo(
    () => [
      {
        icon: Refrigerator,
        title: t("featFridgeTitle"),
        desc: t("featFridgeDesc"),
        color: "bg-secondary/15 text-secondary",
        action: () => setFridgeOpen(true),
      },
      {
        icon: Shuffle,
        title: t("featRandomTitle"),
        desc: t("featRandomDesc"),
        color: "bg-accent/20 text-accent-foreground",
        action: recommendRandom,
      },
      {
        icon: BookOpen,
        title: t("featBookTitle"),
        desc: t("featBookDesc"),
        color: "bg-primary/10 text-primary",
        action: () => setBookOpen(true),
      },
      {
        icon: Plus,
        title: t("featAddTitle"),
        desc: t("featAddDesc"),
        color: "bg-muted text-foreground",
        action: openAddRecipeModal,
      },
    ],
    [t, recommendRandom, openAddRecipeModal]
  );

  const helpParagraphs = useMemo(() => t("helpBody").split("\n\n").filter(Boolean), [t]);

  const pickLanguage = useCallback(
    (code: SupportedWebLanguage) => {
      setLanguage(code);
      setLangOpen(false);
    },
    [setLanguage]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">{t("loadingRecipes")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${HERO_IMAGE})` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/70 via-foreground/50 to-background" />
        <div className="relative z-10 px-4 sm:px-8 pt-6 pb-16">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-2">
              <ChefHat className="w-8 h-8 text-primary-foreground" />
              <span className="font-heading text-2xl text-primary-foreground">{t("appTitle")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative" ref={langRef}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-primary-foreground hover:bg-primary-foreground/10"
                  aria-expanded={langOpen}
                  aria-haspopup="listbox"
                  aria-label={t("ariaLanguage")}
                  onClick={() => setLangOpen((o) => !o)}
                >
                  <Globe className="w-5 h-5" />
                </Button>
                <AnimatePresence>
                  {langOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-52 rounded-xl border border-border bg-card shadow-xl py-1 z-50"
                      role="listbox"
                    >
                      {WEB_LANGUAGE_OPTIONS.map((opt) => (
                        <button
                          key={opt.code}
                          type="button"
                          role="option"
                          aria-selected={language === opt.code}
                          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm text-left hover:bg-muted transition-colors"
                          onClick={() => pickLanguage(opt.code)}
                        >
                          <span>{t(opt.labelKey)}</span>
                          {language === opt.code ? (
                            <Check className="w-4 h-4 shrink-0 text-primary" />
                          ) : null}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary-foreground/10"
                aria-label={t("ariaHelp")}
                onClick={() => setHelpOpen(true)}
              >
                <HelpCircle className="w-5 h-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary-foreground/10"
                aria-label={t("ariaSettings")}
                onClick={() => navigate("/admin")}
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto text-center mb-8"
          >
            <h1 className="text-4xl sm:text-5xl font-heading text-primary-foreground mb-3">{t("heroTitle")}</h1>
            <p className="text-primary-foreground/70 text-lg">{t("heroSubtitle")}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="max-w-3xl mx-auto"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="pl-12 h-12 rounded-xl bg-card/95 backdrop-blur border-none shadow-lg text-base"
                />
              </div>
              <div className="hidden sm:flex items-center gap-3">
                <div className="flex items-center gap-2 bg-card/90 backdrop-blur rounded-xl px-4 py-2.5 shadow-lg">
                  <UtensilsCrossed className="w-4 h-4 text-primary" />
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground leading-none">{t("statRecipes")}</p>
                    <p className="font-bold text-sm">{recipes.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-card/90 backdrop-blur rounded-xl px-4 py-2.5 shadow-lg">
                  <Globe className="w-4 h-4 text-secondary" />
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground leading-none">{t("statCuisines")}</p>
                    <p className="font-bold text-sm">{uniqueCuisines}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      <AnimatePresence>
        {search.trim() && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-3xl mx-auto px-4 -mt-4 mb-4 relative z-20"
          >
            <div className="bg-card rounded-xl shadow-xl border border-border p-3 max-h-72 overflow-y-auto">
              {filteredRecipes.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">
                  {t("noRecipesFound", { query: search.trim() })}
                </p>
              ) : (
                filteredRecipes.map((recipe) => (
                  <button
                    key={recipe.id}
                    onClick={() => {
                      setSelectedRecipe(recipe);
                      setSearch("");
                    }}
                    className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors flex items-center gap-3"
                  >
                    <span className="text-2xl">{recipe.image}</span>
                    <div>
                      <p className="font-medium">{recipe.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {recipe.cuisine} · {recipe.time}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="sm:hidden flex justify-center gap-4 px-4 -mt-6 mb-6 relative z-10">
        <div className="flex items-center gap-2 bg-card rounded-xl px-4 py-2.5 shadow-lg border border-border">
          <UtensilsCrossed className="w-4 h-4 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground leading-none">{t("statRecipes")}</p>
            <p className="font-bold text-sm">{recipes.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-card rounded-xl px-4 py-2.5 shadow-lg border border-border">
          <Globe className="w-4 h-4 text-secondary" />
          <div>
            <p className="text-xs text-muted-foreground leading-none">{t("statCuisines")}</p>
            <p className="font-bold text-sm">{uniqueCuisines}</p>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {featureCards.map((card, i) => (
            <motion.button
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.08 }}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={card.action}
              className="p-5 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow text-center group"
            >
              <div
                className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}
              >
                <card.icon className="w-6 h-6" />
              </div>
              <p className="font-medium text-sm">{card.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.desc}</p>
            </motion.button>
          ))}
        </motion.div>
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12"
        >
          <h2 className="font-heading text-2xl mb-5">{t("recentRecipes")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(recentDisplay.length ? recentDisplay : recipes.slice(0, 6)).map((recipe, i) => (
              <motion.button
                key={recipe.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 + i * 0.05 }}
                whileHover={{ y: -3 }}
                onClick={() => setSelectedRecipe(recipe)}
                className="text-left p-4 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl group-hover:scale-110 transition-transform inline-block">{recipe.image}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{recipe.title}</p>
                    <p className="text-sm text-muted-foreground">{recipe.cuisine}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>⏱ {recipe.time}</span>
                      <span>👤 {recipe.servings}</span>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.section>
      </main>

      <FridgePanel
        isOpen={fridgeOpen}
        onClose={() => setFridgeOpen(false)}
        onSelectRecipe={(r) => {
          setSelectedRecipe(r);
          setFridgeOpen(false);
        }}
      />
      <AnimatePresence>
        {selectedRecipe && (
          <RecipeDetail
            recipe={selectedRecipe}
            onClose={() => setSelectedRecipe(null)}
            onEdit={(r) => {
              setEditingRecipe(r._recipe);
              setSelectedRecipe(null);
            }}
            onDeleted={() => {
              void queryClient.invalidateQueries({ queryKey: ["recipes"] });
              void queryClient.invalidateQueries({ queryKey: ["recentRecipes"] });
            }}
          />
        )}
      </AnimatePresence>
      <AddRecipeModal
        isOpen={addOpen || !!editingRecipe}
        onClose={handleRecipeFormClose}
        onSuccess={handleRecipeFormSuccess}
        editingRecipe={editingRecipe}
      />
      <RecipeBookModal
        isOpen={bookOpen}
        onClose={() => setBookOpen(false)}
        recipes={recipes}
        onSelectRecipe={(r) => {
          setSelectedRecipe(r);
          setBookOpen(false);
        }}
      />
      <HelpModal
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
        title={t("helpTitle")}
        bodyParagraphs={helpParagraphs}
        closeLabel={t("close")}
      />
    </div>
  );
};

export default Index;
