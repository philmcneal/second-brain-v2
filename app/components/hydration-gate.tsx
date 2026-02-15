"use client";

import { useDocumentsStore } from "@/app/stores/documents";
import { useMemoriesStore } from "@/app/stores/memories";
import { useTasksStore } from "@/app/stores/tasks";

interface HydrationGateProps {
  children: React.ReactNode;
}

export function HydrationGate({ children }: HydrationGateProps): React.JSX.Element | null {
  const memoriesHydrated = useMemoriesStore((state) => state.hasHydrated);
  const documentsHydrated = useDocumentsStore((state) => state.hasHydrated);
  const tasksHydrated = useTasksStore((state) => state.hasHydrated);

  if (!memoriesHydrated || !documentsHydrated || !tasksHydrated) {
    return null;
  }

  return <>{children}</>;
}
