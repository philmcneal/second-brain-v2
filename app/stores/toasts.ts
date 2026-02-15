import { create } from 'zustand'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  title: string
  description?: string
  variant: ToastVariant
  duration?: number
}

interface ToastStore {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
}

const MAX_TOASTS = 3

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = { ...toast, id }

    set((state) => {
      const updatedToasts = [...state.toasts, newToast]

      // Keep only the last MAX_TOASTS
      if (updatedToasts.length > MAX_TOASTS) {
        return { toasts: updatedToasts.slice(-MAX_TOASTS) }
      }

      return { toasts: updatedToasts }
    })

    // Auto-dismiss after duration (default 4s)
    const duration = toast.duration ?? 4000
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      }))
    }, duration)
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }))
  },

  clearToasts: () => {
    set({ toasts: [] })
  }
}))

// Helper function for easy toast usage
export const toast = {
  success: (title: string, description?: string, duration?: number) => {
    useToastStore.getState().addToast({ title, description, variant: 'success', duration })
  },
  error: (title: string, description?: string, duration?: number) => {
    useToastStore.getState().addToast({ title, description, variant: 'error', duration })
  },
  warning: (title: string, description?: string, duration?: number) => {
    useToastStore.getState().addToast({ title, description, variant: 'warning', duration })
  },
  info: (title: string, description?: string, duration?: number) => {
    useToastStore.getState().addToast({ title, description, variant: 'info', duration })
  }
}
