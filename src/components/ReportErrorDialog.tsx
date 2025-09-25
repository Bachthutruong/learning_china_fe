import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { Flag, Send, X } from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'

interface ReportErrorDialogProps {
  isOpen: boolean
  onClose: () => void
  itemType: 'vocabulary' | 'test'
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-orange-500" />
            Báo cáo lỗi
          </DialogTitle>
          <DialogDescription>
            Giúp chúng tôi cải thiện chất lượng nội dung. Báo cáo lỗi cho: <strong>"{itemContent}"</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Label>Lý do báo cáo *</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {reportReasons.map((reasonOption) => (
                <div key={reasonOption} className="flex items-center space-x-2">
                  <RadioGroupItem value={reasonOption} id={reasonOption} />
                  <Label htmlFor={reasonOption} className="text-sm">
                    {reasonOption}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả chi tiết (tùy chọn)</Label>
            <Textarea
              id="description"
              placeholder="Mô tả chi tiết về lỗi bạn phát hiện..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              <X className="mr-2 h-4 w-4" />
              Hủy
            </Button>
            <Button type="submit" disabled={loading || !reason}>
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Gửi báo cáo
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}


