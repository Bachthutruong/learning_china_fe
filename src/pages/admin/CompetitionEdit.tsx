import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { Badge } from '../../components/ui/badge'
import { api } from '../../services/api'
import { ArrowLeft, Plus, Save, Trash2, X } from 'lucide-react'
import { Label } from '../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import toast from 'react-hot-toast'

interface LevelItem { _id: string; name: string; number?: number; level?: number }

interface CompetitionForm {
  _id?: string
  title: string
  description: string
  level: string
  startDate: string
  endDate: string
  cost: number
  reward: { xp: number, coins: number }
  prizes: { first: { xp: number, coins: number }, second: { xp: number, coins: number }, third: { xp: number, coins: number } }
  questions: Array<{ question: string; options: string[]; correctAnswer: number | number[]; questionType?: 'multiple' | 'fill-blank' | 'reading-comprehension' | 'sentence-order' }>
}

export const AdminCompetitionEdit = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id || id === 'new'

  const [levels, setLevels] = useState<LevelItem[]>([])
  const [form, setForm] = useState<CompetitionForm>({
    title: '', description: '', level: 'All',
    startDate: new Date().toISOString().slice(0,16),
    endDate: new Date(Date.now()+3600_000).toISOString().slice(0,16),
    cost: 0, reward: { xp: 0, coins: 0 },
    prizes: { first: { xp: 100, coins: 50 }, second: { xp: 70, coins: 30 }, third: { xp: 40, coins: 20 } },
    questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0, questionType: 'multiple' }]
  })

  useEffect(() => {
    fetchLevels()
    if (!isNew) fetchCompetition(id as string)
  }, [id])

  const fetchLevels = async () => {
    try {
      const res = await api.get('/admin/levels')
      const arr = res.data.levels || res.data || []
      setLevels(arr)
    } catch (e) {
      setLevels([])
    }
  }

  const fetchCompetition = async (compId: string) => {
    try {
      const res = await api.get('/admin/competitions')
      const found = (res.data?.competitions || []).find((c: any) => c._id === compId)
      if (found) {
        setForm({
          _id: found._id,
          title: found.title,
          description: found.description,
          level: found.level,
          startDate: (found.startDate || new Date()).toString().slice(0,16),
          endDate: (found.endDate || new Date()).toString().slice(0,16),
          cost: found.cost || 0,
          reward: found.reward || { xp: 0, coins: 0 },
          prizes: found.prizes || { first: { xp: 100, coins: 50 }, second: { xp: 70, coins: 30 }, third: { xp: 40, coins: 20 } },
          questions: (found.questions || []).map((q: any) => ({
            question: q.question,
            options: q.options || [],
            correctAnswer: q.correctAnswer,
            questionType: q.questionType || 'multiple'
          }))
        })
      }
    } catch (e) {}
  }

  const joinUrl = useMemo(() => `${window.location.origin}/competition?c=${form._id || ''}`, [form._id])
  const qrUrl = useMemo(() => `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(joinUrl)}`, [joinUrl])

  const updateQuestion = (idx: number, patch: Partial<CompetitionForm['questions'][number]>) => {
    const qs = [...form.questions]; qs[idx] = { ...qs[idx], ...patch } as any; setForm({ ...form, questions: qs })
  }

  const save = async () => {
    const payload = { ...form }
    try {
      if (form._id) await api.put(`/admin/competitions/${form._id}`, payload)
      else {
        const res = await api.post('/admin/competitions', payload)
        setForm(prev => ({ ...prev, _id: res.data?.competition?._id }))
      }
      toast.success('Lưu giải đấu thành công')
      navigate('/admin/competitions')
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Lỗi khi lưu giải đấu')
    }
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin/competitions')} className="w-10 h-10 rounded-xl bg-white border border-gray-100 shadow-sm hover:bg-gray-50 p-0">
             <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Button>
          <div>
             <h1 className="text-3xl font-black text-gray-900 tracking-tight">{isNew ? 'Khởi tạo giải đấu' : 'Hiệu chỉnh giải đấu'}</h1>
             <p className="text-gray-500 font-medium">Thiết lập chi tiết kịch bản thi đấu, thể lệ và cơ cấu giải thưởng.</p>
          </div>
        </div>
        
        <Button onClick={save} className="chinese-gradient h-11 px-8 rounded-xl font-black text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-1">
          <Save className="h-4 w-4 mr-2" /> {isNew ? 'Khởi tạo ngay' : 'Lưu thay đổi'}
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            {/* Basic Info */}
            <div className="bg-white rounded-[3rem] p-8 md:p-10 border border-gray-100 shadow-xl space-y-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
               <h3 className="text-xl font-black text-gray-900 flex items-center relative z-10">
                  <div className="w-2 h-6 chinese-gradient rounded-full mr-3" />
                  Thông tin kịch bản
               </h3>

               <div className="relative z-10 space-y-6">
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Tiêu đề giải đấu</Label>
                     <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="h-12 rounded-xl border-gray-50 bg-gray-50/50 focus:bg-white focus:border-primary transition-all font-bold" placeholder="Nhập tên giải đấu..." />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Mô tả chi tiết</Label>
                     <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="min-h-[120px] rounded-2xl border-gray-50 bg-gray-50/50 focus:bg-white focus:border-primary transition-all font-medium leading-relaxed" placeholder="Mô tả về mục tiêu và đối tượng tham gia..." />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Trình độ áp dụng</Label>
                        <select className="w-full h-12 px-4 bg-gray-50/50 border-2 border-gray-50 rounded-xl font-bold text-sm text-gray-700 focus:bg-white focus:border-primary transition-all outline-none" value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}>
                           <option value="All">Tất cả trình độ</option>
                           {levels.map(l => <option key={l._id} value={l.name}>{l.name}</option>)}
                        </select>
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Lệ phí tham dự (Xu)</Label>
                        <Input type="number" value={form.cost} onChange={e => setForm({ ...form, cost: parseInt(e.target.value || '0') })} className="h-12 rounded-xl border-gray-50 bg-gray-50/50 focus:bg-white font-black text-amber-500" />
                     </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Thời điểm bắt đầu</Label>
                        <Input type="datetime-local" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="h-12 rounded-xl border-gray-50 bg-gray-50/50 focus:bg-white font-bold" />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Thời điểm kết thúc</Label>
                        <Input type="datetime-local" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="h-12 rounded-xl border-gray-50 bg-gray-50/50 focus:bg-white font-bold" />
                     </div>
                  </div>
               </div>
            </div>

            {/* Questions Section */}
            <div className="space-y-6">
               <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-gray-900 flex items-center">
                     <div className="w-2 h-6 chinese-gradient rounded-full mr-3" />
                     Bộ đề thi ({form.questions.length} câu)
                  </h3>
                  <Button onClick={() => setForm({ ...form, questions: [...form.questions, { question: '', options: ['', '', '', ''], correctAnswer: 0, questionType: 'multiple' }] })} variant="outline" size="sm" className="rounded-xl font-black text-[10px] uppercase border-gray-200">
                     <Plus className="w-3 h-3 mr-1" /> Thêm câu hỏi
                  </Button>
               </div>

               <div className="space-y-6">
                  {form.questions.map((q, idx) => (
                    <div key={idx} className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm space-y-6 relative group">
                       <div className="flex justify-between items-center">
                          <Badge className="bg-gray-100 text-gray-500 border-none font-black text-[10px] px-3 py-1">CÂU HỎI {idx + 1}</Badge>
                          <Button variant="ghost" size="icon" onClick={() => setForm({ ...form, questions: form.questions.filter((_, i) => i !== idx) })} className="w-8 h-8 rounded-lg hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                             <Trash2 className="w-4 h-4" />
                          </Button>
                       </div>

                       <Textarea value={q.question} onChange={e => updateQuestion(idx, { question: e.target.value })} className="min-h-[80px] rounded-2xl border-gray-100 bg-gray-50 focus:bg-white transition-all font-bold text-lg" placeholder="Nội dung câu hỏi..." />

                       <div className="grid md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                             <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Các phương án trả lời</Label>
                             {q.options.map((opt, oi) => (
                               <div key={oi} className="flex items-center gap-2 group/opt">
                                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400 shrink-0">{String.fromCharCode(65 + oi)}</div>
                                  <Input value={opt} onChange={e => {
                                    const opts = [...q.options]; opts[oi] = e.target.value; updateQuestion(idx, { options: opts })
                                  }} className="h-10 rounded-xl border-gray-50 bg-gray-50 focus:bg-white font-medium text-sm" />
                                  <button onClick={() => {
                                    const opts = q.options.filter((_, j) => j !== oi)
                                    let next: any = q.correctAnswer
                                    if (Array.isArray(next)) next = (next as number[]).filter(v => v !== oi).map(v => v > oi ? v - 1 : v)
                                    else if (typeof next === 'number') next = next > oi ? (next as number) - 1 : next
                                    updateQuestion(idx, { options: opts, correctAnswer: next })
                                  }} className="w-8 h-8 rounded-lg text-gray-300 hover:text-red-500 transition-colors shrink-0">
                                     <X className="w-4 h-4" />
                                  </button>
                               </div>
                             ))}
                             <button onClick={() => updateQuestion(idx, { options: [...q.options, ''] })} className="w-full h-10 rounded-xl border-2 border-dashed border-gray-100 text-[10px] font-black uppercase text-gray-400 hover:border-primary/30 hover:text-primary transition-all">
                                + Thêm phương án
                             </button>
                          </div>

                          <div className="space-y-6">
                             <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Hình thức lựa chọn</Label>
                                <Select value={q.questionType || 'multiple'} onValueChange={(v: any) => updateQuestion(idx, { questionType: v, correctAnswer: v === 'multiple' ? (Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer]) : (Array.isArray(q.correctAnswer) ? q.correctAnswer[0] : q.correctAnswer) })}>
                                   <SelectTrigger className="h-10 rounded-xl border-gray-50 bg-gray-50 font-bold text-xs">
                                      <SelectValue />
                                   </SelectTrigger>
                                   <SelectContent className="rounded-xl">
                                      <SelectItem value="multiple">Trắc nghiệm</SelectItem>
                                      <SelectItem value="fill-blank">Điền từ</SelectItem>
                                      <SelectItem value="reading-comprehension">Đọc hiểu</SelectItem>
                                      <SelectItem value="sentence-order">Sắp xếp câu</SelectItem>
                                   </SelectContent>
                                </Select>
                             </div>

                             <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Xác định đáp án đúng</Label>
                                <div className="flex flex-wrap gap-2">
                                   {q.options.map((_, oi) => {
                                     const isCorrect = Array.isArray(q.correctAnswer) ? q.correctAnswer.includes(oi) : q.correctAnswer === oi
                                     return (
                                       <button
                                         key={oi}
                                         onClick={() => {
                                           if (q.questionType === 'multiple') {
                                             let next = Array.isArray(q.correctAnswer) ? [...q.correctAnswer] : [q.correctAnswer]
                                             if (next.includes(oi)) next = next.filter(v => v !== oi)
                                             else next = [...next, oi]
                                             updateQuestion(idx, { correctAnswer: next.length === 1 ? next[0] : next })
                                           } else {
                                             updateQuestion(idx, { correctAnswer: oi })
                                           }
                                         }}
                                         className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${
                                           isCorrect ? 'chinese-gradient text-white shadow-lg' : 'bg-gray-50 text-gray-400'
                                         }`}
                                       >
                                          {String.fromCharCode(65 + oi)}
                                       </button>
                                     )
                                   })}
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>

         <div className="space-y-8">
            {/* Summary & Prizes Edit */}
            <div className="bg-gray-900 rounded-[3rem] p-8 md:p-10 text-white relative overflow-hidden group">
               <div className="absolute inset-0 chinese-gradient opacity-10" />
               <div className="relative z-10 space-y-8">
                  <h3 className="text-xl font-black text-center">Cơ cấu giải thưởng</h3>
                  
                  <div className="space-y-6">
                    {['first', 'second', 'third'].map((rank) => (
                      <div key={rank} className="space-y-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                        <Label className={`text-[10px] font-black uppercase tracking-widest ${
                          rank === 'first' ? 'text-yellow-400' : rank === 'second' ? 'text-gray-300' : 'text-amber-600'
                        }`}>
                          Hạng {rank === 'first' ? 'Nhất' : rank === 'second' ? 'Nhì' : 'Ba'}
                        </Label>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <span className="text-[8px] text-gray-500 uppercase font-black">XP</span>
                            <Input 
                              type="number" 
                              value={(form.prizes as any)[rank].xp} 
                              onChange={e => setForm({ ...form, prizes: { ...form.prizes, [rank]: { ...(form.prizes as any)[rank], xp: parseInt(e.target.value || '0') } } })}
                              className="h-9 bg-white/10 border-none text-white text-xs font-bold rounded-lg focus:bg-white/20 transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[8px] text-gray-500 uppercase font-black">Xu</span>
                            <Input 
                              type="number" 
                              value={(form.prizes as any)[rank].coins} 
                              onChange={e => setForm({ ...form, prizes: { ...form.prizes, [rank]: { ...(form.prizes as any)[rank], coins: parseInt(e.target.value || '0') } } })}
                              className="h-9 bg-white/10 border-none text-white text-xs font-bold rounded-lg focus:bg-white/20 transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-6 border-t border-white/10 space-y-4">
                     <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Thưởng khích lệ (Hoàn thành)</p>
                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <span className="text-[8px] text-gray-500 uppercase font-black block text-center">XP Base</span>
                           <Input 
                             type="number" 
                             value={form.reward.xp} 
                             onChange={e => setForm({ ...form, reward: { ...form.reward, xp: parseInt(e.target.value || '0') } })}
                             className="h-10 bg-white/10 border-none text-white text-lg font-black rounded-xl text-center focus:bg-white/20 transition-all"
                           />
                        </div>
                        <div className="space-y-2">
                           <span className="text-[8px] text-gray-500 uppercase font-black block text-center">Xu Base</span>
                           <Input 
                             type="number" 
                             value={form.reward.coins} 
                             onChange={e => setForm({ ...form, reward: { ...form.reward, coins: parseInt(e.target.value || '0') } })}
                             className="h-10 bg-white/10 border-none text-white text-lg font-black rounded-xl text-center focus:bg-white/20 transition-all"
                           />
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {!isNew && form._id && (
              <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl space-y-6 text-center">
                 <h3 className="text-lg font-black text-gray-900">Mã định danh giải đấu</h3>
                 <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 shadow-inner inline-block">
                    <img src={qrUrl} alt="QR" className="w-40 h-40" />
                 </div>
                 <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Đường dẫn trực tiếp</p>
                    <div className="flex gap-2">
                       <Input value={joinUrl} readOnly className="h-10 text-xs bg-gray-50 border-none font-medium truncate" />
                       <Button variant="ghost" size="icon" className="shrink-0 h-10 w-10 bg-gray-50 rounded-xl" onClick={() => { navigator.clipboard.writeText(joinUrl); toast.success('Đã sao chép liên kết'); }}>
                          <Save className="w-4 h-4 text-gray-400" />
                       </Button>
                    </div>
                 </div>
              </div>
            )}
         </div>
      </div>
    </div>
  )
}

export default AdminCompetitionEdit


