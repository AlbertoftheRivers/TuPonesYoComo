import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Camera, Mic, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CUISINES, CATEGORIES } from "@/data/recipes";
import type { Recipe } from "@/types/recipe";
import {
  createRecipe,
  extractTextFromImage,
  transcribeAudio,
  analyzeRecipe,
} from "@/api/recipes";

interface AddRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (recipe: Recipe) => void;
  initialRawText?: string;
}

const AddRecipeModal = ({
  isOpen,
  onClose,
  onAdd,
  initialRawText,
}: AddRecipeModalProps) => {
  const [title, setTitle] = useState("");
  const [cuisine, setCuisine] = useState(CUISINES[0]);
  const [category, setCategory] = useState(CATEGORIES[0]?.value ?? "vegetables");
  const [ingredientInput, setIngredientInput] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [instructions, setInstructions] = useState("");
  const [time, setTime] = useState("");
  const [servings, setServings] = useState(2);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [micRecording, setMicRecording] = useState(false);
  const [transcribeLoading, setTranscribeLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const ocrInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && initialRawText) {
      setInstructions(initialRawText);
    }
  }, [isOpen, initialRawText]);

  const resetForm = () => {
    setTitle("");
    setCuisine(CUISINES[0]);
    setCategory(CATEGORIES[0]?.value ?? "vegetables");
    setIngredients([]);
    setInstructions("");
    setTime("");
    setServings(2);
  };

  const addIngredient = () => {
    const trimmed = ingredientInput.trim();
    if (trimmed && !ingredients.includes(trimmed)) {
      setIngredients([...ingredients, trimmed]);
      setIngredientInput("");
    }
  };

  const handleOcr = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setOcrLoading(true);
    try {
      const text = await extractTextFromImage(file);
      setInstructions((prev) => (prev ? prev + "\n\n" + text : text));
    } catch (err) {
      alert(err instanceof Error ? err.message : "OCR failed");
    } finally {
      setOcrLoading(false);
    }
  };

  const startRecording = () => {
    chunksRef.current = [];
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (ev) => {
        if (ev.data.size) chunksRef.current.push(ev.data);
      };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setTranscribeLoading(true);
        try {
          const text = await transcribeAudio(
            new File([blob], "recording.webm", { type: "audio/webm" })
          );
          setInstructions((prev) => (prev ? prev + "\n\n" + text : text));
        } catch (err) {
          alert(err instanceof Error ? err.message : "Transcription failed");
        } finally {
          setTranscribeLoading(false);
        }
      };
      mr.start();
      setMicRecording(true);
    }).catch(() => alert("Microphone access denied"));
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && micRecording) {
      mediaRecorderRef.current.stop();
      setMicRecording(false);
    }
  };

  const parseTimeMinutes = (t: string): number | null => {
    const n = parseInt(t.replace(/\D/g, ""), 10);
    return isNaN(n) ? null : n;
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSubmitLoading(true);
    try {
      const rawText = instructions || title;
      const totalMinutes = parseTimeMinutes(time);
      const payload = {
        title: title.trim(),
        main_protein: category,
        cuisines: [cuisine],
        raw_text: rawText,
        ingredients: ingredients.map((name) => ({ name })),
        steps: instructions
          ? instructions.split(/\n+/).map((s) => s.trim()).filter(Boolean)
          : [instructions],
        gadgets: [] as string[],
        total_time_minutes: totalMinutes,
        oven_time_minutes: null as number | null,
        servings: Math.max(1, servings),
        added_by: null as string | null,
      };
      const created = await createRecipe(payload);
      onAdd(created);
      resetForm();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add recipe");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleAnalyzeWithAI = async () => {
    if (!instructions.trim()) return;
    setAnalyzeLoading(true);
    try {
      const result = await analyzeRecipe(instructions, category);
      setIngredients(result.ingredients.map((i) => i.name));
      setInstructions(result.steps.join("\n\n"));
      if (result.total_time_minutes != null)
        setTime(`${result.total_time_minutes} min`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzeLoading(false);
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
            className="bg-card rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-2xl">Add New Recipe</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Recipe Name</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="My Amazing Recipe"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Cuisine</label>
                  <select
                    value={cuisine}
                    onChange={(e) => setCuisine(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    {CUISINES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.emoji} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Time</label>
                  <Input
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="30 min"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Servings</label>
                  <Input
                    type="number"
                    value={servings}
                    onChange={(e) => setServings(Number(e.target.value))}
                    min={1}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Instructions / recipe text
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    ref={ocrInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleOcr}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => ocrInputRef.current?.click()}
                    disabled={ocrLoading}
                  >
                    {ocrLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={micRecording ? stopRecording : startRecording}
                    disabled={transcribeLoading}
                  >
                    {transcribeLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : micRecording ? (
                      <span className="w-4 h-4 rounded-full bg-red-500 animate-pulse" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </Button>
                  {instructions.trim() && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAnalyzeWithAI}
                      disabled={analyzeLoading}
                    >
                      {analyzeLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      ) : (
                        <FileText className="w-4 h-4 mr-1" />
                      )}
                      Parse with AI
                    </Button>
                  )}
                </div>
                <Textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Paste or type recipe, or use 📷 OCR / 🎤 dictation..."
                  rows={4}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Ingredients</label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={ingredientInput}
                    onChange={(e) => setIngredientInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addIngredient())
                    }
                    placeholder="Add ingredient..."
                  />
                  <Button variant="outline" size="icon" onClick={addIngredient}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ingredients.map((ing) => (
                    <span
                      key={ing}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs"
                    >
                      {ing}
                      <button
                        onClick={() =>
                          setIngredients(ingredients.filter((i) => i !== ing))
                        }
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={submitLoading}
              >
                {submitLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Add Recipe
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddRecipeModal;
