'use client'

import { useEffect } from 'react'
import { useConfirmStore } from '@/app/stores/confirm'
import { Button } from './button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from './dialog'

export function ConfirmDialog() {
  const { isOpen, title, description, variant, confirmLabel, cancelLabel, handleConfirm, handleCancel } = useConfirmStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'Enter') {
        e.preventDefault()
        handleConfirm()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        handleCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleConfirm, handleCancel])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="flex justify-end gap-3 mt-4">
          <Button
            variant="outline"
            onClick={handleCancel}
          >
            {cancelLabel ?? 'Cancel'}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            autoFocus
          >
            {confirmLabel ?? 'Confirm'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
