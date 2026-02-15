"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { useDocumentsStore } from "@/app/stores/documents";

export default function DocumentDetailPage(): React.JSX.Element {
  const params = useParams<{ id: string }>();
  const document = useDocumentsStore((state) => state.documents.find((item) => item.id === params.id));

  if (!document) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Document Not Found</h1>
        <Link href="/documents" className="text-sm text-zinc-300 underline">
          Return to documents
        </Link>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{document.name}</CardTitle>
        <CardDescription>
          {document.path} • Updated {format(new Date(document.updatedAt), "PPP p")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-zinc-800 bg-zinc-950 p-4">
          <article className="prose prose-invert max-w-none prose-headings:text-zinc-100 prose-p:text-zinc-200 prose-li:text-zinc-200">
            <ReactMarkdown>{document.content}</ReactMarkdown>
          </article>
        </div>
        <div className="mt-4">
          <Link href="/documents">
            <Button variant="secondary">Back to Documents</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
