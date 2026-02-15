"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";

import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { useMemoriesStore } from "@/app/stores/memories";

export default function MemoryDetailPage(): React.JSX.Element {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const memory = useMemoriesStore((state) => state.memories.find((item) => item.id === params.id));
  const deleteMemory = useMemoriesStore((state) => state.deleteMemory);

  if (!memory) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Memory Not Found</h1>
        <Link href="/memories" className="text-sm text-zinc-300 underline">
          Return to memories
        </Link>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-3">
        <CardTitle className="text-2xl">{memory.title}</CardTitle>
        <CardDescription>
          Created {format(new Date(memory.createdAt), "PPP p")} • Updated {format(new Date(memory.updatedAt), "PPP p")}
        </CardDescription>
        <div className="flex flex-wrap gap-2">
          {memory.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="whitespace-pre-wrap text-zinc-200">{memory.content}</p>
        <div className="flex items-center gap-2">
          <Link href="/memories">
            <Button variant="secondary">Back</Button>
          </Link>
          <Button
            variant="destructive"
            onClick={() => {
              deleteMemory(memory.id);
              router.push("/memories");
            }}
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
