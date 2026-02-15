"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { normalizeDate } from "@/app/lib/date-utils";
import type { Memory } from "@/app/lib/types";

interface AddMemoryInput {
  title: string;
  content: string;
  tags: string[];
}

interface UpdateMemoryInput {
  title?: string;
  content?: string;
  tags?: string[];
}

interface MemoriesStore {
  memories: Memory[];
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  addMemory: (input: AddMemoryInput) => string;
  updateMemory: (id: string, input: UpdateMemoryInput) => void;
  deleteMemory: (id: string) => void;
}

const seedNow = new Date().toISOString();

const seedMemories: Memory[] = [
  {
    id: "m-1",
    title: "Weekly Reflection",
    content: "I work best when I start with one high-impact task before messages.",
    tags: ["reflection", "productivity"],
    createdAt: seedNow,
    updatedAt: seedNow,
  },
];

function normalizeMemory(memory: Partial<Memory>): Memory {
  const now = new Date().toISOString();
  return {
    id: typeof memory.id === "string" ? memory.id : crypto.randomUUID(),
    title: typeof memory.title === "string" ? memory.title : "Untitled Memory",
    content: typeof memory.content === "string" ? memory.content : "",
    tags: Array.isArray(memory.tags) ? memory.tags.filter((tag): tag is string => typeof tag === "string") : [],
    createdAt: normalizeDate(memory.createdAt, now) ?? now,
    updatedAt: normalizeDate(memory.updatedAt, now) ?? now,
  };
}

export const useMemoriesStore = create<MemoriesStore>()(
  persist(
    (set) => ({
      memories: seedMemories,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      addMemory: (input) => {
        const now = new Date().toISOString();
        const id = crypto.randomUUID();
        const memory: Memory = {
          id,
          title: input.title,
          content: input.content,
          tags: input.tags,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ memories: [memory, ...state.memories] }));
        return id;
      },
      updateMemory: (id, input) => {
        set((state) => ({
          memories: state.memories.map((memory) =>
            memory.id === id
              ? {
                  ...memory,
                  ...input,
                  updatedAt: new Date().toISOString(),
                }
              : memory,
          ),
        }));
      },
      deleteMemory: (id) => {
        set((state) => ({ memories: state.memories.filter((memory) => memory.id !== id) }));
      },
    }),
    {
      name: "second-brain-memories",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      migrate: (persistedState) => {
        const state = persistedState as Partial<MemoriesStore>;
        return {
          ...state,
          memories: Array.isArray(state.memories) ? state.memories.map((memory) => normalizeMemory(memory)) : seedMemories,
          hasHydrated: false,
        };
      },
    },
  ),
);
