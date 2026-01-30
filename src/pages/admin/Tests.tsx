import { useEffect, useRef, useState } from 'react'
import { Card, CardContent } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  Upload, 
  FileSpreadsheet, 
  TestTube,
  Save,
  AlertCircle,
  ArrowLeft,
  Search,
  Clock,
  Download,
  CheckCircle,
  Eye,
  BookOpen,
  X,
  Target,
  ChevronRight,
  Lightbulb,
  Grid3X3,
  Table as TableIcon
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import toast from 'react-hot-toast'
import { api } from '../../services/api'

type QuestionType = 'multiple-choice' | 'fill-blank' | 'reading-comprehension' | 'sentence-order'

interface QuestionItem {
  _id: string
  level: number
  questionType: QuestionType
  question: string
  options?: string[]
  explanation?: string
  passage?: string
  sentences?: string[]
  correctOrder?: number[]
  correctAnswer?: any
  subQuestions?: Array<{
    question: string
    options: string[]
    correctAnswer: number
  }>
  createdAt?: string
}

interface QuestionFormData {
  level: number
  questionType: QuestionType
  question: string
  options: string[]
  correctAnswer: number | number[] | string
  explanation?: string
  passage?: string
  sentences?: string[]
  blanks?: { position: number; correctAnswer: string }[]
  subQuestions?: Array<{
    question: string
    options: string[]
    correctAnswer: number
  }>
}

