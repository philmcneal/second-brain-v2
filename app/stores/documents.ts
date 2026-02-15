"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { normalizeDate } from "@/app/lib/date-utils";
import type { Document } from "@/app/lib/types";

interface AddDocumentInput {
  name: string;
  path: string;
  content: string;
}

interface UpdateDocumentInput {
  name?: string;
  path?: string;
  content?: string;
}

interface DocumentsStore {
  documents: Document[];
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  replaceDocuments: (documents: Partial<Document>[]) => void;
  addDocument: (input: AddDocumentInput) => void;
  updateDocument: (id: string, input: UpdateDocumentInput) => void;
  deleteDocument: (id: string) => void;
}

const seedNow = new Date().toISOString();

const seedDocuments: Document[] = [
  {
    id: "d-1",
    name: "System Principles",
    path: "notes/system-principles.md",
    content: "# System Principles\n\n- Capture quickly\n- Review weekly\n- Synthesize regularly",
    createdAt: seedNow,
    updatedAt: seedNow,
  },
];

function normalizeDocument(document: Partial<Document>): Document {
  const now = new Date().toISOString();
  return {
    id: typeof document.id === "string" ? document.id : crypto.randomUUID(),
    name: typeof document.name === "string" ? document.name : "Untitled Document",
    path: typeof document.path === "string" ? document.path : "notes/untitled.md",
    content: typeof document.content === "string" ? document.content : "",
    createdAt: normalizeDate(document.createdAt, now) ?? now,
    updatedAt: normalizeDate(document.updatedAt, now) ?? now,
  };
}

export const useDocumentsStore = create<DocumentsStore>()(
  persist(
    (set) => ({
      documents: seedDocuments,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      replaceDocuments: (documents) => {
        set({
          documents: Array.isArray(documents) ? documents.map((document) => normalizeDocument(document)) : [],
        });
      },
      addDocument: (input) => {
        const now = new Date().toISOString();
        set((state) => ({
          documents: [
            {
              id: crypto.randomUUID(),
              name: input.name,
              path: input.path,
              content: input.content,
              createdAt: now,
              updatedAt: now,
            },
            ...state.documents,
          ],
        }));
      },
      updateDocument: (id, input) => {
        set((state) => ({
          documents: state.documents.map((document) =>
            document.id === id
              ? {
                  ...document,
                  ...input,
                  updatedAt: new Date().toISOString(),
                }
              : document,
          ),
        }));
      },
      deleteDocument: (id) => {
        set((state) => ({ documents: state.documents.filter((document) => document.id !== id) }));
      },
    }),
    {
      name: "second-brain-documents",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      migrate: (persistedState) => {
        const state = persistedState as Partial<DocumentsStore>;
        return {
          ...state,
          documents: Array.isArray(state.documents) ? state.documents.map((document) => normalizeDocument(document)) : seedDocuments,
          hasHydrated: false,
        };
      },
    },
  ),
);
