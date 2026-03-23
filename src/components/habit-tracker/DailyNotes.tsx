import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Trash2, Edit3, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface DailyNotesProps {
  userId: string;
  selectedDate: string;
  onDateChange: (date: string) => void;
}

interface NoteData {
  id: string;
  note_text: string;
  updated_at: string;
}

function formatDisplayDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function DailyNotes({ userId, selectedDate, onDateChange }: DailyNotesProps) {
  const [note, setNote] = useState<NoteData | null>(null);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];
  const isToday = selectedDate === today;

  const fetchNote = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("daily_notes")
      .select("id, note_text, updated_at")
      .eq("user_id", userId)
      .eq("note_date", selectedDate)
      .maybeSingle();
    setNote(data);
    setDraft(data?.note_text ?? "");
    setEditing(false);
    setLoading(false);
  }, [userId, selectedDate]);

  useEffect(() => { fetchNote(); }, [fetchNote]);

  const handleSave = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      if (note) {
        await supabase
          .from("daily_notes")
          .update({ note_text: draft.trim(), updated_at: new Date().toISOString() })
          .eq("id", note.id);
      } else {
        await supabase
          .from("daily_notes")
          .insert({ user_id: userId, note_date: selectedDate, note_text: draft.trim() });
      }
      await fetchNote();
      toast({ title: "Note saved", description: `Note for ${formatDisplayDate(selectedDate)} saved.` });
    } catch {
      toast({ title: "Error", description: "Failed to save note.", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!note) return;
    await supabase.from("daily_notes").delete().eq("id", note.id);
    setNote(null);
    setDraft("");
    setEditing(false);
    toast({ title: "Note deleted" });
  };

  const shiftDate = (days: number) => {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() + days);
    const newDate = d.toISOString().split("T")[0];
    if (newDate <= today) onDateChange(newDate);
  };

  const hasChanges = draft.trim() !== (note?.note_text ?? "");
  const showEditor = !note || editing;

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4">
      {/* Header with date nav */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Daily Notes</h2>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => shiftDate(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs font-medium text-muted-foreground min-w-[100px] text-center">
            {isToday ? "Today" : formatDisplayDate(selectedDate)}
          </span>
          <Button
            variant="ghost" size="icon" className="h-7 w-7"
            onClick={() => shiftDate(1)}
            disabled={isToday}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-2">
            <div className="h-20 bg-muted/40 rounded-lg animate-pulse" />
          </motion.div>
        ) : showEditor ? (
          <motion.div key="editor" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="space-y-3">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={isToday
                ? "What's your plan for today? What will you focus on?"
                : `Notes for ${formatDisplayDate(selectedDate)}...`}
              className="min-h-[100px] bg-secondary/30 border-border/30 resize-none text-sm"
            />
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving || !draft.trim()} size="sm" className="gap-1.5">
                <Save className="w-3.5 h-3.5" />
                {saving ? "Saving..." : "Save Note"}
              </Button>
              {note && (
                <Button variant="ghost" size="sm" onClick={() => { setDraft(note.note_text); setEditing(false); }}>
                  Cancel
                </Button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div key="view" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="space-y-3">
            <div className="bg-secondary/20 rounded-lg p-4 text-sm whitespace-pre-wrap leading-relaxed">
              {note?.note_text}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditing(true)}>
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </Button>
              <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={handleDelete}>
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
