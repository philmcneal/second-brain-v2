"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";

interface FileData {
  path: string;
  content: string;
  modifiedAt: string;
  size: number;
}

export default function WorkspaceFilePage(): React.JSX.Element {
  const params = useParams();
  const [file, setFile] = useState<FileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filePath = params.path ? (Array.isArray(params.path) ? params.path.join("/") : params.path) : "";

  useEffect(() => {
    if (!filePath) return;

    async function loadFile() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/file/${filePath}`);
        if (!response.ok) {
          throw new Error("Failed to load file");
        }
        const data = await response.json();
        setFile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }

    loadFile();
  }, [filePath]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </Link>
        </div>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 w-1/3 bg-zinc-800 rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-4 w-full bg-zinc-800 rounded mb-2" />
            <div className="h-4 w-2/3 bg-zinc-800 rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-red-400">Error loading file</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-400">{error || "File not found"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </Link>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-violet-400" />
              <div>
                <CardTitle className="text-xl">{file.path.split("/").pop()}</CardTitle>
                <CardDescription className="font-mono text-xs">
                  {file.path}
                </CardDescription>
              </div>
            </div>
            <Badge>{(file.size / 1024).toFixed(1)} KB</Badge>
          </div>          
          <div className="mt-4 flex items-center gap-4 text-sm text-zinc-500">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Modified: {format(new Date(file.modifiedAt), "MMM d, yyyy")}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(file.modifiedAt), "h:mm a")}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-invert prose-zinc max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="text-2xl font-bold mt-8 mb-4 text-zinc-100">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl font-semibold mt-6 mb-3 text-zinc-100">{children}</h2>,
                h3: ({ children }) => <h3 className="text-lg font-medium mt-4 mb-2 text-zinc-200">{children}</h3>,
                p: ({ children }) => <p className="mb-4 text-zinc-300 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-6 mb-4 text-zinc-300">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 text-zinc-300">{children}</ol>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
                code: ({ children }) => (
                  <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-sm font-mono text-violet-300">
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="bg-zinc-900 p-4 rounded-lg overflow-x-auto mb-4">
                    {children}
                  </pre>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-violet-500 pl-4 italic text-zinc-400 my-4">
                    {children}
                  </blockquote>
                ),
                a: ({ children, href }) => (
                  <a href={href} className="text-violet-400 hover:underline">
                    {children}
                  </a>
                ),
              }}
            >
              {file.content}
            </ReactMarkdown>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
