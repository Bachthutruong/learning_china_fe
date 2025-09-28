import { useEffect, useState } from 'react'
import { Card, CardContent } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react'
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
}

interface QuestionFormData {
  level: number
  questionType: QuestionType
  question: string
  options: string[]
  correctAnswer: number | number[]
  explanation?: string
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
  const [levels, setLevels] = useState<Array<{ _id: string; number: number; name: string }>>([])
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
    setForm({ level: 1, questionType: 'multiple-choice', question: '', options: ['', ''], correctAnswer: 0, explanation: '' })
  }

  const openCreate = () => { resetForm(); setShowCreate(true) }

  const openEdit = (q: QuestionItem) => {
    setEditing(q)
    const correct = (q as any).correctAnswer
    setForm({ 
      level: q.level, 
      questionType: q.questionType, 
      question: q.question, 
      options: q.options || ['', ''], 
      correctAnswer: correct !== undefined ? correct : 0, 
      explanation: q.explanation || '' 
    })
    setShowEdit(true)
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
        if (form.correctAnswer.some(idx => idx < 0 || idx >= form.options.length)) return 'Đáp án đúng không hợp lệ'
        const correctTexts = form.correctAnswer.map(idx => form.options[idx]?.trim()).filter(Boolean)
        if (correctTexts.length !== form.correctAnswer.length) return 'Đáp án đúng không được để trống'
      } else {
        if (form.correctAnswer < 0 || form.correctAnswer >= form.options.length) return 'Chưa chọn đáp án đúng'
        const correctText = form.options[form.correctAnswer]?.trim()
        if (!correctText) return 'Đáp án đúng không được để trống'
      }
      
      // Kiểm tra không có đáp án trùng lặp
      const uniqueOptions = [...new Set(nonEmpty)]
      if (uniqueOptions.length !== nonEmpty.length) return 'Không được có đáp án trùng lặp'
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
      if (form.questionType === 'multiple-choice') {
        payload.options = form.options
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
      if (form.questionType === 'multiple-choice') {
        payload.options = form.options
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
    let newCorrectAnswer: number | number[] = prev.correctAnswer
    
    if (Array.isArray(prev.correctAnswer)) {
      newCorrectAnswer = prev.correctAnswer
        .filter(v => v !== idx)
        .map(v => v > idx ? v - 1 : v)
    } else {
      if (prev.correctAnswer === idx) {
        newCorrectAnswer = 0 // Reset to first option
      } else if (prev.correctAnswer > idx) {
        newCorrectAnswer = prev.correctAnswer - 1
      }
    }
    
    return {
      ...prev,
      options: newOptions,
      correctAnswer: newCorrectAnswer
    }
  })

  if (showCreate) {
    return (
      <div className="space-y-6">
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
                        ✓ Đã chọn {form.correctAnswer.length} đáp án đúng: {form.correctAnswer.map(idx => form.options[idx]).join(', ')}
                      </div>
                    ) : (
                      <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        ⚠️ Chưa chọn đáp án đúng
                      </div>
                    )
                  ) : (
                    form.correctAnswer >= 0 ? (
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
        <Button onClick={openCreate} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <Plus className="mr-2 h-4 w-4" /> Thêm câu hỏi
        </Button>
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
                        {q.options ? (
                          <div className="text-sm">
                            <div>{q.options.length} đáp án</div>
                            {q.questionType === 'multiple-choice' && (q as any).correctAnswer !== undefined && (
                              <div className="text-green-600 text-xs">
                                ✓ Đúng: {Array.isArray((q as any).correctAnswer) 
                                  ? (q as any).correctAnswer.map((idx: number) => q.options?.[idx]).join(', ')
                                  : q.options?.[(q as any).correctAnswer]
                                }
                              </div>
                            )}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
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
        <DialogContent className="max-w-3xl">
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
                        ✓ Đã chọn {form.correctAnswer.length} đáp án đúng: {form.correctAnswer.map(idx => form.options[idx]).join(', ')}
                      </div>
                    ) : (
                      <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        ⚠️ Chưa chọn đáp án đúng
                      </div>
                    )
                  ) : (
                    form.correctAnswer >= 0 ? (
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


