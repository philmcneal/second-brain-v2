"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { useMemoriesStore } from "@/app/stores/memories";

export default function NewMemoryPage(): React.JSX.Element {
  const router = useRouter();
  const addMemory = useMemoriesStore((state) => state.addMemory);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    const id = addMemory({
      title,
      content,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });

    router.push(`/memories/${id}`);
  };

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Create Memory</CardTitle>
        <CardDescription>Write a new memory and tag it for retrieval.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label htmlFor="memory-title" className="text-sm font-medium text-zinc-200">
              Title
            </label>
            <Input id="memory-title" required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Memory title" />
          </div>
          <div className="space-y-2">
            <label htmlFor="memory-content" className="text-sm font-medium text-zinc-200">
              Content
            </label>
            <textarea
              id="memory-content"
              required
              value={content}
              onChange={(event) => setContent(event.target.value)}
              className="min-h-52 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
              placeholder="What do you want to remember?"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="memory-tags" className="text-sm font-medium text-zinc-200">
              Tags
            </label>
            <Input id="memory-tags" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Tags (comma separated)" />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Save Memory</Button>
            <Button type="button" variant="secondary" onClick={() => router.push("/memories")}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