export const AdminTests = () => {
  const [items, setItems] = useState<QuestionItem[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')
  
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [editing, setEditing] = useState<QuestionItem | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  const [importing, setImporting] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importProgress, setImportProgress] = useState<{
    total: number; processed: number; created: number; updated: number
    errors: Array<{ row: number; message: string }>
  } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  
  const [showHistory, setShowHistory] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyPage, setHistoryPage] = useState(1)
  const [historyTotalPages, setHistoryTotalPages] = useState(1)
  const [historyItems, setHistoryItems] = useState<any[]>([])
  const [historyQuestion, setHistoryQuestion] = useState<QuestionItem | null>(null)
  const [historyStats, setHistoryStats] = useState<{ total: number; correct: number }>({ total: 0, correct: 0 })

  const [levels, setLevels] = useState<any[]>([])
  
  const [form, setForm] = useState<QuestionFormData>({
    level: 1, questionType: 'multiple-choice', question: '', options: ['', ''], correctAnswer: 0, explanation: '', passage: '', sentences: [], subQuestions: []
  })

  useEffect(() => { 
    fetchQuestions()
    fetchLevels() 
  }, [page, pageSize, search])

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      const res = await api.get('/questions', { params: { page, limit: pageSize, search } })
      setItems(res.data?.items || [])
      setTotalPages(res.data?.totalPages || 1)
      setTotal(res.data?.total || 0)
    } catch { 
      toast.error('Lỗi tải câu hỏi') 
    } finally {
      setLoading(false)
    }
  }

  const fetchLevels = async () => {
    try {
      const res = await api.get('/admin/levels')
      setLevels((res.data?.levels || res.data || []).map((l: any) => ({ _id: l._id, number: l.number ?? l.level, name: l.name })))
    } catch { setLevels([]) }
  }

  const resetForm = () => {
    setForm({ level: 1, questionType: 'multiple-choice', question: '', options: ['', ''], correctAnswer: 0, explanation: '', passage: '', sentences: [], subQuestions: [] })
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validateForm(); if (err) return toast.error(err)
    setFormLoading(true)
    try {
      const payload = buildPayload()
      await api.post('/questions', payload)
      toast.success('Tạo câu hỏi thành công')
      setShowCreateDialog(false); resetForm(); fetchQuestions()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Không thể tạo câu hỏi')
    } finally { setFormLoading(false) }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editing) return
    const err = validateForm(); if (err) return toast.error(err)
    setFormLoading(true)
    try {
      const payload = buildPayload()
      await api.put(`/questions/${editing._id}`, payload)
      toast.success('Cập nhật thành công')
      setShowEditDialog(false); fetchQuestions()
    } catch { toast.error('Lỗi cập nhật') }
    finally { setFormLoading(false) }
  }

  const buildPayload = () => {
    const payload: any = { level: form.level, questionType: form.questionType, question: form.question, explanation: form.explanation }
    if (form.questionType === 'multiple-choice') { payload.options = form.options; payload.correctAnswer = form.correctAnswer }
    if (form.questionType === 'reading-comprehension') { payload.passage = form.passage; payload.subQuestions = form.subQuestions; payload.question = form.question || 'Đọc đoạn văn sau và trả lời câu hỏi' }
    if (form.questionType === 'sentence-order') { payload.sentences = form.sentences; payload.correctOrder = form.correctAnswer }
    if (form.questionType === 'fill-blank') { payload.correctAnswer = form.correctAnswer }
    return payload
  }

  const validateForm = (): string | null => {
    if (!form.question.trim() && form.questionType !== 'reading-comprehension') return 'Vui lòng nhập nội dung câu hỏi'
    if (form.questionType === 'multiple-choice') {
      if (form.options.filter(o => o.trim()).length < 2) return 'Cần ít nhất 2 đáp án'
    }
    if (form.questionType === 'reading-comprehension' && !form.passage?.trim()) return 'Vui lòng nhập đoạn văn'
    return null
  }

  const confirmDelete = async () => {
    if (!deletingId) return
    try {
      await api.delete(`/questions/${deletingId}`)
      toast.success('Đã xóa'); setShowDeleteDialog(false); fetchQuestions()
    } catch { toast.error('Lỗi') }
  }

  const downloadTemplate = async () => {
    try {
      const res = await api.get('/questions/template', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a'); link.href = url; link.setAttribute('download', 'questions_template.xlsx')
      document.body.appendChild(link); link.click(); link.remove()
    } catch { toast.error('Tải template thất bại') }
  }

  const onImportSelected = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0]; if (!file) return
    setImporting(true); setImportProgress({ total: 0, processed: 0, created: 0, updated: 0, errors: [] })
    try {
      const payload = new FormData(); payload.append('file', file)
      const res = await api.post('/questions/import', payload, { headers: { 'Content-Type': 'multipart/form-data' } })
      const { created = 0, updated = 0, errors = [] } = res.data || {}
      setImportProgress({ total: created + updated + errors.length, processed: created + updated + errors.length, created, updated, errors })
      if (errors.length === 0) { toast.success(`Import xong: ${created} mới`); fetchQuestions() }
      else { toast.error(`Import hoàn tất với ${errors.length} lỗi`) }
    } catch { toast.error('Lỗi import') }
    finally { setImporting(false); if (fileRef.current) fileRef.current.value = '' }
  }

  const openHistory = (q: QuestionItem) => {
    setHistoryQuestion(q); setShowHistory(true); fetchHistory(q._id, 1)
  }

  const fetchHistory = async (questionId: string, pageNum = 1) => {
    setHistoryLoading(true)
    try {
      const res = await api.get(`/questions/${questionId}/history`, { params: { page: pageNum, limit: 10 } })
      setHistoryItems(res.data?.items || []); setHistoryStats({ total: res.data?.total || 0, correct: res.data?.correct || 0 }); setHistoryTotalPages(res.data?.totalPages || 1); setHistoryPage(pageNum)
    } catch { toast.error('Lỗi tải lịch sử') }
    finally { setHistoryLoading(false) }
  }

  const openEdit = (q: QuestionItem) => {
    setEditing(q)
    setForm({ 
      level: q.level, questionType: q.questionType, question: q.question, 
      options: q.options || ['', ''], 
      correctAnswer: q.questionType === 'sentence-order' ? (q.correctOrder || []) : (q.correctAnswer !== undefined ? q.correctAnswer : 0), 
      explanation: q.explanation || '', passage: q.passage || '', sentences: q.sentences || [], subQuestions: q.subQuestions || []
    })
    setShowEditDialog(true)
  }

  const addOption = () => setForm(prev => ({ ...prev, options: [...prev.options, ''] }))
  const removeOption = (idx: number) => setForm(prev => {
    const newOptions = prev.options.filter((_, i) => i !== idx)
    let newCorrect = prev.correctAnswer
    if (Array.isArray(newCorrect)) {
      newCorrect = newCorrect.filter(i => i !== idx).map(i => i > idx ? i - 1 : i)
    } else if (typeof newCorrect === 'number') {
      newCorrect = newCorrect === idx ? 0 : (newCorrect > idx ? newCorrect - 1 : newCorrect)
    }
    return { ...prev, options: newOptions, correctAnswer: newCorrect }
  })

  const addSubQuestion = () => {
    setForm(prev => ({
      ...prev,
      subQuestions: [...(prev.subQuestions || []), { question: '', options: ['', '', '', ''], correctAnswer: 0 }]
    }))
  }

  const removeSubQuestion = (idx: number) => {
    setForm(prev => ({
      ...prev,
      subQuestions: prev.subQuestions?.filter((_, i) => i !== idx)
    }))
  }

  const renderFormFields = () => (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Trình độ HSK</Label>
          <Select value={form.level.toString()} onValueChange={v => setForm({ ...form, level: parseInt(v) })}>
            <SelectTrigger className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 font-bold"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-2xl">
              {levels.map(l => <SelectItem key={l._id} value={l.number.toString()}>HSK Level {l.number} ({l.name})</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Loại câu hỏi</Label>
          <Select value={form.questionType} onValueChange={v => setForm({ ...form, questionType: v as QuestionType, correctAnswer: v === 'sentence-order' ? [] : (v === 'fill-blank' ? '' : 0) })}>
            <SelectTrigger className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 font-bold"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="multiple-choice">Trắc nghiệm (Choice)</SelectItem>
              <SelectItem value="fill-blank">Điền từ (Fill)</SelectItem>
              <SelectItem value="reading-comprehension">Đọc hiểu (Reading)</SelectItem>
              <SelectItem value="sentence-order">Sắp xếp câu (Ordering)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Nội dung câu hỏi</Label>
        <Textarea rows={3} className="rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white font-bold p-6 text-lg" value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} placeholder="Nhập câu hỏi..." />
      </div>

      {form.questionType === 'reading-comprehension' && (
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Đoạn văn đọc hiểu</Label>
          <Textarea rows={6} className="rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white font-medium p-6 leading-relaxed" value={form.passage} onChange={e => setForm({ ...form, passage: e.target.value })} placeholder="Nhập đoạn văn tiếng Trung..." />
        </div>
      )}

      {form.questionType === 'multiple-choice' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Các phương án trả lời</Label>
            <span className="text-[9px] font-bold text-gray-400 italic">(Click vào chữ cái để chọn/bỏ chọn đáp án đúng)</span>
          </div>
          <div className="grid gap-3">
            {form.options.map((opt, oIdx) => {
              const isCorrect = Array.isArray(form.correctAnswer) 
                ? form.correctAnswer.includes(oIdx) 
                : form.correctAnswer === oIdx
              
              return (
                <div key={oIdx} className="flex items-center gap-3">
                  <button 
                    type="button" 
                    onClick={() => {
                      if (Array.isArray(form.correctAnswer)) {
                        const newCorrect = form.correctAnswer.includes(oIdx)
                          ? form.correctAnswer.filter(i => i !== oIdx)
                          : [...form.correctAnswer, oIdx]
                        setForm({ ...form, correctAnswer: newCorrect })
                      } else {
                        setForm({ ...form, correctAnswer: [oIdx] })
                      }
                    }} 
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all ${isCorrect ? 'chinese-gradient text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                    {String.fromCharCode(65 + oIdx)}
                  </button>
                  <Input value={opt} onChange={e => { const n = [...form.options]; n[oIdx] = e.target.value; setForm({ ...form, options: n }) }} className="h-12 rounded-xl" placeholder={`Đáp án ${String.fromCharCode(65 + oIdx)}...`} />
                  {form.options.length > 2 && <Button variant="ghost" size="icon" onClick={() => removeOption(oIdx)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></Button>}
                </div>
              )
            })}
            <Button variant="outline" onClick={addOption} className="h-12 rounded-xl border-dashed border-2 text-gray-400 font-bold hover:text-primary"><Plus className="w-4 h-4 mr-2" /> Thêm phương án</Button>
          </div>
        </div>
      )}

      {form.questionType === 'fill-blank' && (
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Đáp án chính xác</Label>
          <Input value={form.correctAnswer as string} onChange={e => setForm({ ...form, correctAnswer: e.target.value })} className="h-14 rounded-2xl bg-primary/5 border-primary/10 font-black text-xl text-primary" placeholder="Nhập đáp án đúng..." />
        </div>
      )}

      {form.questionType === 'reading-comprehension' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Danh sách câu hỏi con ({form.subQuestions?.length || 0})</Label>
            <Button size="sm" variant="ghost" onClick={addSubQuestion} className="text-primary font-black uppercase text-[10px]">
              <Plus className="w-3 h-3 mr-1" /> Thêm câu hỏi con
            </Button>
          </div>
          <div className="space-y-6">
            {form.subQuestions?.map((sq, sIdx) => (
              <div key={sIdx} className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 space-y-6 relative group/sub">
                <button type="button" onClick={() => removeSubQuestion(sIdx)} className="absolute -top-2 -right-2 w-8 h-8 bg-white border shadow-md rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors">
                  <X className="w-4 h-4" />
                </button>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-gray-400 flex items-center">
                    <span className="w-5 h-5 rounded bg-white border flex items-center justify-center mr-2 text-[10px] text-gray-900">{sIdx + 1}</span> Câu hỏi con
                  </Label>
                  <Input 
                    value={sq.question} 
                    onChange={e => {
                      const newSq = [...(form.subQuestions || [])]; newSq[sIdx].question = e.target.value; setForm({ ...form, subQuestions: newSq })
                    }}
                    className="bg-white rounded-xl font-bold"
                    placeholder="Nhập câu hỏi đọc hiểu..."
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {sq.options.map((o, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const newSq = [...(form.subQuestions || [])]; newSq[sIdx].correctAnswer = oIdx; setForm({ ...form, subQuestions: newSq })
                        }}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black transition-all ${
                          sq.correctAnswer === oIdx ? 'bg-green-500 text-white shadow-md' : 'bg-white text-gray-400 border'
                        }`}
                      >
                        {String.fromCharCode(65 + oIdx)}
                      </button>
                      <Input 
                        value={o} 
                        onChange={e => {
                          const newSq = [...(form.subQuestions || [])]; newSq[sIdx].options[oIdx] = e.target.value; setForm({ ...form, subQuestions: newSq })
                        }}
                        className="h-10 rounded-xl text-sm"
                        placeholder={`Đáp án ${String.fromCharCode(65 + oIdx)}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {form.questionType === 'sentence-order' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Danh sách các phần (Sentences)</Label>
            <Button size="sm" variant="ghost" onClick={() => setForm({ ...form, sentences: [...(form.sentences || []), ''] })} className="text-primary font-black uppercase text-[10px]">
              <Plus className="w-3 h-3 mr-1" /> Thêm phần mới
            </Button>
          </div>
          <div className="space-y-3">
            {form.sentences?.map((s, sIdx) => (
              <div key={sIdx} className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400">{sIdx + 1}</div>
                <Input 
                  value={s} 
                  onChange={e => {
                    const newS = [...(form.sentences || [])]; newS[sIdx] = e.target.value; setForm({ ...form, sentences: newS })
                  }}
                  className="bg-gray-50/50 rounded-xl"
                  placeholder="Nhập nội dung câu/từ..."
                />
                <Button variant="ghost" size="icon" onClick={() => setForm({ ...form, sentences: form.sentences?.filter((_, i) => i !== sIdx) })} className="text-gray-300 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="pt-4 space-y-3">
            <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Cấu hình thứ tự chính xác (Correct Order)</Label>
            <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-2xl border-2 border-dashed">
              {Array.isArray(form.correctAnswer) && (form.correctAnswer as number[]).map((val, idx) => (
                <div key={idx} className="flex items-center group">
                  <div className="bg-white px-3 py-2 rounded-xl border-2 border-primary font-black text-primary shadow-sm flex items-center">
                    {form.sentences?.[val] || `Item ${val + 1}`}
                    <button type="button" onClick={() => {
                      const newOrder = [...(form.correctAnswer as number[])]; newOrder.splice(idx, 1); setForm({ ...form, correctAnswer: newOrder })
                    }} className="ml-2 text-gray-300 hover:text-red-500"><X className="w-3 h-3" /></button>
                  </div>
                  {idx < (form.correctAnswer as number[]).length - 1 && <ChevronRight className="w-4 h-4 mx-1 text-gray-300" />}
                </div>
              ))}
              <div className="flex gap-1 flex-wrap">
                {form.sentences?.map((_, sIdx) => {
                  const isPicked = Array.isArray(form.correctAnswer) && (form.correctAnswer as number[]).includes(sIdx)
                  if (isPicked) return null
                  return (
                    <button 
                      key={sIdx}
                      type="button"
                      onClick={() => setForm({ ...form, correctAnswer: [...(Array.isArray(form.correctAnswer) ? form.correctAnswer : []), sIdx] })}
                      className="px-3 py-2 rounded-xl bg-white border text-xs font-bold text-gray-500 hover:border-primary hover:text-primary transition-all"
                    >
                      + {sIdx + 1}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Giải thích chi tiết</Label>
        <Textarea rows={3} className="rounded-2xl border-gray-100 bg-gray-50/50 p-6 text-sm font-medium italic" value={form.explanation} onChange={e => setForm({ ...form, explanation: e.target.value })} placeholder="Cung cấp lời giải giúp học viên hiểu bài tốt hơn..." />
      </div>
    </div>
  )

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center tracking-tight">
            <div className="w-10 h-10 chinese-gradient rounded-xl flex items-center justify-center text-white mr-4 shadow-lg"><TestTube className="w-6 h-6" /></div>
            Ngân hàng câu hỏi
          </h1>
          <p className="text-gray-500 font-medium">Quản lý hệ thống câu hỏi đa dạng theo chuẩn HSK.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={downloadTemplate} className="rounded-xl font-bold border-2 hover:bg-gray-50"><Download className="mr-2 h-4 w-4" /> Template</Button>
          <Button variant="outline" onClick={() => setShowImportDialog(true)} className="rounded-xl font-bold border-2 hover:bg-gray-50"><Upload className="mr-2 h-4 w-4" /> Import Excel</Button>
          <Button onClick={() => { resetForm(); setShowCreateDialog(true); }} className="chinese-gradient text-white h-11 px-6 rounded-xl font-black shadow-lg shadow-primary/20 transform hover:-translate-y-1 transition-all"><Plus className="mr-2 h-4 w-4" /> Thêm mới</Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl flex gap-6 items-center flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input placeholder="Tìm kiếm câu hỏi..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="h-12 pl-11 rounded-xl border-gray-50 bg-gray-50/50 focus:bg-white focus:border-primary transition-all font-bold" />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hiển thị</span>
            <Select value={pageSize.toString()} onValueChange={v => { setPageSize(parseInt(v)); setPage(1); }}>
              <SelectTrigger className="w-24 h-10 rounded-xl border-none bg-gray-50 font-black text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl shadow-2xl border-none">
                <SelectItem value="10">10 / Trang</SelectItem>
                <SelectItem value="20">20 / Trang</SelectItem>
                <SelectItem value="50">50 / Trang</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="bg-gray-100 p-1 rounded-xl flex">
            <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="icon" onClick={() => setViewMode('grid')} className="w-8 h-8 rounded-lg"><Grid3X3 className="w-4 h-4" /></Button>
            <Button variant={viewMode === 'table' ? 'default' : 'ghost'} size="icon" onClick={() => setViewMode('table')} className="w-8 h-8 rounded-lg"><TableIcon className="w-4 h-4" /></Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12 text-center"><Loader2 className="animate-spin text-primary mx-auto w-10 h-10" /></div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map(q => (
            <div key={q._id} className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <Badge className="bg-primary/5 text-primary border-none rounded-lg font-black text-[10px] px-2.5 py-1">HSK {q.level}</Badge>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" onClick={() => openHistory(q)} className="w-8 h-8 rounded-lg hover:bg-amber-50 hover:text-amber-600"><Clock className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(q)} className="w-8 h-8 rounded-lg hover:bg-blue-50 hover:text-blue-600"><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => { setDeletingId(q._id); setShowDeleteDialog(true); }} className="w-8 h-8 rounded-lg hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
              <div className="flex-1 space-y-4">
                <span className="text-[10px] font-black uppercase text-gray-300 tracking-widest">{q.questionType.replace('-', ' ')}</span>
                <p className="font-bold text-gray-900 leading-relaxed line-clamp-3 text-lg">{q.question}</p>
                {q.passage && <p className="text-[10px] text-gray-400 font-medium italic line-clamp-2">"{q.passage}"</p>}
              </div>
              <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400">{q.createdAt ? new Date(q.createdAt).toLocaleDateString() : 'N/A'}</span>
                <button onClick={() => openEdit(q)} className="text-[10px] font-black uppercase text-primary tracking-widest hover:underline">Chi tiết &rarr;</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-xl">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Câu hỏi</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Loại</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Trình độ</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(q => (
                <tr key={q._id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <p className="text-sm font-black text-gray-900 line-clamp-1">{q.question}</p>
                    {q.passage && <p className="text-[10px] text-gray-400 italic mt-1 line-clamp-1 max-w-[400px]">"{q.passage}"</p>}
                  </td>
                  <td className="px-8 py-6"><span className="text-[10px] font-black uppercase text-gray-400 bg-gray-100 px-2 py-1 rounded-md">{q.questionType.replace('-', ' ')}</span></td>
                  <td className="px-8 py-6 text-center"><Badge className="bg-primary/5 text-primary border-none rounded-lg font-black text-[10px]">HSK {q.level}</Badge></td>
                  <td className="px-8 py-6 text-right space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => openHistory(q)} className="h-9 rounded-xl hover:bg-amber-50 hover:text-amber-600"><Clock className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(q)} className="h-9 rounded-xl hover:bg-blue-50 hover:text-blue-600"><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => { setDeletingId(q._id); setShowDeleteDialog(true); }} className="h-9 rounded-xl hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-between items-center pt-4">
        <span className="text-sm text-gray-400 font-bold">Tổng số: {total} câu hỏi</span>
        <div className="flex items-center gap-4">
          <Button variant="ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="rounded-xl font-bold">Trước</Button>
          <span className="bg-white px-6 py-2 rounded-2xl border font-black text-sm">Trang {page} / {totalPages}</span>
          <Button variant="ghost" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="rounded-xl font-bold">Tiếp</Button>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="rounded-[2.5rem] p-10 max-w-4xl max-h-[90vh] overflow-y-auto border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black">Tạo câu hỏi mới</DialogTitle>
            <DialogDescription className="font-medium text-gray-500">Thiết lập câu hỏi HSK mới cho hệ thống khảo thí.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="pt-6">
            {renderFormFields()}
            <div className="flex gap-4 mt-10 pt-8 border-t">
              <Button type="button" variant="ghost" onClick={() => setShowCreateDialog(false)} className="flex-1 h-14 rounded-2xl font-bold text-gray-400">Hủy bỏ</Button>
              <Button type="submit" disabled={formLoading} className="flex-[2] h-14 chinese-gradient text-white rounded-2xl font-black shadow-xl shadow-primary/20">
                {formLoading ? <Loader2 className="animate-spin" /> : 'Lưu câu hỏi'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="rounded-[2.5rem] p-10 max-w-4xl max-h-[90vh] overflow-y-auto border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black">Hiệu chỉnh câu hỏi</DialogTitle>
            <DialogDescription className="font-medium text-gray-500">Cập nhật nội dung hoặc thay đổi cấu hình đáp án.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="pt-6">
            {renderFormFields()}
            <div className="flex gap-4 mt-10 pt-8 border-t">
              <Button type="button" variant="ghost" onClick={() => setShowEditDialog(false)} className="flex-1 h-14 rounded-2xl font-bold text-gray-400">Hủy bỏ</Button>
              <Button type="submit" disabled={formLoading} className="flex-[2] h-14 chinese-gradient text-white rounded-2xl font-black shadow-xl shadow-primary/20">
                {formLoading ? <Loader2 className="animate-spin" /> : 'Cập nhật nội dung'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-4xl rounded-[3rem] p-10 h-[85vh] flex flex-col border-none shadow-2xl overflow-hidden">
           <DialogHeader className="mb-6">
              <div className="flex items-center gap-4 mb-2">
                 <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shadow-sm"><Clock className="w-6 h-6" /></div>
                 <div>
                    <DialogTitle className="text-2xl font-black">Lịch sử bài làm</DialogTitle>
                    <DialogDescription className="font-medium text-gray-500">Phân tích hiệu suất câu hỏi.</DialogDescription>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                 <div className="bg-green-50 p-4 rounded-2xl border border-green-100 text-center">
                    <p className="text-[10px] font-black text-green-600 uppercase mb-1">Tỷ lệ chính xác</p>
                    <p className="text-2xl font-black text-green-700">{historyStats.total > 0 ? Math.round((historyStats.correct / historyStats.total) * 100) : 0}%</p>
                 </div>
                 <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Tổng lượt làm</p>
                    <p className="text-2xl font-black text-gray-900">{historyStats.total}</p>
                 </div>
              </div>
           </DialogHeader>
           <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              {historyLoading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary w-10 h-10" /></div> : 
               historyItems.length === 0 ? <div className="text-center py-20 text-gray-400 font-bold italic">Chưa có dữ liệu.</div> : 
               historyItems.map((h, i) => (
                <div key={i} className="flex justify-between items-center p-5 bg-white rounded-[1.5rem] border border-gray-100 hover:shadow-md transition-shadow">
                   <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-black ${h.correct ? 'bg-green-500' : 'bg-red-500 shadow-lg shadow-red-100'}`}>
                         {h.correct ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
                      </div>
                      <div>
                         <p className="font-bold text-gray-900">{h.user?.name || 'Ẩn danh'}</p>
                         <p className="text-[10px] text-gray-400 font-medium uppercase">{h.user?.email || 'No email'}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-xs font-black text-gray-900">{new Date(h.attemptedAt).toLocaleDateString('vi-VN')}</p>
                      <p className="text-[10px] text-gray-400 font-medium uppercase">{new Date(h.attemptedAt).toLocaleTimeString('vi-VN')}</p>
                   </div>
                </div>
              ))}
           </div>
           <DialogFooter className="mt-6 border-t pt-6"><Button onClick={() => setShowHistory(false)} className="w-full h-12 rounded-xl font-bold bg-gray-900 text-white">Đóng cửa sổ</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="rounded-[2.5rem] p-10 max-w-lg border-none shadow-2xl">
          <DialogHeader className="text-center space-y-4 mb-8">
             <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto shadow-lg text-blue-500"><FileSpreadsheet className="w-8 h-8" /></div>
             <DialogTitle className="text-3xl font-black text-gray-900">Import dữ liệu</DialogTitle>
             <DialogDescription className="font-medium text-gray-500">Tải lên tệp Excel chứa danh sách câu hỏi.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {!importProgress ? (
              <div onClick={() => fileRef.current?.click()} className="aspect-video rounded-[2.5rem] border-2 border-dashed border-gray-100 bg-gray-50/50 hover:border-primary/30 flex flex-col items-center justify-center cursor-pointer transition-all">
                {importing ? <Loader2 className="w-10 h-10 animate-spin text-primary" /> : <><Upload className="w-10 h-10 text-gray-300 mb-4" /><p className="text-sm font-black text-gray-900">Chọn tệp Excel (.xlsx, .xls)</p></>}
              </div>
            ) : (
              <div className="space-y-6 text-center">
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-green-50 p-4 rounded-2xl border border-green-100"><p className="text-[10px] font-black text-green-600 uppercase mb-1">Thành công</p><p className="text-2xl font-black text-green-700">{importProgress.created + importProgress.updated}</p></div>
                   <div className="bg-red-50 p-4 rounded-2xl border border-red-100"><p className="text-[10px] font-black text-red-600 uppercase mb-1">Lỗi</p><p className="text-2xl font-black text-red-700">{importProgress.errors.length}</p></div>
                </div>
                <Button variant="ghost" onClick={() => { setShowImportDialog(false); setImportProgress(null); }} className="w-full h-12 rounded-xl font-bold">Hoàn tất</Button>
              </div>
            )}
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onImportSelected} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="rounded-[2.5rem] p-10 text-center border-none shadow-2xl max-w-sm">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500"><Trash2 className="w-8 h-8" /></div>
          <DialogHeader><DialogTitle className="text-2xl font-black">Xác nhận xóa?</DialogTitle><DialogDescription className="font-medium">Câu hỏi sẽ bị gỡ bỏ vĩnh viễn.</DialogDescription></DialogHeader>
          <div className="flex flex-col gap-3 mt-8">
            <Button onClick={confirmDelete} className="h-12 rounded-xl font-black text-white bg-red-500 hover:bg-red-600 shadow-lg">Xác nhận xóa</Button>
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)} className="h-12 rounded-xl font-bold text-gray-400">Hủy bỏ</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}