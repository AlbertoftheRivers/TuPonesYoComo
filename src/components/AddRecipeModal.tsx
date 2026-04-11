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
import type { RecipeInsertPayload, Cuisine } from "@/types/recipe";
import { toast } from "sonner";
import { useWebLanguage } from "@/lib/WebLanguageContext";

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
  const { t } = useWebLanguage();
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
      toast.error(t("toastEnterProteinName"));
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
      toast.success(t("toastProteinAdded"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toastProteinAddFail"));
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
      toast.success(t("toastTextExtracted"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toastOcrFail"));
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const handleDictate = async () => {
    if (!isWebAudioRecordingAvailable()) {
      toast.error(t("toastMicUnavailable"));
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
            toast.success(t("toastTranscriptionAdded"));
          } catch (err) {
            toast.error(err instanceof Error ? err.message : t("toastTranscriptionFailed"));
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
      toast.error(t("toastRecordingUnsupported"));
      return;
    }
    recorderRef.current = rec;
    await rec.start();
    setRecording(true);
    toast.info(t("toastRecordingInfo"));
  };

  const handleAnalyze = async () => {
    if (!rawText.trim()) {
      toast.error(t("toastAddTextFirst"));
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
      toast.success(t("toastRecipeAnalyzed"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toastAnalysisFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error(t("toastNameRequired"));
      return;
    }
    const stepsList = steps.length > 0 ? steps : stepsText.split("\n").map((s) => s.trim()).filter(Boolean);
    if (mainProtein === ADD_NEW_PROTEIN_VALUE) {
      toast.error(t("toastChooseProteinFirst"));
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
      toast.success(t("toastRecipeSaved"));
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
      toast.error(err instanceof Error ? err.message : t("toastSaveFailed"));
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
              <h2 className="font-heading text-2xl">{t("addRecipeTitle")}</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">{t("addRecipeRawLabel")}</label>
                <div className="flex gap-2 mb-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleScanImage}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={loading}>
                    <Camera className="w-4 h-4 mr-1" /> {t("scan")}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={handleDictate} disabled={loading}>
                    <Mic className="w-4 h-4 mr-1" /> {recording ? t("stop") : t("dictate")}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={handleAnalyze} disabled={loading || !rawText.trim()}>
                    <Sparkles className="w-4 h-4 mr-1" /> {t("analyzeAI")}
                  </Button>
                </div>
                <Textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={t("rawPlaceholder")}
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">{t("recipeName")}</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("recipeNamePh")} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">{t("mainProtein")}</label>
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
                    <option value={ADD_NEW_PROTEIN_VALUE}>{t("addNewProteinOption")}</option>
                  </select>
                  {showAddProtein && (
                    <div className="mt-3 p-3 rounded-lg border border-border bg-muted/50 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">{t("newCategory")}</p>
                      <Input
                        value={newProteinLabel}
                        onChange={(e) => setNewProteinLabel(e.target.value)}
                        placeholder={t("newCategoryPh")}
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
                        <span className="text-xs text-muted-foreground">{t("iconEmoji")}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" size="sm" onClick={handleAddNewProtein} disabled={loading || !newProteinLabel.trim()}>
                          {t("add")}
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => { setShowAddProtein(false); setNewProteinLabel(""); setNewProteinIcon("🍽️"); }}>
                          {t("cancel")}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">{t("cuisine")}</label>
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
                  <label className="text-sm font-medium mb-1 block">{t("totalTimeMin")}</label>
                  <Input
                    type="number"
                    value={totalTime ?? ""}
                    onChange={(e) => setTotalTime(e.target.value ? Number(e.target.value) : null)}
                    placeholder="—"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">{t("servings")}</label>
                  <Input type="number" value={servings} onChange={(e) => setServings(Number(e.target.value) || 2)} min={1} />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">{t("ingredients")}</label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={ingredientInput}
                    onChange={(e) => setIngredientInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addIngredient())}
                    placeholder={t("addIngredientPh")}
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
                <label className="text-sm font-medium mb-1 block">{t("steps")}</label>
                <Textarea
                  value={stepsText}
                  onChange={(e) => setStepsText(e.target.value)}
                  placeholder={t("stepsPh")}
                  rows={4}
                />
              </div>

              <Button className="w-full" onClick={handleSubmit} disabled={loading}>
                {loading ? t("saving") : t("saveRecipe")}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddRecipeModal;
