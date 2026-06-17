import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { AlertTriangle, Loader2 } from 'lucide-react'

export interface ConfirmState {
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
  onConfirm: () => void | Promise<void>
}

interface ConfirmDialogProps {
  state: ConfirmState | null
  loading?: boolean
  onClose: () => void
}

export const ConfirmDialog = ({ state, loading = false, onClose }: ConfirmDialogProps) => {
  const danger = state?.danger ?? true
  return (
    <Dialog open={!!state} onOpenChange={(open) => { if (!open && !loading) onClose() }}>
      <DialogContent className="sm:max-w-md rounded-[2rem] border-none shadow-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-gray-900 flex items-center gap-3">
            <span className={`h-10 w-10 rounded-2xl flex items-center justify-center ${danger ? 'bg-red-50 text-red-500' : 'bg-primary/10 text-primary'}`}>
              <AlertTriangle className="h-5 w-5" />
            </span>
            {state?.title}
          </DialogTitle>
        </DialogHeader>
        {state?.description && (
          <p className="text-sm font-medium text-gray-500 leading-relaxed">{state.description}</p>
        )}
        <div className="mt-4 flex gap-3">
          <Button
            variant="outline"
            disabled={loading}
            onClick={onClose}
            className="flex-1 h-12 rounded-xl font-black border-gray-200"
          >
            {state?.cancelText || 'Hủy'}
          </Button>
          <Button
            disabled={loading}
            onClick={() => state?.onConfirm()}
            className={`flex-1 h-12 rounded-xl font-black text-white shadow-lg ${danger ? 'bg-red-500 hover:bg-red-600' : 'chinese-gradient'}`}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {state?.confirmText || 'Xác nhận'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ConfirmDialog
