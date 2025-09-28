import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog'
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Target,
  Loader2,
  ChevronDown,
  ChevronRight,
  X,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronUp
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
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table')

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

  const toggleQuestionExpansion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions)
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId)
    } else {
      newExpanded.add(questionId)
    }
    setExpandedQuestions(newExpanded)
  }

  const getLevelName = (levelNumber: number) => {
    const level = levels.find(l => (l.level || l.number) === levelNumber)
    return level ? `Cấp ${levelNumber}: ${level.name}` : `Cấp ${levelNumber}`
  }

  const getLevelColor = (levelNumber: number) => {
    const level = levels.find(l => (l.level || l.number) === levelNumber)
    return level?.color || 'bg-gray-500'
  }

  // Pagination logic using backend data
  const totalPages = Math.ceil(totalQuestions / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalQuestions)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý câu hỏi Test năng lực</h1>
          <p className="text-gray-600">Quản lý ngân hàng câu hỏi theo cấp độ</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Thêm câu hỏi
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tạo câu hỏi mới</DialogTitle>
              <DialogDescription>
                Thêm câu hỏi vào ngân hàng câu hỏi test năng lực
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateQuestion} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="level">Cấp độ *</Label>
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
                  <Label htmlFor="questionType">Loại câu hỏi *</Label>
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
                <Label htmlFor="question">Câu hỏi *</Label>
                <Textarea
                  id="question"
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
                <Label htmlFor="explanation">Giải thích</Label>
                <Textarea
                  id="explanation"
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
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Tìm kiếm câu hỏi..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label>Lọc theo cấp độ:</Label>
            <select
              className="p-2 border rounded-lg"
              value={selectedLevel || ''}
              onChange={(e) => handleLevelChange(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">Tất cả cấp độ</option>
              {levels.map((level) => (
                <option key={level._id} value={level.level || level.number}>
                  Cấp {level.level || level.number}: {level.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Label>Hiển thị:</Label>
            <select
              className="p-2 border rounded-lg"
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              Bảng
            </Button>
            <Button
              variant={viewMode === 'card' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('card')}
            >
              Thẻ
            </Button>
          </div>
        </div>
      </div>

      {/* Questions List */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cấp độ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loại
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Câu hỏi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đáp án đúng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {questions.map((question) => (
                  <>
                    <tr key={question._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getLevelColor(question.level)}`}>
                            <Target className="h-4 w-4 text-white" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {getLevelName(question.level)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {question.questionType === 'multiple-choice' && 'Trắc nghiệm'}
                          {question.questionType === 'fill-blank' && 'Điền từ'}
                          {question.questionType === 'reading-comprehension' && 'Đọc hiểu'}
                          {question.questionType === 'sentence-order' && 'Sắp xếp câu'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {question.question}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-1">
                          {question.correctAnswer.map((answer, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {String.fromCharCode(65 + answer)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleQuestionExpansion(question._id)}
                          >
                            {expandedQuestions.has(question._id) ? 
                              <ChevronUp className="h-4 w-4" /> : 
                              <ChevronDown className="h-4 w-4" />
                            }
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(question)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteQuestion(question._id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {expandedQuestions.has(question._id) && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 bg-gray-50">
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-semibold">Câu hỏi:</Label>
                              <p className="text-gray-700 mt-1">{question.question}</p>
                            </div>
                            
                            <div>
                              <Label className="text-sm font-semibold">Phương án:</Label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                {question.options.map((option, index) => (
                                  <div key={index} className={`flex items-center gap-2 p-2 rounded-lg ${
                                    question.correctAnswer.includes(index) 
                                      ? 'bg-green-50 border border-green-200' 
                                      : 'bg-gray-50 border border-gray-200'
                                  }`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                      question.correctAnswer.includes(index) 
                                        ? 'bg-green-500 text-white' 
                                        : 'bg-gray-300 text-gray-600'
                                    }`}>
                                      {question.correctAnswer.includes(index) ? 
                                        <CheckCircle className="h-4 w-4" /> : 
                                        <AlertCircle className="h-4 w-4" />
                                      }
                                    </div>
                                    <span className="text-sm font-medium">
                                      {String.fromCharCode(65 + index)}.
                                    </span>
                                    <span className="text-sm">{option}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {question.explanation && (
                              <div>
                                <Label className="text-sm font-semibold">Giải thích:</Label>
                                <p className="text-gray-700 mt-1">{question.explanation}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <Card key={question._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getLevelColor(question.level)}`}>
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-gray-900">
                        {getLevelName(question.level)}
                      </CardTitle>
                      <CardDescription>
                        {question.questionType === 'multiple-choice' && 'Trắc nghiệm'}
                        {question.questionType === 'fill-blank' && 'Điền từ'}
                        {question.questionType === 'reading-comprehension' && 'Đọc hiểu'}
                        {question.questionType === 'sentence-order' && 'Sắp xếp câu'}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleQuestionExpansion(question._id)}
                    >
                      {expandedQuestions.has(question._id) ? 
                        <ChevronDown className="h-4 w-4" /> : 
                        <ChevronRight className="h-4 w-4" />
                      }
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(question)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteQuestion(question._id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {expandedQuestions.has(question._id) && (
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-semibold">Câu hỏi:</Label>
                    <p className="text-gray-700 mt-1">{question.question}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-semibold">Phương án:</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      {question.options.map((option, index) => (
                        <div key={index} className={`flex items-center gap-2 p-2 rounded-lg ${
                          question.correctAnswer.includes(index) 
                            ? 'bg-green-50 border border-green-200' 
                            : 'bg-gray-50 border border-gray-200'
                        }`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            question.correctAnswer.includes(index) 
                              ? 'bg-green-500 text-white' 
                              : 'bg-gray-300 text-gray-600'
                          }`}>
                            {question.correctAnswer.includes(index) ? 
                              <CheckCircle className="h-4 w-4" /> : 
                              <AlertCircle className="h-4 w-4" />
                            }
                          </div>
                          <span className="text-sm font-medium">
                            {String.fromCharCode(65 + index)}.
                          </span>
                          <span className="text-sm">{option}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {question.explanation && (
                    <div>
                      <Label className="text-sm font-semibold">Giải thích:</Label>
                      <p className="text-gray-700 mt-1">{question.explanation}</p>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Trước
            </Button>
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Sau
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Hiển thị <span className="font-medium">{startIndex + 1}</span> đến{' '}
                <span className="font-medium">{endIndex}</span> trong{' '}
                <span className="font-medium">{totalQuestions}</span> kết quả
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="rounded-l-md"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    onClick={() => handlePageChange(page)}
                    className="rounded-none"
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="rounded-r-md"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </nav>
            </div>
          </div>
        </div>
      )}

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

      {questions.length === 0 && !loading && (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {searchTerm || selectedLevel ? 'Không tìm thấy câu hỏi nào' : 'Chưa có câu hỏi nào'}
            </h3>
            <p className="text-gray-500">
              {searchTerm || selectedLevel 
                ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                : 'Hãy thêm câu hỏi đầu tiên'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
