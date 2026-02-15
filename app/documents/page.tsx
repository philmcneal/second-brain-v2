"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { useDocumentsStore } from "@/app/stores/documents";

export default function DocumentsPage(): React.JSX.Element {
  const documents = useDocumentsStore((state) => state.documents);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return documents;

    return documents.filter((document) => {
      return (
        document.name.toLowerCase().includes(normalized) ||
        document.path.toLowerCase().includes(normalized) ||
        document.content.toLowerCase().includes(normalized)
      );
    });
  }, [documents, query]);

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-semibold">Documents</h1>
        <p className="text-sm text-zinc-400">Browse markdown notes and long-form references.</p>
      </div>

      <Card className="animate-fade-in-up">
        <CardHeader>
          <CardTitle>Document Browser</CardTitle>
        </CardHeader>
        <CardContent>
          <Input placeholder="Search documents by name, path, or content" value={query} onChange={(event) => setQuery(event.target.value)} />
        </CardContent>
      </Card>

      <div className="stagger-children space-y-3">
        {filtered.map((document) => (
          <Link
            key={document.id}
            href={`/documents/${document.id}`}
            className="animate-fade-in-up flex items-center justify-between rounded-xl border border-[var(--glass-border)] bg-[var(--glass)] px-4 py-3 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/10 hover:shadow-[0_10px_28px_rgba(0,0,0,0.3)]"
          >
            <div>
              <p className="text-sm font-medium text-zinc-100">{document.name}</p>
              <p className="text-xs text-zinc-400">{document.path}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge>md</Badge>
              <p className="text-xs text-zinc-500">{formatDistanceToNow(new Date(document.updatedAt), { addSuffix: true })}</p>
            </div>
          </Link>
        ))}
        {filtered.length === 0 ? <p className="text-sm text-zinc-500">No documents yet</p> : null}
      </div>
    </div>
  );
}
