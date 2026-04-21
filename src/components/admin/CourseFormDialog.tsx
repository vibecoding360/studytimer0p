import { useEffect, useState } from "react";
import { z } from "zod";
import { Loader2, Upload, Link as LinkIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

export interface AdminCourse {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  price: number;
  duration: string | null;
  is_published: boolean;
}

const schema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(2000).optional(),
  image_url: z.string().trim().url("Must be a valid URL").max(500).optional().or(z.literal("")),
  price: z.number().min(0, "Price must be ≥ 0").max(1_000_000),
  duration: z.string().trim().max(100).optional(),
  is_published: z.boolean(),
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course?: AdminCourse | null;
  onSaved: () => void;
}

export default function CourseFormDialog({ open, onOpenChange, course, onSaved }: Props) {
  const { user } = useAuth();
  const editing = !!course;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [price, setPrice] = useState<string>("0");
  const [duration, setDuration] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [imageTab, setImageTab] = useState<"url" | "upload">("url");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(course?.title ?? "");
      setDescription(course?.description ?? "");
      setImageUrl(course?.image_url ?? "");
      setPrice(course?.price?.toString() ?? "0");
      setDuration(course?.duration ?? "");
      setIsPublished(course?.is_published ?? true);
      setFile(null);
      setImageTab("url");
    }
  }, [open, course]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    let finalImageUrl = imageUrl.trim();

    setBusy(true);
    try {
      // Upload file if user chose upload tab
      if (imageTab === "upload" && file) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("course-images")
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("course-images").getPublicUrl(path);
        finalImageUrl = pub.publicUrl;
      }

      const parsed = schema.safeParse({
        title,
        description: description || undefined,
        image_url: finalImageUrl || "",
        price: Number(price),
        duration: duration || undefined,
        is_published: isPublished,
      });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
        setBusy(false);
        return;
      }

      const payload = {
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        image_url: parsed.data.image_url || null,
        price: parsed.data.price,
        duration: parsed.data.duration ?? null,
        is_published: parsed.data.is_published,
      };

      if (editing && course) {
        const { error } = await supabase
          .from("admin_courses")
          .update(payload)
          .eq("id", course.id);
        if (error) throw error;
        toast.success("Course updated");
      } else {
        const { error } = await supabase
          .from("admin_courses")
          .insert({ ...payload, created_by: user.id });
        if (error) throw error;
        toast.success("Course created");
      }

      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save course");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {editing ? "Edit Course" : "Add New Course"}
          </DialogTitle>
          <DialogDescription>
            {editing ? "Update the course details below." : "Fill in the details to publish a new course."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={2000}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="price">Price ($) *</Label>
              <Input
                id="price"
                type="number"
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                placeholder="e.g. 6 weeks"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                maxLength={100}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cover Image</Label>
            <Tabs value={imageTab} onValueChange={(v) => setImageTab(v as "url" | "upload")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url"><LinkIcon className="w-3.5 h-3.5 mr-1.5" />URL</TabsTrigger>
                <TabsTrigger value="upload"><Upload className="w-3.5 h-3.5 mr-1.5" />Upload</TabsTrigger>
              </TabsList>
              <TabsContent value="url" className="mt-2">
                <Input
                  type="url"
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  maxLength={500}
                />
              </TabsContent>
              <TabsContent value="upload" className="mt-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                {file && <p className="text-xs text-muted-foreground mt-1">Selected: {file.name}</p>}
              </TabsContent>
            </Tabs>
            {imageUrl && imageTab === "url" && (
              <img
                src={imageUrl}
                alt="Preview"
                className="mt-2 h-24 w-full object-cover rounded-md border border-border"
                onError={(e) => ((e.currentTarget.style.display = "none"))}
              />
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div>
              <Label htmlFor="published" className="cursor-pointer">Published</Label>
              <p className="text-xs text-muted-foreground">Visible to public visitors</p>
            </div>
            <Switch id="published" checked={isPublished} onCheckedChange={setIsPublished} />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editing ? "Save Changes" : "Create Course"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
