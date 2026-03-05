import { useState, useMemo, useEffect } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Recipe } from "@/data/recipes";
import { getAllRecipes } from "@/api/recipes";
import FridgePanel from "@/components/FridgePanel";
import RecipeDetail from "@/components/RecipeDetail";
import AddRecipeModal from "@/components/AddRecipeModal";
import RecipeBookModal from "@/components/RecipeBookModal";
import heroImage from "@/assets/hero-food.jpg";

const Index = () => {
  const [search, setSearch] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fridgeOpen, setFridgeOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addInitialRawText, setAddInitialRawText] = useState<string | undefined>(undefined);
  const [bookOpen, setBookOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAllRecipes()
      .then((data) => {
        if (!cancelled) setRecipes(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || "Failed to load recipes");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

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

  const recommendRandom = () => {
    if (recipes.length === 0) return;
    const random = recipes[Math.floor(Math.random() * recipes.length)];
    setSelectedRecipe(random);
  };

  const handleAddRecipe = (newRecipe: Recipe) => {
    setRecipes((prev) => [...prev, newRecipe]);
  };

  const handleOpenAddWithSuggestion = (suggestion: string) => {
    setAddInitialRawText(suggestion);
    setFridgeOpen(false);
    setAddOpen(true);
  };

  const featureCards = [
    {
      icon: Refrigerator,
      title: "My Fridge",
      desc: "Add your ingredients & find recipes",
      color: "bg-secondary/15 text-secondary",
      action: () => setFridgeOpen(true),
    },
    {
      icon: Shuffle,
      title: "Recommend Me",
      desc: "Get a random recipe suggestion",
      color: "bg-accent/20 text-accent-foreground",
      action: recommendRandom,
    },
    {
      icon: BookOpen,
      title: "Recipe Book",
      desc: "Browse by category",
      color: "bg-primary/10 text-primary",
      action: () => setBookOpen(true),
    },
    {
      icon: Plus,
      title: "Add Recipe",
      desc: "Create your own recipe",
      color: "bg-muted text-foreground",
      action: () => setAddOpen(true),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/70 via-foreground/50 to-background" />

        <div className="relative z-10 px-4 sm:px-8 pt-6 pb-16">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-2">
              <ChefHat className="w-8 h-8 text-primary-foreground" />
              <span className="font-heading text-2xl text-primary-foreground">
                FlavorVault
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Globe className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                <HelpCircle className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Hero text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto text-center mb-8"
          >
            <h1 className="text-4xl sm:text-5xl font-heading text-primary-foreground mb-3">
              What are we cooking today?
            </h1>
            <p className="text-primary-foreground/70 text-lg">
              Discover, save & create recipes from around the world
            </p>
          </motion.div>

          {/* Search bar + counters */}
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
                  placeholder="Search recipes, ingredients, cuisines..."
                  className="pl-12 h-12 rounded-xl bg-card/95 backdrop-blur border-none shadow-lg text-base"
                />
              </div>
              <div className="hidden sm:flex items-center gap-3">
                <div className="flex items-center gap-2 bg-card/90 backdrop-blur rounded-xl px-4 py-2.5 shadow-lg">
                  <UtensilsCrossed className="w-4 h-4 text-primary" />
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground leading-none">Recipes</p>
                    <p className="font-bold text-sm">{recipes.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-card/90 backdrop-blur rounded-xl px-4 py-2.5 shadow-lg">
                  <Globe className="w-4 h-4 text-secondary" />
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground leading-none">Cuisines</p>
                    <p className="font-bold text-sm">{uniqueCuisines}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Search results dropdown */}
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
                  No recipes found for "{search}"
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

      {/* Mobile counters */}
      <div className="sm:hidden flex justify-center gap-4 px-4 -mt-6 mb-6 relative z-10">
        <div className="flex items-center gap-2 bg-card rounded-xl px-4 py-2.5 shadow-lg border border-border">
          <UtensilsCrossed className="w-4 h-4 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground leading-none">Recipes</p>
            <p className="font-bold text-sm">{recipes.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-card rounded-xl px-4 py-2.5 shadow-lg border border-border">
          <Globe className="w-4 h-4 text-secondary" />
          <div>
            <p className="text-xs text-muted-foreground leading-none">Cuisines</p>
            <p className="font-bold text-sm">{uniqueCuisines}</p>
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
        {error && (
          <p className="text-destructive text-sm text-center py-4 mb-4 rounded-lg bg-destructive/10">
            {error}
          </p>
        )}
        {loading ? (
          <p className="text-muted-foreground text-center py-12">Loading recipes…</p>
        ) : (
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

        {/* Recent recipes */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12"
        >
          <h2 className="font-heading text-2xl mb-5">Recent Recipes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipes.slice(0, 6).map((recipe, i) => (
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
                  <span className="text-3xl group-hover:scale-110 transition-transform inline-block">
                    {recipe.image}
                  </span>
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
        )}
      </main>

      {/* Panels & Modals */}
      <FridgePanel
        isOpen={fridgeOpen}
        onClose={() => setFridgeOpen(false)}
        onSelectRecipe={(r) => {
          setSelectedRecipe(r);
          setFridgeOpen(false);
        }}
        onSuggestAndAdd={handleOpenAddWithSuggestion}
      />

      <AnimatePresence>
        {selectedRecipe && (
          <RecipeDetail
            recipe={selectedRecipe}
            onClose={() => setSelectedRecipe(null)}
          />
        )}
      </AnimatePresence>

      <AddRecipeModal
        isOpen={addOpen}
        onClose={() => {
          setAddOpen(false);
          setAddInitialRawText(undefined);
        }}
        onAdd={handleAddRecipe}
        initialRawText={addInitialRawText}
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
    </div>
  );
};

export default Index;
