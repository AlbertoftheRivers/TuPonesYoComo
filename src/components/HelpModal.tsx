import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  bodyParagraphs: string[];
  closeLabel: string;
}

const HelpModal = ({ isOpen, onClose, title, bodyParagraphs, closeLabel }: HelpModalProps) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-foreground/40 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-modal-title"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 border border-border"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 id="help-modal-title" className="font-heading text-2xl">
              {title}
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label={title}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            {bodyParagraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-6" onClick={onClose}>
            {closeLabel}
          </Button>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default HelpModal;
