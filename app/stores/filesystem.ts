"use client";

import { create } from "zustand";

export interface WorkspaceFile {
  path: string;
  name: string;
  isDirectory: boolean;
  modifiedAt: string;
}

export interface FileContent {
  path: string;
  content: string;
  modifiedAt: string;
  size: number;
}

interface FilesystemStore {
  files: WorkspaceFile[];
  fileCache: Map<string, FileContent>;
  isLoading: boolean;
  error: string | null;
  lastRefresh: Date | null;
  // Actions
  refreshFiles: () => Promise<void>;
  readFile: (path: string) => Promise<FileContent | null>;
  clearCache: () => void;
}

const POLL_INTERVAL = 5000; // 5 seconds

async function fetchFiles(): Promise<WorkspaceFile[]> {
  const response = await fetch("/api/files");
  if (!response.ok) {
    throw new Error("Failed to fetch files");
  }
  const data = await response.json();
  return data.files || [];
}

async function fetchFileContent(path: string): Promise<FileContent> {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(`/api/file/${encodedPath}`);
  if (!response.ok) {
    throw new Error("Failed to fetch file content");
  }
  return response.json();
}

export const useFilesystemStore = create<FilesystemStore>()((set, get) => ({
  files: [],
  fileCache: new Map(),
  isLoading: false,
  error: null,
  lastRefresh: null,

  refreshFiles: async () => {
    set({ isLoading: true, error: null });
    try {
      const files = await fetchFiles();
      set({ files, isLoading: false, lastRefresh: new Date() });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : "Unknown error", 
        isLoading: false 
      });
    }
  },

  readFile: async (path: string) => {
    const { fileCache } = get();
    
    // Check cache first
    const cached = fileCache.get(path);
    if (cached) {
      return cached;
    }
    
    try {
      const content = await fetchFileContent(path);
      const newCache = new Map(fileCache);
      newCache.set(path, content);
      set({ fileCache: newCache });
      return content;
    } catch (error) {
      console.error(`Error reading file ${path}:`, error);
      return null;
    }
  },

  clearCache: () => {
    set({ fileCache: new Map() });
  },
}));

// Start polling when store is first used
let pollInterval: NodeJS.Timeout | null = null;

export function startFilesystemPolling() {
  if (pollInterval) return;
  
  const store = useFilesystemStore.getState();
  store.refreshFiles();
  
  pollInterval = setInterval(() => {
    useFilesystemStore.getState().refreshFiles();
  }, POLL_INTERVAL);
}

export function stopFilesystemPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}
