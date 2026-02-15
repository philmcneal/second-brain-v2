"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { useMemoriesStore } from "@/app/stores/memories";

export default function MemoriesPage(): React.JSX.Element {
  const memories = useMemoriesStore((state) => state.memories);
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState("all");

  const allTags = useMemo(() => {
    return Array.from(new Set(memories.flatMap((memory) => memory.tags))).sort();
  }, [memories]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return memories.filter((memory) => {
      const matchesQuery =
        normalized.length === 0 ||
        memory.title.toLowerCase().includes(normalized) ||
        memory.content.toLowerCase().includes(normalized);

      const matchesTag = tagFilter === "all" || memory.tags.includes(tagFilter);
      return matchesQuery && matchesTag;
    });
  }, [memories, query, tagFilter]);

  return (
    <div className="space-y-6">
      <div className="animate-fade-in flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Memories</h1>
          <p className="text-sm text-zinc-400">Capture ideas, reflections, and insights.</p>
        </div>
        <Link href="/memories/new">
          <Button>New Memory</Button>
        </Link>
      </div>

      <Card className="animate-fade-in-up">
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_220px]">
          <Input placeholder="Search title or content" value={query} onChange={(event) => setQuery(event.target.value)} />
          <select
            className="h-10 rounded-lg border border-[var(--glass-border)] bg-[var(--glass)] px-3 text-sm text-zinc-100 backdrop-blur-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]/60 focus-visible:border-[var(--accent-purple)]/50"
            value={tagFilter}
            onChange={(event) => setTagFilter(event.target.value)}
          >
            <option value="all">All Tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <div className="stagger-children grid gap-4 md:grid-cols-2">
        {filtered.map((memory) => (
          <Link key={memory.id} href={`/memories/${memory.id}`}>
            <Card className="h-full animate-fade-in-up glass-card-hover transition-all duration-200 hover:-translate-y-0.5">
              <CardHeader>
                <CardTitle>{memory.title}</CardTitle>
                <CardDescription>{formatDistanceToNow(new Date(memory.updatedAt), { addSuffix: true })}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 text-sm text-zinc-300">{memory.content}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {memory.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      {memories.length === 0 ? <p className="text-sm text-zinc-500">No memories yet</p> : null}
      {memories.length > 0 && filtered.length === 0 ? <p className="text-sm text-zinc-500">No memories match your filters.</p> : null}
    </div>
  );
}
