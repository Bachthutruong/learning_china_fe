import { useState } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Star, Loader2, CheckCircle, Heart } from 'lucide-react'
import toast from 'react-hot-toast'

const feedbackTypes = [
  { id: 'bug', title: 'Báo cáo lỗi', icon: '🐛' },
  { id: 'feature', title: 'Đề xuất tính năng', icon: '💡' }
]

export const Feedback = () => {
  const [formData, setFormData] = useState({ type: '', rating: 0, title: '', description: '', email: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true)
    try {
      await new Promise(r => setTimeout(r, 1000))
      toast.success('Cảm ơn phản hồi của bạn!'); setFormData({ type: '', rating: 0, title: '', description: '', email: '' })
    } catch { toast.error('Lỗi') } finally { setIsSubmitting(false) }
  }

  return (
    <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4"><div className="inline-flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20"><Heart className="w-4 h-4 text-primary" /><span className="text-primary text-xs font-bold uppercase tracking-widest">Góp ý xây dựng</span></div><h1 className="text-4xl font-black">Cùng Jiudi <span className="text-primary">Tốt hơn</span></h1></div>

        <div className="bg-white rounded-[3rem] p-8 md:p-12 border shadow-2xl space-y-10">
           <form onSubmit={handleSubmit} className="space-y-10">
              <div className="space-y-4"><Label className="text-xs font-black uppercase text-gray-400">Bạn muốn phản hồi về? *</Label><div className="grid grid-cols-2 gap-4">{feedbackTypes.map(t => (<div key={t.id} onClick={() => setFormData({ ...formData, type: t.id })} className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all text-center ${formData.type === t.id ? 'border-primary bg-primary/5' : 'border-gray-50 bg-gray-50/30'}`}><div className="text-3xl">{t.icon}</div><h4 className="text-xs font-black uppercase mt-3">{t.title}</h4></div>))}</div></div>
              <div className="space-y-4"><Label className="text-xs font-black uppercase text-gray-400">Đánh giá sao *</Label><div className="flex gap-2 justify-center">{[1, 2, 3, 4, 5].map(s => <button key={s} type="button" onClick={() => setFormData({ ...formData, rating: s })} className={s <= formData.rating ? 'text-yellow-400' : 'text-gray-300'}><Star className="fill-current" /></button>)}</div></div>
              <div className="space-y-4"><Label className="text-xs font-black uppercase text-gray-400">Tiêu đề *</Label><Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required className="h-12 rounded-xl" /></div>
              <div className="space-y-4"><Label className="text-xs font-black uppercase text-gray-400">Chi tiết *</Label><Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} required className="min-h-[120px] rounded-2xl" /></div>
              <Button type="submit" disabled={isSubmitting || !formData.type || !formData.rating} className="w-full h-16 rounded-2xl chinese-gradient text-white font-black text-xl shadow-xl">{isSubmitting ? <Loader2 className="animate-spin" /> : 'Gửi phản hồi'}</Button>
           </form>
        </div>
      </div>
    </div>
  )
}