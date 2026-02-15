"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { FormField } from "@/app/components/ui/form-field";
import { useMemoriesStore } from "@/app/stores/memories";
import { toast } from "@/app/stores/toasts";

export default function NewMemoryPage(): React.JSX.Element {
  const router = useRouter();
  const addMemory = useMemoriesStore((state) => state.addMemory);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    // Validation
    const newErrors: { title?: string; content?: string } = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    } else if (title.trim().length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    }

    if (!content.trim()) {
      newErrors.content = "Content is required";
    } else if (content.trim().length < 10) {
      newErrors.content = "Content must be at least 10 characters";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const id = addMemory({
        title: title.trim(),
        content: content.trim(),
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      });

      toast.success("Memory created", "Your memory has been saved");
      router.push(`/memories/${id}`);
    } catch {
      toast.error("Failed to create memory", "Please try again");
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Create Memory</CardTitle>
        <CardDescription>Write a new memory and tag it for retrieval.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <FormField
            label="Title"
            htmlFor="memory-title"
            required
            error={errors.title}
          >
            <Input
              id="memory-title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                if (errors.title) setErrors({ ...errors, title: undefined });
              }}
              placeholder="Give your memory a title"
            />
          </FormField>

          <FormField
            label="Content"
            htmlFor="memory-content"
            required
            error={errors.content}
            helperText="Write down what you want to remember"
          >
            <Textarea
              id="memory-content"
              value={content}
              onChange={(event) => {
                setContent(event.target.value);
                if (errors.content) setErrors({ ...errors, content: undefined });
              }}
              className="min-h-52"
              placeholder="What do you want to remember?"
            />
          </FormField>

          <FormField
            label="Tags"
            htmlFor="memory-tags"
            helperText="Comma separated tags for easier retrieval (e.g., idea, work, personal)"
          >
            <Input
              id="memory-tags"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="idea, work, personal"
            />
          </FormField>

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Memory"
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/memories")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
