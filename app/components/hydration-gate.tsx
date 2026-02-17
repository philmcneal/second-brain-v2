"use client";

import { useEffect } from "react";

import { useDocumentsStore } from "@/app/stores/documents";
import { useMemoriesStore } from "@/app/stores/memories";
import { startTasksPolling, stopTasksPolling, useTasksStore } from "@/app/stores/tasks";

interface HydrationGateProps {
  children: React.ReactNode;
}

export function HydrationGate({ children }: HydrationGateProps): React.JSX.Element | null {
  const memoriesHydrated = useMemoriesStore((state) => state.hasHydrated);
  const documentsHydrated = useDocumentsStore((state) => state.hasHydrated);
  const tasksHydrated = useTasksStore((state) => state.hasHydrated);

  useEffect(() => {
    startTasksPolling();
    return () => stopTasksPolling();
  }, []);

  if (!memoriesHydrated || !documentsHydrated || !tasksHydrated) {
    return null;
  }

  return <>{children}</>;
}
