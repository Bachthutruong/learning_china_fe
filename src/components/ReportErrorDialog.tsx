import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
// import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { Flag, Loader2 } from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'

interface ReportErrorDialogProps {
  isOpen: boolean
  onClose: () => void
  itemType: 'vocabulary' | 'test' | 'question'
  itemId: string
  itemContent: string
}

const reportReasons = [
  'Nghĩa không chính xác',
  'Phiên âm sai',
  'Vấn đề âm thanh',
  'Lỗi chính tả trong ví dụ',
  'Từ loại không đúng',
  'Từ đồng nghĩa/trái nghĩa sai',
  'Khác'
]

export const ReportErrorDialog = ({ 
  isOpen, 
  onClose, 
  itemType, 
  itemId, 
  itemContent 
}: ReportErrorDialogProps) => {
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!reason) {
      toast.error('Vui lòng chọn lý do báo cáo')
      return
    }

    setLoading(true)
    
    try {
      await api.post('/reports', {
        type: itemType,
        targetId: itemId,
        category: reason,
        description: description || ''
      })
      
      toast.success('Báo cáo đã được gửi thành công!')
      handleClose()
    } catch (error) {
      console.error('Error submitting report:', error)
      toast.error('Không thể gửi báo cáo. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setReason('')
    setDescription('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="rounded-[2.5rem] p-10 border-none shadow-2xl max-w-lg">
        <DialogHeader className="text-center space-y-4 mb-8">
           <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <Flag className="w-8 h-8 text-primary" />
           </div>
           <DialogTitle className="text-3xl font-black text-gray-900 tracking-tight">Báo cáo nội dung</DialogTitle>
           <DialogDescription className="text-gray-500 font-medium leading-relaxed">
              Bạn phát hiện sai sót trong: <span className="text-gray-900 font-bold">"{itemContent}"</span>? Hãy cho chúng tôi biết để Jiudi hoàn thiện hơn.
           </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Lý do báo cáo *</Label>
            <RadioGroup value={reason} onValueChange={setReason} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {reportReasons.map((reasonOption) => (
                <div 
                  key={reasonOption} 
                  className={`flex items-center space-x-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    reason === reasonOption ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-50 bg-gray-50/30 hover:border-gray-100 hover:bg-white'
                  }`}
                  onClick={() => setReason(reasonOption)}
                >
                  <RadioGroupItem value={reasonOption} id={reasonOption} className="shrink-0" />
                  <Label htmlFor={reasonOption} className="text-sm font-bold text-gray-700 cursor-pointer flex-1">
                    {reasonOption}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Mô tả chi tiết (tùy chọn)</Label>
            <Textarea
              id="description"
              placeholder="Hãy mô tả rõ hơn về lỗi để chúng tôi dễ dàng kiểm tra..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[120px] rounded-2xl border-2 border-gray-50 bg-gray-50/50 focus:bg-white focus:border-primary transition-all font-medium"
              rows={3}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={handleClose}
              className="flex-1 h-12 rounded-xl font-bold text-gray-400"
            >
              Hủy bỏ
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !reason}
              className="flex-1 chinese-gradient h-12 rounded-xl font-black text-white shadow-lg shadow-primary/20"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Gửi báo cáo ngay'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}


