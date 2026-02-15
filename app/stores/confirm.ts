import { create } from 'zustand'

export type ConfirmVariant = 'default' | 'destructive'

interface ConfirmState {
  isOpen: boolean
  title: string
  description?: string
  variant: ConfirmVariant
  confirmLabel?: string
  cancelLabel?: string
  resolve: ((value: boolean) => void) | null
}

interface ConfirmStore extends ConfirmState {
  confirm: (options: {
    title: string
    description?: string
    variant?: ConfirmVariant
    confirmLabel?: string
    cancelLabel?: string
  }) => Promise<boolean>
  handleConfirm: () => void
  handleCancel: () => void
}

export const useConfirmStore = create<ConfirmStore>((set, get) => ({
  isOpen: false,
  title: '',
  description: undefined,
  variant: 'default',
  confirmLabel: undefined,
  cancelLabel: undefined,
  resolve: null,

  confirm: (options) => {
    return new Promise<boolean>((resolve) => {
      set({
        isOpen: true,
        title: options.title,
        description: options.description,
        variant: options.variant ?? 'default',
        confirmLabel: options.confirmLabel,
        cancelLabel: options.cancelLabel,
        resolve
      })
    })
  },

  handleConfirm: () => {
    const { resolve } = get()
    if (resolve) {
      resolve(true)
    }
    set({
      isOpen: false,
      resolve: null
    })
  },

  handleCancel: () => {
    const { resolve } = get()
    if (resolve) {
      resolve(false)
    }
    set({
      isOpen: false,
      resolve: null
    })
  }
}))

// Helper function for easy usage
export const confirm = (options: {
  title: string
  description?: string
  variant?: ConfirmVariant
  confirmLabel?: string
  cancelLabel?: string
}) => {
  return useConfirmStore.getState().confirm(options)
}
