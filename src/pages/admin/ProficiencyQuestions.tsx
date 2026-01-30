import { useState, useEffect } from 'react'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Badge } from '../../components/ui/badge'
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Target,
  Loader2,
  X
} from 'lucide-react'
import { api } from '../../services/api'
import toast from 'react-hot-toast'

interface Level {
  _id: string
  level?: number
  number: number
  name: string
  description: string
  requiredExperience: number
  color: string
  icon?: string
}

interface ProficiencyQuestion {
  _id: string
  question: string
  options: string[]
  correctAnswer: number[]
  explanation?: string
  level: number
  questionType: 'multiple-choice' | 'fill-blank' | 'reading-comprehension' | 'sentence-order'
  createdAt: string
  updatedAt: string
}

interface QuestionFormData {
  question: string
  options: string[]
  correctAnswer: number[]
  explanation: string
  level: number
  questionType: 'multiple-choice' | 'fill-blank' | 'reading-comprehension' | 'sentence-order'
}

export const AdminProficiencyQuestions = () => {
  const [levels, setLevels] = useState<Level[]>([])
  const [questions, setQuestions] = useState<ProficiencyQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<ProficiencyQuestion | null>(null)
  const [formData, setFormData] = useState<QuestionFormData>({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: [],
    explanation: '',
    level: 1,
    questionType: 'multiple-choice'
  })
  const [formLoading, setFormLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    fetchLevels()
    fetchQuestions()
  }, [])

  useEffect(() => {
    fetchQuestions()
  }, [currentPage, itemsPerPage, searchTerm, selectedLevel])

  const fetchLevels = async () => {
    try {
      const response = await api.get('/admin/levels')
      setLevels(response.data || [])
    } catch (error) {
      console.error('Error fetching levels:', error)
      toast.error('Không thể tải danh sách cấp độ')
    }
  }

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      const offset = (currentPage - 1) * itemsPerPage
      const response = await api.get(`/admin/proficiency-questions?limit=${itemsPerPage}&offset=${offset}&search=${searchTerm}&level=${selectedLevel || ''}`)
      setQuestions(response.data.questions || [])
      setTotalQuestions(response.data.total || 0)
    } catch (error) {
      console.error('Error fetching questions:', error)
      toast.error('Không thể tải danh sách câu hỏi')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.question.trim()) {
      toast.error('Vui lòng nhập câu hỏi')
      return
    }

    if (formData.options.filter(opt => opt.trim()).length < 2) {
      toast.error('Cần ít nhất 2 phương án')
      return
    }

    if (formData.correctAnswer.length === 0) {
      toast.error('Vui lòng chọn ít nhất một đáp án đúng')
      return
    }

    try {
      setFormLoading(true)
      await api.post('/admin/proficiency-questions', formData)
      
      toast.success('Tạo câu hỏi thành công!')
      setShowCreateDialog(false)
      resetForm()
      setCurrentPage(1)
      fetchQuestions()
    } catch (error: any) {
      console.error('Error creating question:', error)
      toast.error(error.response?.data?.message || 'Không thể tạo câu hỏi')
    } finally {
      setFormLoading(false)
    }
  }

  const handleEditQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingQuestion) return

    if (!formData.question.trim()) {
      toast.error('Vui lòng nhập câu hỏi')
      return
    }

    if (formData.options.filter(opt => opt.trim()).length < 2) {
      toast.error('Cần ít nhất 2 phương án')
      return
    }

    if (formData.correctAnswer.length === 0) {
      toast.error('Vui lòng chọn ít nhất một đáp án đúng')
      return
    }

    try {
      setFormLoading(true)
      await api.put(`/admin/proficiency-questions/${editingQuestion._id}`, formData)
      
      toast.success('Cập nhật câu hỏi thành công!')
      setShowEditDialog(false)
      setEditingQuestion(null)
      resetForm()
      fetchQuestions()
    } catch (error: any) {
      console.error('Error updating question:', error)
      toast.error(error.response?.data?.message || 'Không thể cập nhật câu hỏi')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteQuestion = (id: string) => {
    setDeletingId(id)
    setShowDeleteDialog(true)
  }

  const confirmDeleteQuestion = async () => {
    if (!deletingId) return
    try {
      await api.delete(`/admin/proficiency-questions/${deletingId}`)
      toast.success('Xóa câu hỏi thành công!')
      setShowDeleteDialog(false)
      setDeletingId(null)
      fetchQuestions()
    } catch (error: any) {
      console.error('Error deleting question:', error)
      toast.error(error.response?.data?.message || 'Không thể xóa câu hỏi')
    }
  }

  const resetForm = () => {
    setFormData({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: [],
      explanation: '',
      level: 1,
      questionType: 'multiple-choice'
    })
  }

  const openEditDialog = (question: ProficiencyQuestion) => {
    setEditingQuestion(question)
    setFormData({
      question: question.question,
      options: [...question.options],
      correctAnswer: [...question.correctAnswer],
      explanation: question.explanation || '',
      level: question.level,
      questionType: question.questionType
    })
    setShowEditDialog(true)
  }

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, '']
    }))
  }

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
      correctAnswer: prev.correctAnswer.filter(answer => answer !== index).map(answer => answer > index ? answer - 1 : answer)
    }))
  }

  const updateOption = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }))
  }

  const toggleCorrectAnswer = (index: number) => {
    setFormData(prev => ({
      ...prev,
      correctAnswer: prev.correctAnswer.includes(index) 
        ? prev.correctAnswer.filter(answer => answer !== index)
        : [...prev.correctAnswer, index]
    }))
  }

  const getLevelColor = (levelNumber: number) => {
    const level = levels.find(l => (l.level || l.number) === levelNumber)
    return level?.color || 'bg-gray-500'
  }

  // Pagination logic using backend data
  const totalPages = Math.ceil(totalQuestions / itemsPerPage)

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items)
    setCurrentPage(1)
  }

  const handleSearchChange = (search: string) => {
    setSearchTerm(search)
    setCurrentPage(1)
  }

  const handleLevelChange = (level: number | null) => {
    setSelectedLevel(level)
    setCurrentPage(1)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Quản lý câu hỏi Test năng lực</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
             <div className="w-10 h-10 chinese-gradient rounded-xl flex items-center justify-center text-white mr-4 shadow-lg">
                <Target className="w-6 h-6" />
             </div>
             Câu hỏi năng lực
          </h1>
          <p className="text-gray-500 font-medium">Kho câu hỏi chuyên sâu phục vụ hệ thống bài test năng lực AI.</p>
        </div>
        
        <Button onClick={() => setShowCreateDialog(true)} className="chinese-gradient h-11 px-6 rounded-xl font-black text-white shadow-lg shadow-primary/20">
          <Plus className="mr-2 h-4 w-4" /> Thêm câu hỏi
        </Button>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl space-y-6">
         <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex-1 relative group">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-primary transition-colors" />
               <Input
                 placeholder="Tìm kiếm nội dung câu hỏi..."
                 value={searchTerm}
                 onChange={(e) => handleSearchChange(e.target.value)}
                 className="h-12 pl-11 rounded-xl border-gray-50 bg-gray-50/50 focus:bg-white focus:border-primary transition-all font-bold"
               />
            </div>
            
            <div className="flex items-center gap-4">
               <Select value={selectedLevel?.toString() || 'all'} onValueChange={(v) => handleLevelChange(v === 'all' ? null : parseInt(v))}>
                  <SelectTrigger className="w-44 h-12 rounded-xl border-gray-100 font-bold bg-gray-50/50">
                     <SelectValue placeholder="Tất cả cấp độ" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                     <SelectItem value="all">Tất cả trình độ</SelectItem>
                     {levels.map((l) => <SelectItem key={l._id} value={(l.level || l.number).toString()}>Cấp {l.level || l.number}: {l.name}</SelectItem>)}
                  </SelectContent>
               </Select>

               <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-black uppercase text-gray-400">Hiển thị</span>
                  <Select value={itemsPerPage.toString()} onValueChange={(v) => handleItemsPerPageChange(parseInt(v))}>
                     <SelectTrigger className="w-20 h-10 rounded-xl border-gray-100 font-black text-[10px]">
                        <SelectValue />
                     </SelectTrigger>
                     <SelectContent className="rounded-xl">
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                     </SelectContent>
                  </Select>
               </div>
            </div>
         </div>
      </div>

      {/* Questions List Rendering */}
      <div className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-xl">
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                     <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Câu hỏi</th>
                     <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Loại & Cấp độ</th>
                     <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Đáp án đúng</th>
                     <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Thao tác</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {questions.map((q) => (
                    <tr key={q._id} className="group hover:bg-gray-50/50 transition-colors">
                       <td className="px-8 py-6 max-w-sm">
                          <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-relaxed">{q.question}</p>
                       </td>
                       <td className="px-8 py-6">
                          <div className="space-y-1.5">
                             <Badge variant="outline" className="rounded-lg font-black text-[8px] uppercase tracking-widest border-gray-200 text-gray-400">
                                {q.questionType}
                             </Badge>
                             <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${getLevelColor(q.level)}`} />
                                <span className="text-[10px] font-black text-gray-900 uppercase">Level {q.level}</span>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-6 text-center">
                          <div className="flex justify-center gap-1">
                             {q.correctAnswer.map((a, i) => (
                               <Badge key={i} className="bg-green-50 text-green-600 border-none rounded-lg font-black text-[10px]">{String.fromCharCode(65 + a)}</Badge>
                             ))}
                          </div>
                       </td>
                       <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end space-x-2">
                             <Button variant="ghost" size="sm" onClick={() => openEditDialog(q)} className="w-9 h-9 rounded-xl hover:bg-blue-50 hover:text-blue-600"><Edit className="w-4 h-4" /></Button>
                             <Button variant="ghost" size="sm" onClick={() => handleDeleteQuestion(q._id)} className="w-9 h-9 rounded-xl hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
                          </div>
                       </td>
                    </tr>
                  ))}
                  {questions.length === 0 && !loading && (
                    <tr><td colSpan={4} className="px-8 py-20 text-center text-gray-400 font-bold italic">Không tìm thấy câu hỏi nào.</td></tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-4 mt-8">
           <Button variant="ghost" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="rounded-xl font-bold text-xs uppercase text-gray-400 hover:text-primary">Trang trước</Button>
           <div className="bg-white px-6 py-2 rounded-2xl border border-gray-100 shadow-sm font-black text-sm text-gray-900">
              Trang {currentPage} / {totalPages}
           </div>
           <Button variant="ghost" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="rounded-xl font-bold text-xs uppercase text-gray-400 hover:text-primary">Trang sau</Button>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thêm câu hỏi mới</DialogTitle>
            <DialogDescription>
              Tạo câu hỏi mới cho bài test năng lực
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateQuestion} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-level">Cấp độ *</Label>
                <select
                  className="w-full p-2 border rounded-lg"
                  value={formData.level}
                  onChange={(e) => setFormData(prev => ({ ...prev, level: parseInt(e.target.value) }))}
                  required
                >
                  <option value="">Chọn cấp độ...</option>
                  {levels.map((level) => (
                    <option key={level._id} value={level.level || level.number}>
                      Cấp {level.level || level.number}: {level.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-questionType">Loại câu hỏi *</Label>
                <select
                  className="w-full p-2 border rounded-lg"
                  value={formData.questionType}
                  onChange={(e) => setFormData(prev => ({ ...prev, questionType: e.target.value as any }))}
                  required
                >
                  <option value="multiple-choice">Trắc nghiệm</option>
                  <option value="fill-blank">Điền từ</option>
                  <option value="reading-comprehension">Đọc hiểu</option>
                  <option value="sentence-order">Sắp xếp câu</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-question">Câu hỏi *</Label>
              <Textarea
                id="create-question"
                value={formData.question}
                onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                placeholder="Nhập câu hỏi..."
                rows={3}
                required
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Phương án trả lời</Label>
                <Button type="button" onClick={addOption} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Thêm phương án
                </Button>
              </div>
              {formData.options.map((option, index) => (
                <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.correctAnswer.includes(index)}
                      onChange={() => toggleCorrectAnswer(index)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">
                      {String.fromCharCode(65 + index)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Phương án ${String.fromCharCode(65 + index)}`}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeOption(index)}
                    disabled={formData.options.length <= 2}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-explanation">Giải thích</Label>
              <Textarea
                id="create-explanation"
                value={formData.explanation}
                onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
                placeholder="Giải thích cho câu trả lời đúng..."
                rows={2}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  'Tạo câu hỏi'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa câu hỏi</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin câu hỏi
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditQuestion} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-level">Cấp độ *</Label>
                <select
                  className="w-full p-2 border rounded-lg"
                  value={formData.level}
                  onChange={(e) => setFormData(prev => ({ ...prev, level: parseInt(e.target.value) }))}
                  required
                >
                  <option value="">Chọn cấp độ...</option>
                  {levels.map((level) => (
                    <option key={level._id} value={level.level || level.number}>
                      Cấp {level.level || level.number}: {level.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-questionType">Loại câu hỏi *</Label>
                <select
                  className="w-full p-2 border rounded-lg"
                  value={formData.questionType}
                  onChange={(e) => setFormData(prev => ({ ...prev, questionType: e.target.value as any }))}
                  required
                >
                  <option value="multiple-choice">Trắc nghiệm</option>
                  <option value="fill-blank">Điền từ</option>
                  <option value="reading-comprehension">Đọc hiểu</option>
                  <option value="sentence-order">Sắp xếp câu</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-question">Câu hỏi *</Label>
              <Textarea
                id="edit-question"
                value={formData.question}
                onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                placeholder="Nhập câu hỏi..."
                rows={3}
                required
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Phương án trả lời</Label>
                <Button type="button" onClick={addOption} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Thêm phương án
                </Button>
              </div>
              {formData.options.map((option, index) => (
                <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.correctAnswer.includes(index)}
                      onChange={() => toggleCorrectAnswer(index)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">
                      {String.fromCharCode(65 + index)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Phương án ${String.fromCharCode(65 + index)}`}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeOption(index)}
                    disabled={formData.options.length <= 2}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-explanation">Giải thích</Label>
              <Textarea
                id="edit-explanation"
                value={formData.explanation}
                onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
                placeholder="Giải thích cho câu trả lời đúng..."
                rows={2}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang cập nhật...
                  </>
                ) : (
                  'Cập nhật câu hỏi'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa câu hỏi</DialogTitle>
            <DialogDescription>
              Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa câu hỏi này?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Hủy</Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={confirmDeleteQuestion}>Xóa</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
