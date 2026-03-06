import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Camera, Mic, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MAIN_PROTEINS, CUISINES } from "@/lib/constants";
import { createRecipe } from "@/api/recipes";
import { getCustomProteins, addCustomProtein, type CustomProtein } from "@/api/categories";
import { extractTextFromImage } from "@/lib/ocr";
import { createWebAudioRecorder, transcribeWebAudio, isWebAudioRecordingAvailable } from "@/lib/webAudioRecorder";
import { analyzeRecipe } from "@/lib/ollama";
import type { RecipeInsertPayload, MainProtein, Cuisine } from "@/types/recipe";
import { toast } from "sonner";

const ADD_NEW_PROTEIN_VALUE = "__add_new_protein__";

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_áéíóúñ]/g, "");
}

interface AddRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: () => void;
}

const AddRecipeModal = ({ isOpen, onClose, onAdd }: AddRecipeModalProps) => {
  const [rawText, setRawText] = useState("");
  const [title, setTitle] = useState("");
  const [mainProtein, setMainProtein] = useState<string>("chicken");
  const [customProteins, setCustomProteins] = useState<CustomProtein[]>([]);
  const [showAddProtein, setShowAddProtein] = useState(false);
  const [newProteinLabel, setNewProteinLabel] = useState("");
  const [newProteinIcon, setNewProteinIcon] = useState("🍽️");
  const [cuisineValue, setCuisineValue] = useState(CUISINES[0]?.value ?? "española");
  const [ingredients, setIngredients] = useState<Array<{ name: string; quantity?: number | string; unit?: string; notes?: string }>>([]);
  const [ingredientInput, setIngredientInput] = useState("");
  const [steps, setSteps] = useState<string[]>([]);
  const [stepsText, setStepsText] = useState("");
  const [totalTime, setTotalTime] = useState<number | null>(null);
  const [ovenTime, setOvenTime] = useState<number | null>(null);
  const [servings, setServings] = useState(2);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<ReturnType<typeof createWebAudioRecorder> | null>(null);

  useEffect(() => {
    if (isOpen) {
      getCustomProteins()
        .then(setCustomProteins)
        .catch(() => setCustomProteins([]));
    }
  }, [isOpen]);

  const allProteins = [
    ...MAIN_PROTEINS.map((p) => ({ value: p.value, label: p.label, icon: p.icon })),
    ...customProteins.map((p) => ({ value: p.value, label: p.label, icon: p.icon })),
  ];

  const handleAddNewProtein = async () => {
    const label = newProteinLabel.trim();
    if (!label) {
      toast.error("Enter a name for the protein");
      return;
    }
    const value = slugify(label) || "other";
    setLoading(true);
    try {
      await addCustomProtein({ value, label, icon: newProteinIcon || "🍽️" });
      const updated = await getCustomProteins();
      setCustomProteins(updated);
      setMainProtein(value);
      setShowAddProtein(false);
      setNewProteinLabel("");
      setNewProteinIcon("🍽️");
      toast.success(`"${label}" added to categories`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add category");
    } finally {
      setLoading(false);
    }
  };

  const addIngredient = () => {
    const trimmed = ingredientInput.trim();
    if (trimmed && !ingredients.some((i) => i.name === trimmed)) {
      setIngredients([...ingredients, { name: trimmed }]);
      setIngredientInput("");
    }
  };

  const handleScanImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      const dataUrl = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const result = await extractTextFromImage(dataUrl, "spa");
      setRawText((prev) => (prev ? prev + "\n\n" : "") + result.text);
      toast.success("Text extracted from image");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "OCR failed");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const handleDictate = async () => {
    if (!isWebAudioRecordingAvailable()) {
      toast.error("Microphone not available");
      return;
    }
    if (recording) {
      const rec = recorderRef.current;
      if (rec) {
        const blob = await rec.stop();
        if (blob) {
          setLoading(true);
          try {
            const { text } = await transcribeWebAudio(blob, "es");
            setRawText((prev) => (prev ? prev + "\n\n" : "") + text);
            toast.success("Transcription added");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Transcription failed");
          } finally {
            setLoading(false);
          }
        }
        setRecording(false);
      }
      return;
    }
    const rec = createWebAudioRecorder();
    if (!rec) {
      toast.error("Recording not supported");
      return;
    }
    recorderRef.current = rec;
    await rec.start();
    setRecording(true);
    toast.info("Recording… Click again to stop.");
  };

  const handleAnalyze = async () => {
    if (!rawText.trim()) {
      toast.error("Add or paste recipe text first (scan, dictate, or type)");
      return;
    }
    const proteinForAnalyze = mainProtein === ADD_NEW_PROTEIN_VALUE ? "vegetables" : mainProtein;
    setLoading(true);
    try {
      const result = await analyzeRecipe(rawText, proteinForAnalyze);
      setIngredients(result.ingredients.map((i) => ({ name: i.name ?? "", quantity: i.quantity, unit: i.unit, notes: i.notes })));
      setSteps(result.steps);
      setStepsText(result.steps.join("\n"));
      setTotalTime(result.total_time_minutes);
      setOvenTime(result.oven_time_minutes);
      if (!title && rawText.length < 200) {
        const firstLine = rawText.split("\n")[0]?.trim();
        if (firstLine) setTitle(firstLine);
      }
      toast.success("Recipe analyzed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Recipe name is required");
      return;
    }
    const stepsList = steps.length > 0 ? steps : stepsText.split("\n").map((s) => s.trim()).filter(Boolean);
    if (mainProtein === ADD_NEW_PROTEIN_VALUE) {
      toast.error("Add your new protein category first, or choose an existing one.");
      return;
    }
    const payload: RecipeInsertPayload = {
      title: title.trim(),
      main_protein: mainProtein,
      cuisines: cuisineValue ? [cuisineValue as Cuisine] : [],
      raw_text: rawText,
      ingredients,
      steps: stepsList,
      gadgets: [],
      total_time_minutes: totalTime,
      oven_time_minutes: ovenTime,
      servings,
    };
    setLoading(true);
    try {
      await createRecipe(payload);
      toast.success("Recipe saved");
      setRawText("");
      setTitle("");
      setIngredients([]);
      setSteps([]);
      setStepsText("");
      setTotalTime(null);
      setOvenTime(null);
      setServings(2);
      onAdd();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save recipe");
    } finally {
      setLoading(false);
    }
  };

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
            className="bg-card rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-2xl">Add New Recipe</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Recipe text (paste, scan, or dictate)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleScanImage}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={loading}>
                    <Camera className="w-4 h-4 mr-1" /> Scan
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={handleDictate} disabled={loading}>
                    <Mic className="w-4 h-4 mr-1" /> {recording ? "Stop" : "Dictate"}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={handleAnalyze} disabled={loading || !rawText.trim()}>
                    <Sparkles className="w-4 h-4 mr-1" /> Analyze with AI
                  </Button>
                </div>
                <Textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste recipe text, or use Scan / Dictate..."
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Recipe name</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My recipe" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Main protein</label>
                  <select
                    value={mainProtein}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === ADD_NEW_PROTEIN_VALUE) {
                        setMainProtein(ADD_NEW_PROTEIN_VALUE);
                        setShowAddProtein(true);
                      } else {
                        setMainProtein(v);
                        setShowAddProtein(false);
                      }
                    }}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    {allProteins.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.icon} {p.label}
                      </option>
                    ))}
                    <option value={ADD_NEW_PROTEIN_VALUE}>➕ Add new protein…</option>
                  </select>
                  {showAddProtein && (
                    <div className="mt-3 p-3 rounded-lg border border-border bg-muted/50 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">New category</p>
                      <Input
                        value={newProteinLabel}
                        onChange={(e) => setNewProteinLabel(e.target.value)}
                        placeholder="e.g. Tofu, Duck"
                        className="text-sm"
                      />
                      <div className="flex items-center gap-2">
                        <Input
                          value={newProteinIcon}
                          onChange={(e) => setNewProteinIcon(e.target.value)}
                          placeholder="🍽️"
                          className="w-16 text-center text-lg"
                          maxLength={4}
                        />
                        <span className="text-xs text-muted-foreground">Icon (emoji)</span>
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" size="sm" onClick={handleAddNewProtein} disabled={loading || !newProteinLabel.trim()}>
                          Add
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => { setShowAddProtein(false); setNewProteinLabel(""); setNewProteinIcon("🍽️"); }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Cuisine</label>
                  <select
                    value={cuisineValue}
                    onChange={(e) => setCuisineValue(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    {CUISINES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Total time (min)</label>
                  <Input
                    type="number"
                    value={totalTime ?? ""}
                    onChange={(e) => setTotalTime(e.target.value ? Number(e.target.value) : null)}
                    placeholder="—"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Servings</label>
                  <Input type="number" value={servings} onChange={(e) => setServings(Number(e.target.value) || 2)} min={1} />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Ingredients</label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={ingredientInput}
                    onChange={(e) => setIngredientInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addIngredient())}
                    placeholder="Add ingredient..."
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addIngredient}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ingredients.map((ing) => (
                    <span key={ing.name} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                      {ing.name}
                      <button type="button" onClick={() => setIngredients(ingredients.filter((i) => i.name !== ing.name))}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Steps</label>
                <Textarea
                  value={stepsText}
                  onChange={(e) => setStepsText(e.target.value)}
                  placeholder="One step per line..."
                  rows={4}
                />
              </div>

              <Button className="w-full" onClick={handleSubmit} disabled={loading}>
                {loading ? "Saving…" : "Add Recipe"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddRecipeModal;
