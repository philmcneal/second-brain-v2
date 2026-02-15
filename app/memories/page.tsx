"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { BookOpen, Search } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Select } from "@/app/components/ui/select";
import { EmptyState } from "@/app/components/ui/empty-state";
import { MemorySkeleton } from "@/app/components/ui/skeleton";
import { useMemoriesStore } from "@/app/stores/memories";

export default function MemoriesPage(): React.JSX.Element {
  const router = useRouter();
  const memories = useMemoriesStore((state) => state.memories);
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsHydrated(true), 0);
    return () => clearTimeout(timer);
  }, []);

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
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Memories</h1>
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
          <Select value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}>
            <option value="all">All Tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </Select>
        </CardContent>
      </Card>

      {!isHydrated ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <MemorySkeleton key={i} />
          ))}
        </div>
      ) : memories.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No memories yet"
          description="Start capturing your ideas, reflections, and insights. Create your first memory to build your knowledge base."
          action={{
            label: "Create Memory",
            onClick: () => router.push("/memories/new"),
          }}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matches found"
          description="No memories match your search criteria. Try adjusting your filters or search query."
        />
      ) : (
        <div className="stagger-children grid gap-4 md:grid-cols-2">
          {filtered.map((memory) => (
            <Link key={memory.id} href={`/memories/${memory.id}`}>
              <Card className="h-full animate-fade-in-up glass-card-hover transition-all duration-200 hover:-translate-y-0.5">
                <CardHeader>
                  <CardTitle>{memory.title}</CardTitle>
                  <CardDescription>{formatDistanceToNow(new Date(memory.updatedAt), { addSuffix: true })}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-3 text-sm text-zinc-300 leading-relaxed">{memory.content}</p>
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
      )}
    </div>
  );
}
