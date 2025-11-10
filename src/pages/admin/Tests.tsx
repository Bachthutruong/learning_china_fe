import { useEffect, useRef, useState } from 'react'
import { Card, CardContent } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Plus, Edit, Trash2, Loader2, Download, Upload, CheckCircle, AlertCircle, FileSpreadsheet, BookOpen } from 'lucide-react'
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
  subQuestions?: Array<{
    question: string
    options: string[]
    correctAnswer: number
  }>
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
  const [loading, setLoading] = useState<boolean>(true)
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [total, setTotal] = useState<number>(0)
  const [showCreate, setShowCreate] = useState<boolean>(false)
  const [showEdit, setShowEdit] = useState<boolean>(false)
  const [showDelete, setShowDelete] = useState<boolean>(false)
  const [formLoading, setFormLoading] = useState<boolean>(false)
  const [editing, setEditing] = useState<QuestionItem | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [importing, setImporting] = useState<boolean>(false)
  const [showImportDialog, setShowImportDialog] = useState<boolean>(false)
  const [importProgress, setImportProgress] = useState<{
    total: number
    processed: number
    created: number
    updated: number
    errors: Array<{ row: number; message: string }>
  } | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [levels, setLevels] = useState<Array<{ _id: string; number: number; name: string }>>([])
  // History dialog state
  const [showHistory, setShowHistory] = useState<boolean>(false)
  const [historyLoading, setHistoryLoading] = useState<boolean>(false)
  const [historyPage, setHistoryPage] = useState<number>(1)
  const [historyTotalPages, setHistoryTotalPages] = useState<number>(1)
  const [historyQuestion, setHistoryQuestion] = useState<QuestionItem | null>(null)
  const [historyStats, setHistoryStats] = useState<{ total: number; correct: number }>({ total: 0, correct: 0 })
  const [historyItems, setHistoryItems] = useState<Array<any>>([])
  const [form, setForm] = useState<QuestionFormData>({
    level: 1,
    questionType: 'multiple-choice',
    question: '',
    options: ['', ''],
    correctAnswer: 0,
    explanation: ''
  })

  useEffect(() => {
    fetchQuestions()
    fetchLevels()
  }, [])

  useEffect(() => {
    fetchQuestions()
  }, [page, pageSize])

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      const res = await api.get('/questions', { params: { page, limit: pageSize } })
      const data = res.data?.items || []
      setItems(data)
      setTotalPages(res.data?.totalPages || 1)
      setTotal(res.data?.total || data.length)
    } catch (e: any) {
      setItems([])
      toast.error(e?.response?.data?.message || 'Không tải được ngân hàng câu hỏi')
    } finally {
      setLoading(false)
    }
  }

  const fetchLevels = async () => {
    try {
      const res = await api.get('/admin/levels')
      const data = res.data?.levels || res.data || []
      setLevels(data.map((l: any) => ({ _id: l._id, number: l.number ?? l.level, name: l.name })))
    } catch {
      setLevels([])
    }
  }

  const resetForm = () => {
    setForm({ 
      level: 1, 
      questionType: 'multiple-choice', 
      question: '', 
      options: ['', ''], 
      correctAnswer: 0, 
      explanation: '',
      passage: '',
      sentences: [],
      blanks: [],
      subQuestions: []
    })
  }

  const openCreate = () => { resetForm(); setShowCreate(true) }

  const downloadTemplate = async () => {
    try {
      const res = await api.get('/questions/template', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'questions_template.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch {
      toast.error('Tải template thất bại')
    }
  }

  const triggerImport = () => {
    setShowImportDialog(true)
    setImportProgress(null)
  }
  
  const onImportSelected = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0]
    if (!file) return
    
    setImporting(true)
    setImportProgress({ total: 0, processed: 0, created: 0, updated: 0, errors: [] })
    
    try {
      const form = new FormData()
      form.append('file', file)
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setImportProgress(prev => prev ? { ...prev, processed: Math.min(prev.processed + 1, prev.total) } : null)
      }, 100)
      
      const res = await api.post('/questions/import', form, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      })
      
      clearInterval(progressInterval)
      
      const { created = 0, updated = 0, errors = [] } = res.data || {}
      
      setImportProgress({
        total: created + updated + errors.length,
        processed: created + updated + errors.length,
        created,
        updated,
        errors
      })
      
      if (errors.length === 0) {
        toast.success(`Import thành công: +${created} mới, cập nhật ${updated}`)
        fetchQuestions()
      } else {
        toast.error(`Import hoàn tất với ${errors.length} lỗi: +${created} mới, cập nhật ${updated}`)
      }
    } catch (e: any) {
      setImportProgress(prev => prev ? { ...prev, errors: [{ row: 0, message: e?.response?.data?.message || 'Import thất bại' }] } : null)
      toast.error(e?.response?.data?.message || 'Import thất bại')
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const openEdit = (q: QuestionItem) => {
    setEditing(q)
    const correct = (q as any).correctAnswer
    const correctOrder = (q as any).correctOrder
    const sentences = (q as any).sentences || []
    const passage = (q as any).passage || ''
    
    // Determine correct answer based on question type
    let correctAnswerValue: any
    if (q.questionType === 'fill-blank') {
      correctAnswerValue = correct || ''
    } else if (q.questionType === 'sentence-order') {
      correctAnswerValue = correctOrder || []
    } else {
      correctAnswerValue = correct !== undefined ? correct : 0
    }
    
    setForm({ 
      level: q.level, 
      questionType: q.questionType, 
      question: q.question, 
      options: q.options || ['', ''], 
      correctAnswer: correctAnswerValue, 
      explanation: q.explanation || '',
      passage: passage,
      sentences: sentences,
      blanks: (q as any).blanks || [],
      subQuestions: (q as any).subQuestions || []
    })
    setShowEdit(true)
  }

  const openHistory = async (q: QuestionItem) => {
    setHistoryQuestion(q)
    setShowHistory(true)
    setHistoryPage(1)
    await fetchHistory(q._id, 1)
  }

  const fetchHistory = async (questionId: string, pageNum = historyPage) => {
    try {
      setHistoryLoading(true)
      const res = await api.get(`/questions/${questionId}/history`, { params: { page: pageNum, limit: 10 } })
      setHistoryItems(res.data?.items || [])
      setHistoryStats({ total: res.data?.total || 0, correct: res.data?.correct || 0 })
      setHistoryTotalPages(res.data?.totalPages || 1)
    } catch (e: any) {
      setHistoryItems([])
      setHistoryStats({ total: 0, correct: 0 })
      toast.error(e?.response?.data?.message || 'Không lấy được lịch sử')
    } finally {
      setHistoryLoading(false)
    }
  }

  const validateForm = (): string | null => {
    if (!form.question.trim()) return 'Vui lòng nhập nội dung câu hỏi'
    if (!form.level) return 'Cấp độ không hợp lệ'
    
    if (form.questionType === 'multiple-choice') {
      const nonEmpty = form.options.map(o => o.trim()).filter(Boolean)
      if (nonEmpty.length < 2) return 'Cần ít nhất 2 đáp án'
      
      // Kiểm tra đáp án đúng
      if (Array.isArray(form.correctAnswer)) {
        if (form.correctAnswer.length === 0) return 'Chưa chọn đáp án đúng'
        if (form.correctAnswer.some((idx: any) => typeof idx !== 'number' || idx < 0 || idx >= form.options.length)) return 'Đáp án đúng không hợp lệ'
        const correctTexts = form.correctAnswer.map((idx: number) => form.options[idx]?.trim()).filter(Boolean)
        if (correctTexts.length !== form.correctAnswer.length) return 'Đáp án đúng không được để trống'
      } else if (typeof form.correctAnswer === 'number') {
        if (form.correctAnswer < 0 || form.correctAnswer >= form.options.length) {
          return 'Chưa chọn đáp án đúng'
        }
        const correctText = form.options[form.correctAnswer]?.trim()
        if (!correctText) return 'Đáp án đúng không được để trống'
      }
      
      // Kiểm tra không có đáp án trùng lặp
      const uniqueOptions = [...new Set(nonEmpty)]
      if (uniqueOptions.length !== nonEmpty.length) return 'Không được có đáp án trùng lặp'
    }
    
    if (form.questionType === 'reading-comprehension') {
      if (!form.passage?.trim()) return 'Vui lòng nhập đoạn văn cho câu hỏi đọc hiểu'
      if (!form.subQuestions || form.subQuestions.length === 0) return 'Vui lòng thêm ít nhất 1 câu hỏi đọc hiểu'
      for (let i = 0; i < form.subQuestions.length; i++) {
        const subQ = form.subQuestions[i]
        if (!subQ.question.trim()) return `Vui lòng nhập câu hỏi ${i + 1}`
        if (!subQ.options || subQ.options.length < 2) return `Câu hỏi ${i + 1} cần ít nhất 2 đáp án`
        if (subQ.correctAnswer < 0 || subQ.correctAnswer >= subQ.options.length) return `Câu hỏi ${i + 1} chưa chọn đáp án đúng`
      }
    }
    
    if (form.questionType === 'sentence-order') {
      if (!form.sentences || form.sentences.length < 2) return 'Cần ít nhất 2 câu/từ để sắp xếp'
      if (!Array.isArray(form.correctAnswer) || form.correctAnswer.length === 0) return 'Vui lòng nhập thứ tự đúng'
      if (form.correctAnswer.some((idx: number) => idx < 0 || idx >= (form.sentences?.length || 0))) return 'Thứ tự đúng không hợp lệ'
    }
    
    if (form.questionType === 'fill-blank') {
      if (!form.correctAnswer || (typeof form.correctAnswer === 'string' && !form.correctAnswer.trim())) {
        return 'Vui lòng nhập đáp án đúng cho câu hỏi điền từ'
      }
    }
    
    return null
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validateForm()
    if (err) return toast.error(err)
    try {
      setFormLoading(true)
      const payload: any = { level: form.level, questionType: form.questionType, question: form.question, explanation: form.explanation }
      
      if (form.questionType === 'multiple-choice' || form.questionType === 'reading-comprehension') {
        payload.options = form.options
        payload.correctAnswer = form.correctAnswer
      }
      
      if (form.questionType === 'reading-comprehension') {
        payload.passage = form.passage
        payload.subQuestions = form.subQuestions
      }
      
      if (form.questionType === 'sentence-order') {
        payload.sentences = form.sentences
        payload.correctOrder = form.correctAnswer
      }
      
      if (form.questionType === 'fill-blank') {
        payload.correctAnswer = form.correctAnswer
      }
      
      await api.post('/questions', payload)
      toast.success('Tạo câu hỏi thành công')
      setShowCreate(false)
      resetForm()
      fetchQuestions()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Không thể tạo câu hỏi')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    const err = validateForm()
    if (err) return toast.error(err)
    try {
      setFormLoading(true)
      const payload: any = { level: form.level, questionType: form.questionType, question: form.question, explanation: form.explanation }
      
      if (form.questionType === 'multiple-choice' || form.questionType === 'reading-comprehension') {
        payload.options = form.options
        payload.correctAnswer = form.correctAnswer
      }
      
      if (form.questionType === 'reading-comprehension') {
        payload.passage = form.passage
        payload.subQuestions = form.subQuestions
      }
      
      if (form.questionType === 'sentence-order') {
        payload.sentences = form.sentences
        payload.correctOrder = form.correctAnswer
      }
      
      if (form.questionType === 'fill-blank') {
        payload.correctAnswer = form.correctAnswer
      }
      
      await api.put(`/questions/${editing._id}`, payload)
      toast.success('Cập nhật câu hỏi thành công')
      setShowEdit(false)
      setEditing(null)
      resetForm()
      fetchQuestions()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Không thể cập nhật câu hỏi')
    } finally {
      setFormLoading(false)
    }
  }

  const askDelete = (id: string) => { setDeletingId(id); setShowDelete(true) }

  const confirmDelete = async () => {
    if (!deletingId) return
    try {
      await api.delete(`/questions/${deletingId}`)
      toast.success('Đã xóa câu hỏi')
      setShowDelete(false)
      setDeletingId(null)
      fetchQuestions()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Không thể xóa câu hỏi')
    }
  }

  const addOption = () => setForm(prev => ({ ...prev, options: [...prev.options, ''] }))
  const removeOption = (idx: number) => setForm(prev => {
    const newOptions = prev.options.filter((_, i) => i !== idx)
    let newCorrectAnswer: number | number[] | string = prev.correctAnswer
    
    if (Array.isArray(prev.correctAnswer)) {
      newCorrectAnswer = prev.correctAnswer
        .filter((v: number) => v !== idx)
        .map((v: number) => v > idx ? v - 1 : v)
    } else if (typeof prev.correctAnswer === 'number') {
      if (prev.correctAnswer === idx) {
        newCorrectAnswer = 0 // Reset to first option
      } else if (prev.correctAnswer > idx) {
        newCorrectAnswer = prev.correctAnswer - 1
      }
    }
    // For string type (fill-blank), keep as is
    
    return {
      ...prev,
      options: newOptions,
      correctAnswer: newCorrectAnswer
    }
  })

  if (showCreate) {
    return (
      <div className="space-y-6 max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tạo câu hỏi</h1>
            <p className="text-gray-600">Nhập nội dung và cấu hình câu hỏi</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Quay lại</Button>
            <Button onClick={handleCreate} disabled={formLoading} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              {formLoading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang lưu...</>) : 'Lưu câu hỏi'}
            </Button>
          </div>
        </div>

        <Card className="max-w-3xl">
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cấp độ *</Label>
                <select className="w-full border rounded px-3 py-2" value={form.level} onChange={(e) => setForm(p => ({ ...p, level: parseFloat(e.target.value) }))}>
                  {levels.map(l => (
                    <option key={l._id} value={l.number}>Cấp {l.number} - {l.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Loại câu hỏi</Label>
                <select className="w-full border rounded px-3 py-2" value={form.questionType} onChange={(e) => setForm(p => ({ ...p, questionType: e.target.value as QuestionType }))}>
                  <option value="multiple-choice">Trắc nghiệm</option>
                  <option value="fill-blank">Điền từ</option>
                  <option value="reading-comprehension">Đọc hiểu</option>
                  <option value="sentence-order">Sắp xếp câu</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nội dung *</Label>
              <Textarea rows={3} value={form.question} onChange={(e) => setForm(p => ({ ...p, question: e.target.value }))} />
            </div>
            {form.questionType === 'multiple-choice' && (
              <div className="space-y-2">
                <Label>Đáp án *</Label>
                <div className="space-y-3">
                  {form.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={Array.isArray(form.correctAnswer) ? form.correctAnswer.includes(oIdx) : form.correctAnswer === oIdx} 
                          onChange={(e) => {
                            if (e.target.checked) {
                              if (Array.isArray(form.correctAnswer)) {
                                setForm(p => ({ ...p, correctAnswer: [...(p.correctAnswer as number[]), oIdx] }))
                              } else {
                                setForm(p => ({ ...p, correctAnswer: [p.correctAnswer as number, oIdx] }))
                              }
                            } else {
                              if (Array.isArray(form.correctAnswer)) {
                                setForm(p => ({ ...p, correctAnswer: (p.correctAnswer as number[]).filter((v: number) => v !== oIdx) }))
                              } else {
                                setForm(p => ({ ...p, correctAnswer: 0 }))
                              }
                            }
                          }}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm font-medium text-gray-600">
                          {Array.isArray(form.correctAnswer) ? 
                            (form.correctAnswer.includes(oIdx) ? '✓ Đáp án đúng' : 'Chọn làm đáp án đúng') :
                            (form.correctAnswer === oIdx ? '✓ Đáp án đúng' : 'Chọn làm đáp án đúng')
                          }
                        </span>
                      </div>
                      <Input 
                        value={opt} 
                        onChange={(e) => { 
                          const options = [...form.options]; 
                          options[oIdx] = e.target.value; 
                          setForm(p => ({ ...p, options })) 
                        }} 
                        placeholder={`Đáp án ${String.fromCharCode(65 + oIdx)}`}
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => removeOption(oIdx)}
                        disabled={form.options.length <= 2}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={addOption}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Thêm đáp án
                  </Button>
                  {Array.isArray(form.correctAnswer) ? (
                    form.correctAnswer.length > 0 ? (
                      <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                        ✓ Đã chọn {form.correctAnswer.length} đáp án đúng: {(form.correctAnswer as number[]).map(idx => form.options[idx]).join(', ')}
                      </div>
                    ) : (
                      <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        ⚠️ Chưa chọn đáp án đúng
                      </div>
                    )
                  ) : (
                    typeof form.correctAnswer === 'number' ? (
                      <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                        ✓ Đã chọn đáp án đúng: {form.options[form.correctAnswer]}
                      </div>
                    ) : (
                      <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        ⚠️ Chưa chọn đáp án đúng
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
            
            {/* Fill Blank Question */}
            {form.questionType === 'fill-blank' && (
              <div className="space-y-2">
                <Label>Đáp án đúng *</Label>
                <Input 
                  value={form.correctAnswer as string} 
                  onChange={(e) => setForm(p => ({ ...p, correctAnswer: e.target.value }))} 
                  placeholder="Nhập đáp án đúng"
                />
              </div>
            )}

            {/* Sentence Order Question */}
            {form.questionType === 'sentence-order' && (
              <div className="space-y-2">
                <Label>Các câu/từ cần sắp xếp *</Label>
                <div className="space-y-2">
                  {form.sentences?.map((sentence, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600 w-8">{idx + 1}.</span>
                      <Input 
                        value={sentence} 
                        onChange={(e) => {
                          const sentences = [...(form.sentences || [])];
                          sentences[idx] = e.target.value;
                          setForm(p => ({ ...p, sentences }));
                        }} 
                        placeholder={`Câu/từ ${idx + 1}`}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const sentences = form.sentences?.filter((_, i) => i !== idx) || [];
                          setForm(p => ({ ...p, sentences }));
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={() => setForm(p => ({ ...p, sentences: [...(p.sentences || []), ''] }))}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Thêm câu/từ
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Thứ tự đúng *</Label>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600 mb-2">
                      Kéo thả để sắp xếp thứ tự đúng (hoặc click để chọn):
                    </div>
                    <div className="space-y-2">
                      {form.sentences?.map((sentence, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 border rounded-lg">
                          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                            {Array.isArray(form.correctAnswer) ? (form.correctAnswer as number[]).indexOf(idx) + 1 : '?'}
                          </div>
                          <div className="flex-1 text-sm">{sentence}</div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (!Array.isArray(form.correctAnswer)) {
                                setForm(p => ({ ...p, correctAnswer: [idx] }));
                              } else if (form.correctAnswer.includes(idx)) {
                                setForm(p => ({ ...p, correctAnswer: (p.correctAnswer as number[]).filter((i: number) => i !== idx) }));
                              } else {
                                setForm(p => ({ ...p, correctAnswer: [...(p.correctAnswer as number[]), idx] }));
                              }
                            }}
                            className={Array.isArray(form.correctAnswer) && form.correctAnswer.includes(idx) ? 'bg-blue-500 text-white' : ''}
                          >
                            {Array.isArray(form.correctAnswer) && form.correctAnswer.includes(idx) ? 'Đã chọn' : 'Chọn'}
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500">
                      Thứ tự hiện tại: {Array.isArray(form.correctAnswer) ? `[${(form.correctAnswer as number[]).join(', ')}]` : 'Chưa chọn'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Reading Comprehension Question */}
            {form.questionType === 'reading-comprehension' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Đoạn văn *</Label>
                  <Textarea 
                    rows={6} 
                    value={form.passage || ''} 
                    onChange={(e) => setForm(p => ({ ...p, passage: e.target.value }))} 
                    placeholder="Nhập đoạn văn cần đọc hiểu..."
                    className="text-sm"
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Câu hỏi đọc hiểu:</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newQuestions = [...(form.subQuestions || []), {
                          question: '',
                          options: ['', ''],
                          correctAnswer: 0
                        }]
                        setForm(p => ({ ...p, subQuestions: newQuestions }))
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Thêm câu hỏi
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {(form.subQuestions || []).map((subQ: any, qIdx: number) => (
                      <div key={qIdx} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-gray-700">Câu hỏi {qIdx + 1}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newQuestions = (form.subQuestions || []).filter((_: any, i: number) => i !== qIdx)
                              setForm(p => ({ ...p, subQuestions: newQuestions }))
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <Label>Câu hỏi *</Label>
                            <Input
                              value={subQ.question}
                              onChange={(e) => {
                                const newQuestions = [...(form.subQuestions || [])]
                                newQuestions[qIdx].question = e.target.value
                                setForm(p => ({ ...p, subQuestions: newQuestions }))
                              }}
                              placeholder="Nhập câu hỏi..."
                            />
                          </div>
                          
                          <div>
                            <Label>Đáp án *</Label>
                            <div className="space-y-2">
                              {subQ.options.map((opt: string, oIdx: number) => (
                                <div key={oIdx} className="flex items-center gap-3">
                                  <input
                                    type="radio"
                                    name={`subQ_${qIdx}`}
                                    checked={subQ.correctAnswer === oIdx}
                                    onChange={() => {
                                      const newQuestions = [...(form.subQuestions || [])]
                                      newQuestions[qIdx].correctAnswer = oIdx
                                      setForm(p => ({ ...p, subQuestions: newQuestions }))
                                    }}
                                    className="w-4 h-4 text-blue-600"
                                  />
                                  <Input
                                    value={opt}
                                    onChange={(e) => {
                                      const newQuestions = [...(form.subQuestions || [])]
                                      newQuestions[qIdx].options[oIdx] = e.target.value
                                      setForm(p => ({ ...p, subQuestions: newQuestions }))
                                    }}
                                    placeholder={`Đáp án ${String.fromCharCode(65 + oIdx)}`}
                                    className="flex-1"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const newQuestions = [...(form.subQuestions || [])]
                                      newQuestions[qIdx].options = newQuestions[qIdx].options.filter((_: string, i: number) => i !== oIdx)
                                      if (newQuestions[qIdx].correctAnswer >= oIdx) {
                                        newQuestions[qIdx].correctAnswer = Math.max(0, newQuestions[qIdx].correctAnswer - 1)
                                      }
                                      setForm(p => ({ ...p, subQuestions: newQuestions }))
                                    }}
                                    disabled={subQ.options.length <= 2}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  const newQuestions = [...(form.subQuestions || [])]
                                  newQuestions[qIdx].options = [...newQuestions[qIdx].options, '']
                                  setForm(p => ({ ...p, subQuestions: newQuestions }))
                                }}
                                className="w-full"
                              >
                                <Plus className="h-4 w-4 mr-2" /> Thêm đáp án
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {(!form.subQuestions || form.subQuestions.length === 0) && (
                      <div className="text-center py-8 text-gray-500">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Chưa có câu hỏi nào. Click "Thêm câu hỏi" để bắt đầu.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Giải thích</Label>
              <Textarea rows={2} value={form.explanation} onChange={(e) => setForm(p => ({ ...p, explanation: e.target.value }))} />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ngân hàng câu hỏi</h1>
          <p className="text-gray-600">Quản lý câu hỏi theo cấp độ</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Tải template
          </Button>
          <Button variant="outline" onClick={triggerImport} disabled={importing}>
            <Upload className="mr-2 h-4 w-4" />
            {importing ? 'Đang import...' : 'Import Excel'}
          </Button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onImportSelected} />
          <Button onClick={openCreate} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <Plus className="mr-2 h-4 w-4" /> Thêm câu hỏi
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span>Hiển thị</span>
          <select className="border rounded px-2 py-1" value={pageSize} onChange={(e) => { setPage(1); setPageSize(parseInt(e.target.value) || 10) }}>
            {[5, 10, 20, 50].map(sz => (
              <option key={sz} value={sz}>{sz}</option>
            ))}
          </select>
          <span>mỗi trang</span>
        </div>
        <div className="text-sm text-gray-600">Tổng: {total}</div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-gray-500">Đang tải...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3 w-16">#</th>
                    <th className="text-left px-4 py-3">Câu hỏi</th>
                    <th className="text-left px-4 py-3">Loại</th>
                    <th className="text-left px-4 py-3">Cấp</th>
                    <th className="text-left px-4 py-3 w-24">Đáp án</th>
                    <th className="text-right px-4 py-3 w-32">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((q, idx) => (
                    <tr key={q._id} className="border-t">
                      <td className="px-4 py-3">{(page - 1) * pageSize + idx + 1}</td>
                      <td className="px-4 py-3 max-w-[520px]"><div className="line-clamp-2">{q.question}</div></td>
                      <td className="px-4 py-3">{q.questionType}</td>
                      <td className="px-4 py-3"><Badge variant="secondary">Cấp {q.level}</Badge></td>
                      <td className="px-4 py-3">
                        {q.questionType === 'multiple-choice' && q.options ? (
                          <div className="text-sm">
                            <div>{q.options.length} đáp án</div>
                            {(q as any).correctAnswer !== undefined && (
                              <div className="text-green-600 text-xs">
                                ✓ Đúng: {Array.isArray((q as any).correctAnswer) 
                                  ? (q as any).correctAnswer.map((idx: number) => q.options?.[idx]).join(', ')
                                  : typeof (q as any).correctAnswer === 'number' ? q.options?.[(q as any).correctAnswer] : (q as any).correctAnswer
                                }
                              </div>
                            )}
                          </div>
                        ) : q.questionType === 'fill-blank' ? (
                          <div className="text-sm text-blue-600">
                            ✓ Đáp án: {(q as any).correctAnswer || 'Chưa có'}
                          </div>
                        ) : q.questionType === 'sentence-order' ? (
                          <div className="text-sm text-purple-600">
                            ✓ Thứ tự: {Array.isArray((q as any).correctOrder) 
                              ? `[${(q as any).correctOrder.join(', ')}]` 
                              : 'Chưa có'
                            }
                          </div>
                        ) : q.questionType === 'reading-comprehension' ? (
                          <div className="text-sm text-orange-600">
                            ✓ Đọc hiểu: {(q as any).passage ? 'Có đoạn văn' : 'Chưa có đoạn văn'}
                            {(q as any).subQuestions && (q as any).subQuestions.length > 0 && (
                              <div className="text-xs">+ {(q as any).subQuestions.length} câu hỏi con</div>
                            )}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openHistory(q)}>Lịch sử</Button>
                          <Button size="sm" variant="outline" onClick={() => openEdit(q)}><Edit className="h-4 w-4" /></Button>
                          <Button size="sm" variant="outline" className="text-red-600" onClick={() => askDelete(q._id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-500">Chưa có câu hỏi</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Trước</Button>
          <div>Trang {page}/{totalPages}</div>
          <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Sau</Button>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa câu hỏi</DialogTitle>
            <DialogDescription>Cập nhật nội dung câu hỏi</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cấp độ *</Label>
                <select className="w-full border rounded px-3 py-2" value={form.level} onChange={(e) => setForm(p => ({ ...p, level: parseFloat(e.target.value) }))}>
                  {levels.map(l => (
                    <option key={l._id} value={l.number}>Cấp {l.number} - {l.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Loại câu hỏi</Label>
                <select className="w-full border rounded px-3 py-2" value={form.questionType} onChange={(e) => setForm(p => ({ ...p, questionType: e.target.value as QuestionType }))}>
                  <option value="multiple-choice">Trắc nghiệm</option>
                  <option value="fill-blank">Điền từ</option>
                  <option value="reading-comprehension">Đọc hiểu</option>
                  <option value="sentence-order">Sắp xếp câu</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nội dung *</Label>
              <Textarea rows={2} value={form.question} onChange={(e) => setForm(p => ({ ...p, question: e.target.value }))} />
            </div>
            {form.questionType === 'multiple-choice' && (
              <div className="space-y-2">
                <Label>Đáp án *</Label>
                <div className="space-y-3">
                  {form.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={Array.isArray(form.correctAnswer) ? form.correctAnswer.includes(oIdx) : form.correctAnswer === oIdx} 
                          onChange={(e) => {
                            if (e.target.checked) {
                              if (Array.isArray(form.correctAnswer)) {
                                setForm(p => ({ ...p, correctAnswer: [...(p.correctAnswer as number[]), oIdx] }))
                              } else {
                                setForm(p => ({ ...p, correctAnswer: [p.correctAnswer as number, oIdx] }))
                              }
                            } else {
                              if (Array.isArray(form.correctAnswer)) {
                                setForm(p => ({ ...p, correctAnswer: (p.correctAnswer as number[]).filter((v: number) => v !== oIdx) }))
                              } else {
                                setForm(p => ({ ...p, correctAnswer: 0 }))
                              }
                            }
                          }}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm font-medium text-gray-600">
                          {Array.isArray(form.correctAnswer) ? 
                            (form.correctAnswer.includes(oIdx) ? '✓ Đáp án đúng' : 'Chọn làm đáp án đúng') :
                            (form.correctAnswer === oIdx ? '✓ Đáp án đúng' : 'Chọn làm đáp án đúng')
                          }
                        </span>
                      </div>
                      <Input 
                        value={opt} 
                        onChange={(e) => { 
                          const options = [...form.options]; 
                          options[oIdx] = e.target.value; 
                          setForm(p => ({ ...p, options })) 
                        }} 
                        placeholder={`Đáp án ${String.fromCharCode(65 + oIdx)}`}
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => removeOption(oIdx)}
                        disabled={form.options.length <= 2}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={addOption}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Thêm đáp án
                  </Button>
                  {Array.isArray(form.correctAnswer) ? (
                    form.correctAnswer.length > 0 ? (
                      <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                        ✓ Đã chọn {form.correctAnswer.length} đáp án đúng: {(form.correctAnswer as number[]).map(idx => form.options[idx]).join(', ')}
                      </div>
                    ) : (
                      <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        ⚠️ Chưa chọn đáp án đúng
                      </div>
                    )
                  ) : (
                    typeof form.correctAnswer === 'number' ? (
                      <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                        ✓ Đã chọn đáp án đúng: {form.options[form.correctAnswer]}
                      </div>
                    ) : (
                      <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        ⚠️ Chưa chọn đáp án đúng
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
            
            {/* Fill Blank Question */}
            {form.questionType === 'fill-blank' && (
              <div className="space-y-2">
                <Label>Đáp án đúng *</Label>
                <Input 
                  value={form.correctAnswer as string} 
                  onChange={(e) => setForm(p => ({ ...p, correctAnswer: e.target.value }))} 
                  placeholder="Nhập đáp án đúng"
                />
              </div>
            )}

            {/* Sentence Order Question */}
            {form.questionType === 'sentence-order' && (
              <div className="space-y-2">
                <Label>Các câu/từ cần sắp xếp *</Label>
                <div className="space-y-2">
                  {form.sentences?.map((sentence, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600 w-8">{idx + 1}.</span>
                      <Input 
                        value={sentence} 
                        onChange={(e) => {
                          const sentences = [...(form.sentences || [])];
                          sentences[idx] = e.target.value;
                          setForm(p => ({ ...p, sentences }));
                        }} 
                        placeholder={`Câu/từ ${idx + 1}`}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const sentences = form.sentences?.filter((_, i) => i !== idx) || [];
                          setForm(p => ({ ...p, sentences }));
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={() => setForm(p => ({ ...p, sentences: [...(p.sentences || []), ''] }))}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Thêm câu/từ
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Thứ tự đúng *</Label>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600 mb-2">
                      Kéo thả để sắp xếp thứ tự đúng (hoặc click để chọn):
                    </div>
                    <div className="space-y-2">
                      {form.sentences?.map((sentence, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 border rounded-lg">
                          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                            {Array.isArray(form.correctAnswer) ? (form.correctAnswer as number[]).indexOf(idx) + 1 : '?'}
                          </div>
                          <div className="flex-1 text-sm">{sentence}</div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (!Array.isArray(form.correctAnswer)) {
                                setForm(p => ({ ...p, correctAnswer: [idx] }));
                              } else if (form.correctAnswer.includes(idx)) {
                                setForm(p => ({ ...p, correctAnswer: (p.correctAnswer as number[]).filter((i: number) => i !== idx) }));
                              } else {
                                setForm(p => ({ ...p, correctAnswer: [...(p.correctAnswer as number[]), idx] }));
                              }
                            }}
                            className={Array.isArray(form.correctAnswer) && form.correctAnswer.includes(idx) ? 'bg-blue-500 text-white' : ''}
                          >
                            {Array.isArray(form.correctAnswer) && form.correctAnswer.includes(idx) ? 'Đã chọn' : 'Chọn'}
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500">
                      Thứ tự hiện tại: {Array.isArray(form.correctAnswer) ? `[${(form.correctAnswer as number[]).join(', ')}]` : 'Chưa chọn'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Reading Comprehension Question */}
            {form.questionType === 'reading-comprehension' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Đoạn văn *</Label>
                  <Textarea 
                    rows={6} 
                    value={form.passage || ''} 
                    onChange={(e) => setForm(p => ({ ...p, passage: e.target.value }))} 
                    placeholder="Nhập đoạn văn cần đọc hiểu..."
                    className="text-sm"
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Câu hỏi đọc hiểu:</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newQuestions = [...(form.subQuestions || []), {
                          question: '',
                          options: ['', ''],
                          correctAnswer: 0
                        }]
                        setForm(p => ({ ...p, subQuestions: newQuestions }))
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Thêm câu hỏi
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {(form.subQuestions || []).map((subQ: any, qIdx: number) => (
                      <div key={qIdx} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-gray-700">Câu hỏi {qIdx + 1}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newQuestions = (form.subQuestions || []).filter((_: any, i: number) => i !== qIdx)
                              setForm(p => ({ ...p, subQuestions: newQuestions }))
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <Label>Câu hỏi *</Label>
                            <Input
                              value={subQ.question}
                              onChange={(e) => {
                                const newQuestions = [...(form.subQuestions || [])]
                                newQuestions[qIdx].question = e.target.value
                                setForm(p => ({ ...p, subQuestions: newQuestions }))
                              }}
                              placeholder="Nhập câu hỏi..."
                            />
                          </div>
                          
                          <div>
                            <Label>Đáp án *</Label>
                            <div className="space-y-2">
                              {subQ.options.map((opt: string, oIdx: number) => (
                                <div key={oIdx} className="flex items-center gap-3">
                                  <input
                                    type="radio"
                                    name={`subQ_${qIdx}`}
                                    checked={subQ.correctAnswer === oIdx}
                                    onChange={() => {
                                      const newQuestions = [...(form.subQuestions || [])]
                                      newQuestions[qIdx].correctAnswer = oIdx
                                      setForm(p => ({ ...p, subQuestions: newQuestions }))
                                    }}
                                    className="w-4 h-4 text-blue-600"
                                  />
                                  <Input
                                    value={opt}
                                    onChange={(e) => {
                                      const newQuestions = [...(form.subQuestions || [])]
                                      newQuestions[qIdx].options[oIdx] = e.target.value
                                      setForm(p => ({ ...p, subQuestions: newQuestions }))
                                    }}
                                    placeholder={`Đáp án ${String.fromCharCode(65 + oIdx)}`}
                                    className="flex-1"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const newQuestions = [...(form.subQuestions || [])]
                                      newQuestions[qIdx].options = newQuestions[qIdx].options.filter((_: string, i: number) => i !== oIdx)
                                      if (newQuestions[qIdx].correctAnswer >= oIdx) {
                                        newQuestions[qIdx].correctAnswer = Math.max(0, newQuestions[qIdx].correctAnswer - 1)
                                      }
                                      setForm(p => ({ ...p, subQuestions: newQuestions }))
                                    }}
                                    disabled={subQ.options.length <= 2}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  const newQuestions = [...(form.subQuestions || [])]
                                  newQuestions[qIdx].options = [...newQuestions[qIdx].options, '']
                                  setForm(p => ({ ...p, subQuestions: newQuestions }))
                                }}
                                className="w-full"
                              >
                                <Plus className="h-4 w-4 mr-2" /> Thêm đáp án
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {(!form.subQuestions || form.subQuestions.length === 0) && (
                      <div className="text-center py-8 text-gray-500">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Chưa có câu hỏi nào. Click "Thêm câu hỏi" để bắt đầu.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Giải thích</Label>
              <Textarea rows={2} value={form.explanation} onChange={(e) => setForm(p => ({ ...p, explanation: e.target.value }))} />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowEdit(false)}>Hủy</Button>
              <Button type="submit" disabled={formLoading}>{formLoading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang lưu...</>) : 'Cập nhật câu hỏi'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lịch sử làm câu hỏi</DialogTitle>
            <DialogDescription>
              {historyQuestion ? `Câu hỏi: ${historyQuestion.question}` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="font-medium text-gray-700">Thống kê: </span>
                <span className="text-green-600 font-semibold">Đúng {historyStats.correct}</span>
                <span> / Tổng {historyStats.total}</span>
              </div>
              {historyQuestion && (
                <div className="text-xs text-gray-500">
                  ID: {historyQuestion._id}
                </div>
              )}
            </div>
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3 w-8">#</th>
                    <th className="text-left px-4 py-3">Người dùng</th>
                    <th className="text-left px-4 py-3">Đáp án đã chọn</th>
                    <th className="text-left px-4 py-3">Kết quả</th>
                    <th className="text-left px-4 py-3">Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {historyLoading ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Đang tải...</td></tr>
                  ) : historyItems.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Chưa có lịch sử</td></tr>
                  ) : (
                    historyItems.map((h, idx) => {
                      const q = historyQuestion as any
                      // Render user answer text based on question type
                      let answerText = ''
                      if (q?.questionType === 'multiple-choice' && (q as any).options) {
                        const opts = (h.options && Array.isArray(h.options) ? h.options : (q as any).options) || []
                        if (Array.isArray(h.userAnswer)) {
                          answerText = h.userAnswer.map((i: number) => opts[i]).filter(Boolean).join(', ')
                        } else if (typeof h.userAnswer === 'number') {
                          answerText = opts[h.userAnswer] ?? String(h.userAnswer)
                        } else {
                          answerText = String(h.userAnswer ?? '')
                        }
                      } else if (q?.questionType === 'sentence-order') {
                        answerText = Array.isArray(h.userAnswer) ? `[${h.userAnswer.join(', ')}]` : String(h.userAnswer ?? '')
                      } else if (q?.questionType === 'reading-comprehension') {
                        answerText = Array.isArray(h.userAnswer) ? h.userAnswer.join(', ') : String(h.userAnswer ?? '')
                      } else {
                        answerText = String(h.userAnswer ?? '')
                      }
                      return (
                        <tr key={idx} className="border-t">
                          <td className="px-4 py-3">{(historyPage - 1) * 10 + idx + 1}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="font-medium">{h.user?.name || 'N/A'}</span>
                              <span className="text-xs text-gray-500">{h.user?.email || ''}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">{answerText || '-'}</td>
                          <td className="px-4 py-3">
                            {h.correct ? (
                              <span className="text-green-600 font-medium">Đúng</span>
                            ) : (
                              <span className="text-red-600 font-medium">Sai</span>
                            )}
                          </td>
                          <td className="px-4 py-3">{new Date(h.attemptedAt).toLocaleString()}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
            {historyTotalPages > 1 && (
              <div className="flex items-center justify-center gap-3 text-sm">
                <Button
                  variant="outline"
                  disabled={historyPage === 1 || historyLoading || !historyQuestion}
                  onClick={async () => {
                    const newPage = Math.max(1, historyPage - 1)
                    setHistoryPage(newPage)
                    if (historyQuestion) await fetchHistory(historyQuestion._id, newPage)
                  }}
                >
                  Trước
                </Button>
                <div>Trang {historyPage}/{historyTotalPages}</div>
                <Button
                  variant="outline"
                  disabled={historyPage === historyTotalPages || historyLoading || !historyQuestion}
                  onClick={async () => {
                    const newPage = Math.min(historyTotalPages, historyPage + 1)
                    setHistoryPage(newPage)
                    if (historyQuestion) await fetchHistory(historyQuestion._id, newPage)
                  }}
                >
                  Sau
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Import câu hỏi từ Excel
            </DialogTitle>
            <DialogDescription>
              Tải lên file Excel để import nhiều câu hỏi cùng lúc. Hỗ trợ câu hỏi 1 đáp án đúng và nhiều đáp án đúng.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {!importProgress ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Chọn file Excel để import</h3>
                <p className="text-gray-500 mb-4">
                  Hỗ trợ file .xlsx, .xls. Tải template mẫu để xem định dạng.
                </p>
                <Button onClick={() => fileRef.current?.click()} disabled={importing}>
                  <Upload className="mr-2 h-4 w-4" />
                  Chọn file
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Tiến độ import</span>
                    <span>{importProgress.processed}/{importProgress.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${importProgress.total > 0 ? (importProgress.processed / importProgress.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Results */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">{importProgress.created}</div>
                    <div className="text-sm text-green-700">Tạo mới</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">{importProgress.updated}</div>
                    <div className="text-sm text-blue-700">Cập nhật</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-red-600">{importProgress.errors.length}</div>
                    <div className="text-sm text-red-700">Lỗi</div>
                  </div>
                </div>

                {/* Errors */}
                {importProgress.errors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-red-800">Chi tiết lỗi:</h4>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {importProgress.errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-700 bg-red-50 p-2 rounded">
                          <span className="font-medium">Dòng {error.row}:</span> {error.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowImportDialog(false)
                      setImportProgress(null)
                      fetchQuestions()
                    }}
                  >
                    Đóng
                  </Button>
                  {importProgress.errors.length > 0 && (
                    <Button onClick={() => setImportProgress(null)}>
                      Import lại
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xóa câu hỏi?</DialogTitle>
            <DialogDescription>Hành động này không thể hoàn tác.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDelete(false)}>Hủy</Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={confirmDelete}>Xóa</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


