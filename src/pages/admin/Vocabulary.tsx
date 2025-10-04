import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog'
import { AudioUpload } from '../../components/ui/audio-upload'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Download,
  Upload,
  Play,
  Pause,
  Loader2,
  X,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react'
import { api } from '../../services/api'
import toast from 'react-hot-toast'

interface Vocabulary {
  _id: string
  word: string
  pinyin: string
  zhuyin?: string
  meaning: string
  partOfSpeech: string
  level: number
  topics: string[]
  examples: string[]
  synonyms: string[]
  antonyms: string[]
  imageUrl?: string
  audio?: string
  audioUrl?: string
  questions?: QuizQuestion[]
  createdAt: string
  updatedAt: string
}

interface Topic {
  _id: string
  name: string
  color: string
  description: string
}

interface Level {
  _id: string
  level?: number
  number: number
  name: string
  description: string
  requiredExperience: number
  color: string
  icon?: string
  createdAt: string
  updatedAt: string
}

interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

interface VocabularyFormData {
  word: string
  pinyin: string
  zhuyin: string
  meaning: string
  partOfSpeech: string
  level: number
  topics: string[]
  examples: string[]
  synonyms: string[]
  antonyms: string[]
  image?: File
  audio?: File
  questions: QuizQuestion[]
}

export const AdminVocabulary = () => {
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [levels, setLevels] = useState<Level[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [topicFilter, setTopicFilter] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingVocabulary, setEditingVocabulary] = useState<Vocabulary | null>(null)
  const [isPlaying, setIsPlaying] = useState<string | null>(null)
  const [audioLoading, setAudioLoading] = useState<string | null>(null)
  const [formData, setFormData] = useState<VocabularyFormData>({
    word: '',
    pinyin: '',
    zhuyin: '',
    meaning: '',
    partOfSpeech: '',
    level: 1,
    topics: [],
    examples: [],
    synonyms: [],
    antonyms: [],
    questions: []
  })
  const [formLoading, setFormLoading] = useState(false)
  const [newExample, setNewExample] = useState('')
  const [newSynonym, setNewSynonym] = useState('')
  const [newAntonym, setNewAntonym] = useState('')
  const [newQuestion, setNewQuestion] = useState('')
  const [newQuestionOptions, setNewQuestionOptions] = useState(['', '', '', ''])
  const [newQuestionCorrectAnswer, setNewQuestionCorrectAnswer] = useState(0)
  const [newQuestionExplanation, setNewQuestionExplanation] = useState('')
  
  // Edit question states
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null)
  const [editQuestion, setEditQuestion] = useState('')
  const [editQuestionOptions, setEditQuestionOptions] = useState(['', '', '', ''])
  const [editQuestionCorrectAnswer, setEditQuestionCorrectAnswer] = useState(0)
  const [editQuestionExplanation, setEditQuestionExplanation] = useState('')
  const [audioRemoved, setAudioRemoved] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [vocabularyToDelete, setVocabularyToDelete] = useState<Vocabulary | null>(null)
  const [importing, setImporting] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importProgress, setImportProgress] = useState<{
    total: number
    processed: number
    created: number
    updated: number
    errors: Array<{ row: number; message: string }>
    createdTopics?: string[]
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    fetchVocabularies()
    fetchTopics()
    fetchLevels()
  }, [])

  // Refetch when pagination or filters change
  useEffect(() => {
    fetchVocabularies()
  }, [currentPage, itemsPerPage, levelFilter, topicFilter])

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1) // Reset to first page when searching
      } else {
        fetchVocabularies()
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const fetchVocabularies = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/vocabularies', {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm,
          level: levelFilter !== 'all' ? levelFilter : undefined,
          topic: topicFilter !== 'all' ? topicFilter : undefined
        }
      })
      
      console.log('Vocabulary API response:', response.data)
      
      // Handle different response formats
      if (response.data.vocabularies) {
        setVocabularies(response.data.vocabularies)
        setTotalPages(response.data.totalPages || 1)
        setTotalItems(response.data.total || response.data.vocabularies.length)
      } else if (Array.isArray(response.data)) {
        setVocabularies(response.data)
        setTotalPages(1)
        setTotalItems(response.data.length)
      } else {
        setVocabularies([])
        setTotalPages(1)
        setTotalItems(0)
      }
    } catch (error) {
      console.error('Error fetching vocabularies:', error)
      toast.error('Không thể tải danh sách từ vựng')
      setVocabularies([])
    } finally {
      setLoading(false)
    }
  }

  const fetchTopics = async () => {
    try {
      const response = await api.get('/admin/topics')
      setTopics(response.data || [])
    } catch (error) {
      console.error('Error fetching topics:', error)
    }
  }

  const fetchLevels = async () => {
    try {
      const response = await api.get('/admin/levels')
      setLevels(response.data.levels || response.data || [])
    } catch (error) {
      console.error('Error fetching levels:', error)
    }
  }

  const downloadTemplate = async () => {
    try {
      const res = await api.get('/admin/vocabularies/template', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'vocabularies_template.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (e) {
      toast.error('Tải template thất bại')
    }
  }

  const openImportDialog = () => {
    setShowImportDialog(true)
    setImportProgress(null)
  }

  const onFileSelected = async (ev: React.ChangeEvent<HTMLInputElement>) => {
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
      
      const res = await api.post('/admin/vocabularies/import', form, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      })
      
      clearInterval(progressInterval)
      
      const { created = 0, updated = 0, errors = [], createdTopics = [] } = res.data || {}
      
      setImportProgress({
        total: created + updated + errors.length,
        processed: created + updated + errors.length,
        created,
        updated,
        errors,
        createdTopics
      })
      
      if (errors.length === 0) {
        toast.success(`Import thành công: +${created} mới, cập nhật ${updated}${createdTopics.length ? `, tạo ${createdTopics.length} chủ đề mới` : ''}`)
        fetchVocabularies()
        fetchTopics() // Refresh topics list
      } else {
        toast.error(`Import hoàn tất với ${errors.length} lỗi: +${created} mới, cập nhật ${updated}`)
      }
    } catch (e: any) {
      setImportProgress(prev => prev ? { ...prev, errors: [{ row: 0, message: e?.response?.data?.message || 'Import thất bại' }] } : null)
      toast.error(e?.response?.data?.message || 'Import thất bại')
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleCreateVocabulary = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.word || !formData.pinyin || !formData.meaning) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    try {
      setFormLoading(true)
      const formDataToSend = new FormData()
      formDataToSend.append('word', formData.word)
      formDataToSend.append('pinyin', formData.pinyin)
      formDataToSend.append('zhuyin', formData.zhuyin)
      formDataToSend.append('meaning', formData.meaning)
      formDataToSend.append('partOfSpeech', formData.partOfSpeech)
      formDataToSend.append('level', formData.level.toString())
      formDataToSend.append('topics', JSON.stringify(formData.topics))
      formDataToSend.append('examples', JSON.stringify(formData.examples))
      formDataToSend.append('synonyms', JSON.stringify(formData.synonyms))
      formDataToSend.append('antonyms', JSON.stringify(formData.antonyms))
      formDataToSend.append('questions', JSON.stringify(formData.questions))
      
      if (formData.image) {
        formDataToSend.append('image', formData.image)
      }
      if (formData.audio) {
        formDataToSend.append('audio', formData.audio)
      }

      const response = await api.post('/admin/vocabularies', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      // Add the new vocabulary to the list
      if (response.data.vocabulary) {
        setVocabularies(prev => [response.data.vocabulary, ...prev])
      }
      
      toast.success('Tạo từ vựng thành công!')
      setShowCreateDialog(false)
      resetForm()
      fetchVocabularies()
    } catch (error: any) {
      console.error('Error creating vocabulary:', error)
      toast.error(error.response?.data?.message || 'Không thể tạo từ vựng')
    } finally {
      setFormLoading(false)
    }
  }

  const handleEditVocabulary = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingVocabulary) return

    try {
      setFormLoading(true)
      const formDataToSend = new FormData()
      formDataToSend.append('word', formData.word)
      formDataToSend.append('pinyin', formData.pinyin)
      formDataToSend.append('zhuyin', formData.zhuyin)
      formDataToSend.append('meaning', formData.meaning)
      formDataToSend.append('partOfSpeech', formData.partOfSpeech)
      formDataToSend.append('level', formData.level.toString())
      formDataToSend.append('topics', JSON.stringify(formData.topics))
      formDataToSend.append('examples', JSON.stringify(formData.examples))
      formDataToSend.append('synonyms', JSON.stringify(formData.synonyms))
      formDataToSend.append('antonyms', JSON.stringify(formData.antonyms))
      formDataToSend.append('questions', JSON.stringify(formData.questions))
      
      if (formData.image) {
        formDataToSend.append('image', formData.image)
      }
      if (formData.audio) {
        formDataToSend.append('audio', formData.audio)
      }

      const response = await api.put(`/admin/vocabularies/${editingVocabulary._id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      // Update the vocabulary in the list with the new audioUrl
      if (response.data.vocabulary) {
        setVocabularies(prev => 
          prev.map(v => 
            v._id === editingVocabulary._id 
              ? { ...v, ...response.data.vocabulary }
              : v
          )
        )
      }
      
      toast.success('Cập nhật từ vựng thành công!')
      setShowEditDialog(false)
      setEditingVocabulary(null)
      resetForm()
      fetchVocabularies()
    } catch (error: any) {
      console.error('Error updating vocabulary:', error)
      toast.error(error.response?.data?.message || 'Không thể cập nhật từ vựng')
    } finally {
      setFormLoading(false)
    }
  }

  const openDeleteDialog = (vocabulary: Vocabulary) => {
    setVocabularyToDelete(vocabulary)
    setShowDeleteDialog(true)
  }

  const handleDeleteVocabulary = async () => {
    if (!vocabularyToDelete) return

    try {
      await api.delete(`/admin/vocabularies/${vocabularyToDelete._id}`)
      toast.success('Xóa từ vựng thành công!')
      setShowDeleteDialog(false)
      setVocabularyToDelete(null)
      fetchVocabularies()
    } catch (error: any) {
      console.error('Error deleting vocabulary:', error)
      toast.error(error.response?.data?.message || 'Không thể xóa từ vựng')
    }
  }

  const handlePlayAudio = async (audioUrl: string, vocabularyId: string) => {
    try {
      setAudioLoading(vocabularyId)
      const audio = new Audio(audioUrl)
      
      audio.onplay = () => {
        setIsPlaying(vocabularyId)
        setAudioLoading(null)
      }
      
      audio.onended = () => {
        setIsPlaying(null)
      }
      
      audio.onerror = () => {
        setAudioLoading(null)
        toast.error('Không thể phát âm thanh')
      }
      
      await audio.play()
    } catch (error) {
      setAudioLoading(null)
      toast.error('Không thể phát âm thanh')
    }
  }

  const resetForm = () => {
    setFormData({
      word: '',
      pinyin: '',
      zhuyin: '',
      meaning: '',
      partOfSpeech: '',
      level: 1,
      topics: [],
      examples: [],
      synonyms: [],
      antonyms: [],
      questions: []
    })
    setNewExample('')
    setNewSynonym('')
    setNewAntonym('')
    setNewQuestion('')
    setNewQuestionOptions(['', '', '', ''])
    setNewQuestionCorrectAnswer(0)
    setNewQuestionExplanation('')
  }

  const openEditDialog = (vocabulary: Vocabulary) => {
    setEditingVocabulary(vocabulary)
    setFormData({
      word: vocabulary.word,
      pinyin: vocabulary.pinyin,
      zhuyin: vocabulary.zhuyin || '',
      meaning: vocabulary.meaning,
      partOfSpeech: vocabulary.partOfSpeech,
      level: vocabulary.level,
      topics: vocabulary.topics,
      examples: vocabulary.examples,
      synonyms: vocabulary.synonyms,
      antonyms: vocabulary.antonyms,
      questions: (vocabulary as any).questions || [],
      audio: undefined // Reset audio file, will show existing audioUrl
    })
    setAudioRemoved(false) // Reset audio removed state
    setShowEditDialog(true)
  }

  const addExample = () => {
    if (newExample.trim()) {
      setFormData(prev => ({
        ...prev,
        examples: [...prev.examples, newExample.trim()]
      }))
      setNewExample('')
    }
  }

  const removeExample = (index: number) => {
    setFormData(prev => ({
      ...prev,
      examples: prev.examples.filter((_, i) => i !== index)
    }))
  }

  const addSynonym = () => {
    if (newSynonym.trim()) {
      setFormData(prev => ({
        ...prev,
        synonyms: [...prev.synonyms, newSynonym.trim()]
      }))
      setNewSynonym('')
    }
  }

  const removeSynonym = (index: number) => {
    setFormData(prev => ({
      ...prev,
      synonyms: prev.synonyms.filter((_, i) => i !== index)
    }))
  }

  const addAntonym = () => {
    if (newAntonym.trim()) {
      setFormData(prev => ({
        ...prev,
        antonyms: [...prev.antonyms, newAntonym.trim()]
      }))
      setNewAntonym('')
    }
  }

  const removeAntonym = (index: number) => {
    setFormData(prev => ({
      ...prev,
      antonyms: prev.antonyms.filter((_, i) => i !== index)
    }))
  }

  const addQuestion = () => {
    if (newQuestion.trim() && newQuestionOptions.every(opt => opt.trim())) {
      setFormData(prev => ({
        ...prev,
        questions: [...prev.questions, {
          question: newQuestion.trim(),
          options: newQuestionOptions.map(opt => opt.trim()),
          correctAnswer: newQuestionCorrectAnswer,
          explanation: newQuestionExplanation.trim() || undefined
        }]
      }))
      setNewQuestion('')
      setNewQuestionOptions(['', '', '', ''])
      setNewQuestionCorrectAnswer(0)
      setNewQuestionExplanation('')
    }
  }

  const removeQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }))
  }

  const startEditQuestion = (index: number) => {
    const question = formData.questions[index]
    setEditingQuestionIndex(index)
    setEditQuestion(question.question)
    setEditQuestionOptions([...question.options])
    setEditQuestionCorrectAnswer(question.correctAnswer)
    setEditQuestionExplanation(question.explanation || '')
  }

  const saveEditQuestion = () => {
    if (editingQuestionIndex !== null && editQuestion.trim() && editQuestionOptions.every(opt => opt.trim())) {
      const updatedQuestions = [...formData.questions]
      updatedQuestions[editingQuestionIndex] = {
        question: editQuestion.trim(),
        options: editQuestionOptions.map(opt => opt.trim()),
        correctAnswer: editQuestionCorrectAnswer,
        explanation: editQuestionExplanation.trim() || undefined
      }
      
      setFormData(prev => ({
        ...prev,
        questions: updatedQuestions
      }))
      
      // Reset edit states
      setEditingQuestionIndex(null)
      setEditQuestion('')
      setEditQuestionOptions(['', '', '', ''])
      setEditQuestionCorrectAnswer(0)
      setEditQuestionExplanation('')
    }
  }

  const cancelEditQuestion = () => {
    setEditingQuestionIndex(null)
    setEditQuestion('')
    setEditQuestionOptions(['', '', '', ''])
    setEditQuestionCorrectAnswer(0)
    setEditQuestionExplanation('')
  }

  // Use vocabularies directly from backend (already filtered and paginated)
  const displayVocabularies = vocabularies

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Quản lý từ vựng</h1>
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
          <h1 className="text-3xl font-bold text-gray-900">Quản lý từ vựng</h1>
          <p className="text-gray-600">Quản lý từ vựng và nội dung học tập</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Tải template
          </Button>
          <Button variant="outline" onClick={openImportDialog} disabled={importing}>
            <Upload className="mr-2 h-4 w-4" />
            {importing ? 'Đang import...' : 'Import Excel'}
          </Button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onFileSelected} />
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Thêm từ vựng
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Thêm từ vựng mới</DialogTitle>
              <DialogDescription>
                Tạo từ vựng mới với đầy đủ thông tin và âm thanh
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateVocabulary} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="word">Từ vựng (Tiếng Trung) *</Label>
                  <Input
                    id="word"
                    value={formData.word}
                    onChange={(e) => setFormData(prev => ({ ...prev, word: e.target.value }))}
                    placeholder="你好"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pinyin">Phiên âm (Pinyin) *</Label>
                  <Input
                    id="pinyin"
                    value={formData.pinyin}
                    onChange={(e) => setFormData(prev => ({ ...prev, pinyin: e.target.value }))}
                    placeholder="nǐ hǎo"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="zhuyin">Chú âm (Zhuyin)</Label>
                  <Input
                    id="zhuyin"
                    value={formData.zhuyin}
                    onChange={(e) => setFormData(prev => ({ ...prev, zhuyin: e.target.value }))}
                    placeholder="ㄋㄧˇ ㄏㄠˇ"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meaning">Nghĩa *</Label>
                <Input
                  id="meaning"
                  value={formData.meaning}
                  onChange={(e) => setFormData(prev => ({ ...prev, meaning: e.target.value }))}
                  placeholder="Xin chào"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="partOfSpeech">Từ loại</Label>
                  <Select value={formData.partOfSpeech} onValueChange={(value: string) => setFormData(prev => ({ ...prev, partOfSpeech: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn từ loại" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="noun">Danh từ</SelectItem>
                      <SelectItem value="verb">Động từ</SelectItem>
                      <SelectItem value="adjective">Tính từ</SelectItem>
                      <SelectItem value="adverb">Trạng từ</SelectItem>
                      <SelectItem value="pronoun">Đại từ</SelectItem>
                      <SelectItem value="preposition">Giới từ</SelectItem>
                      <SelectItem value="conjunction">Liên từ</SelectItem>
                      <SelectItem value="interjection">Thán từ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level">Cấp độ</Label>
                  <Select value={formData.level.toString()} onValueChange={(value: string) => setFormData(prev => ({ ...prev, level: parseInt(value) }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {levels.map((level) => (
                        <SelectItem key={level._id} value={level.level?.toString() || level.number.toString()}>
                          Cấp {level.level || level.number}: {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Chủ đề</Label>
                <div className="flex flex-wrap gap-2">
                  {topics.map(topic => (
                    <Button
                      key={topic._id}
                      type="button"
                      variant={formData.topics.includes(topic.name) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        if (formData.topics.includes(topic.name)) {
                          setFormData(prev => ({
                            ...prev,
                            topics: prev.topics.filter(t => t !== topic.name)
                          }))
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            topics: [...prev.topics, topic.name]
                          }))
                        }
                      }}
                    >
                      <div className={`w-2 h-2 rounded-full ${topic.color} mr-2`} />
                      {topic.name}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Hình ảnh</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setFormData(prev => ({ ...prev, image: file }))
                    }
                  }}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {formData.image && (
                  <div className="text-sm text-green-600">
                    Đã chọn: {formData.image.name}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>File âm thanh</Label>
                <AudioUpload
                  value={formData.audio}
                  onChange={(file) => setFormData(prev => ({ ...prev, audio: file || undefined }))}
                  maxSize={10}
                  accept="audio/*"
                />
              </div>

              <div className="space-y-2">
                <Label>Ví dụ</Label>
                <div className="space-y-2">
                  {formData.examples.map((example, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{example}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExample(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      value={newExample}
                      onChange={(e) => setNewExample(e.target.value)}
                      placeholder="Thêm ví dụ..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExample())}
                    />
                    <Button type="button" onClick={addExample} disabled={!newExample.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Từ đồng nghĩa</Label>
                <div className="space-y-2">
                  {formData.synonyms.map((synonym, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Badge variant="secondary">{synonym}</Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSynonym(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      value={newSynonym}
                      onChange={(e) => setNewSynonym(e.target.value)}
                      placeholder="Thêm từ đồng nghĩa..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSynonym())}
                    />
                    <Button type="button" onClick={addSynonym} disabled={!newSynonym.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Từ trái nghĩa</Label>
                <div className="space-y-2">
                  {formData.antonyms.map((antonym, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Badge variant="destructive">{antonym}</Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAntonym(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      value={newAntonym}
                      onChange={(e) => setNewAntonym(e.target.value)}
                      placeholder="Thêm từ trái nghĩa..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAntonym())}
                    />
                    <Button type="button" onClick={addAntonym} disabled={!newAntonym.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Câu hỏi khảo bài</Label>
                <div className="space-y-4">
                  {formData.questions.map((question, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Câu hỏi {index + 1}</h4>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditQuestion(index)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeQuestion(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm">{question.question}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className={`p-2 rounded text-sm ${
                            optIndex === question.correctAnswer 
                              ? 'bg-green-100 text-green-800 border border-green-300' 
                              : 'bg-gray-100'
                          }`}>
                            {String.fromCharCode(65 + optIndex)}. {option}
                          </div>
                        ))}
                      </div>
                      {question.explanation && (
                        <p className="text-xs text-gray-600">Giải thích: {question.explanation}</p>
                      )}
                    </div>
                  ))}
                  
                  {/* Edit Question Form */}
                  {editingQuestionIndex !== null && (
                    <div className="border-2 border-blue-300 rounded-lg p-4 space-y-3 bg-blue-50">
                      <h4 className="font-semibold text-blue-800">Chỉnh sửa câu hỏi {editingQuestionIndex + 1}</h4>
                      <div className="space-y-2">
                        <Label htmlFor="edit-question">Câu hỏi</Label>
                        <Input
                          id="edit-question"
                          value={editQuestion}
                          onChange={(e) => setEditQuestion(e.target.value)}
                          placeholder="Nhập câu hỏi..."
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Các lựa chọn</Label>
                        {editQuestionOptions.map((option, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className="w-6 text-sm font-medium">{String.fromCharCode(65 + index)}.</span>
                            <Input
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...editQuestionOptions]
                                newOptions[index] = e.target.value
                                setEditQuestionOptions(newOptions)
                              }}
                              placeholder={`Lựa chọn ${String.fromCharCode(65 + index)}`}
                            />
                            <Button
                              type="button"
                              variant={editQuestionCorrectAnswer === index ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setEditQuestionCorrectAnswer(index)}
                            >
                              Đúng
                            </Button>
                          </div>
                        ))}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="edit-explanation">Giải thích (tùy chọn)</Label>
                        <Input
                          id="edit-explanation"
                          value={editQuestionExplanation}
                          onChange={(e) => setEditQuestionExplanation(e.target.value)}
                          placeholder="Giải thích câu trả lời..."
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          onClick={saveEditQuestion}
                          disabled={!editQuestion.trim() || !editQuestionOptions.every(opt => opt.trim())}
                        >
                          Lưu
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={cancelEditQuestion}
                        >
                          Hủy
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold">Thêm câu hỏi mới</h4>
                    <div className="space-y-2">
                      <Label htmlFor="new-question">Câu hỏi</Label>
                      <Input
                        id="new-question"
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        placeholder="Nhập câu hỏi..."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Các lựa chọn</Label>
                      {newQuestionOptions.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="w-6 text-sm font-medium">{String.fromCharCode(65 + index)}.</span>
                          <Input
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...newQuestionOptions]
                              newOptions[index] = e.target.value
                              setNewQuestionOptions(newOptions)
                            }}
                            placeholder={`Lựa chọn ${String.fromCharCode(65 + index)}`}
                          />
                          <Button
                            type="button"
                            variant={newQuestionCorrectAnswer === index ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setNewQuestionCorrectAnswer(index)}
                          >
                            Đúng
                          </Button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="new-explanation">Giải thích (tùy chọn)</Label>
                      <Input
                        id="new-explanation"
                        value={newQuestionExplanation}
                        onChange={(e) => setNewQuestionExplanation(e.target.value)}
                        placeholder="Giải thích câu trả lời..."
                      />
                    </div>
                    
                    <Button
                      type="button"
                      onClick={addQuestion}
                      disabled={!newQuestion.trim() || !newQuestionOptions.every(opt => opt.trim())}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm câu hỏi
                    </Button>
                  </div>
                </div>
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
                    'Tạo từ vựng'
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
              <DialogTitle>Chỉnh sửa từ vựng</DialogTitle>
              <DialogDescription>
                Cập nhật thông tin từ vựng
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditVocabulary} className="space-y-6">
              {/* Same form fields as create dialog */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-word">Từ vựng (Tiếng Trung) *</Label>
                  <Input
                    id="edit-word"
                    value={formData.word}
                    onChange={(e) => setFormData(prev => ({ ...prev, word: e.target.value }))}
                    placeholder="你好"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-pinyin">Phiên âm (Pinyin) *</Label>
                  <Input
                    id="edit-pinyin"
                    value={formData.pinyin}
                    onChange={(e) => setFormData(prev => ({ ...prev, pinyin: e.target.value }))}
                    placeholder="nǐ hǎo"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-zhuyin">Chú âm (Zhuyin)</Label>
                  <Input
                    id="edit-zhuyin"
                    value={formData.zhuyin}
                    onChange={(e) => setFormData(prev => ({ ...prev, zhuyin: e.target.value }))}
                    placeholder="ㄋㄧˇ ㄏㄠˇ"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-meaning">Nghĩa *</Label>
                <Input
                  id="edit-meaning"
                  value={formData.meaning}
                  onChange={(e) => setFormData(prev => ({ ...prev, meaning: e.target.value }))}
                  placeholder="Xin chào"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-partOfSpeech">Từ loại</Label>
                  <Select value={formData.partOfSpeech} onValueChange={(value: string) => setFormData(prev => ({ ...prev, partOfSpeech: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn từ loại" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="noun">Danh từ</SelectItem>
                      <SelectItem value="verb">Động từ</SelectItem>
                      <SelectItem value="adjective">Tính từ</SelectItem>
                      <SelectItem value="adverb">Trạng từ</SelectItem>
                      <SelectItem value="pronoun">Đại từ</SelectItem>
                      <SelectItem value="preposition">Giới từ</SelectItem>
                      <SelectItem value="conjunction">Liên từ</SelectItem>
                      <SelectItem value="interjection">Thán từ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-level">Cấp độ</Label>
                  <Select value={formData.level.toString()} onValueChange={(value: string) => setFormData(prev => ({ ...prev, level: parseInt(value) }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {levels.map((level) => (
                        <SelectItem key={level._id} value={level.level?.toString() || level.number.toString()}>
                          Cấp {level.level || level.number}: {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Chủ đề</Label>
                <div className="flex flex-wrap gap-2">
                  {topics.map(topic => (
                    <Button
                      key={topic._id}
                      type="button"
                      variant={formData.topics.includes(topic.name) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        if (formData.topics.includes(topic.name)) {
                          setFormData(prev => ({
                            ...prev,
                            topics: prev.topics.filter(t => t !== topic.name)
                          }))
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            topics: [...prev.topics, topic.name]
                          }))
                        }
                      }}
                    >
                      <div className={`w-2 h-2 rounded-full ${topic.color} mr-2`} />
                      {topic.name}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Hình ảnh mới (tùy chọn)</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setFormData(prev => ({ ...prev, image: file }))
                    }
                  }}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {editingVocabulary?.imageUrl && (
                  <div className="text-sm text-gray-600">
                    Hình ảnh hiện tại: <a href={editingVocabulary.imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Xem hình ảnh</a>
                  </div>
                )}
                {formData.image && (
                  <div className="text-sm text-green-600">
                    Đã chọn: {formData.image.name}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>File âm thanh mới (tùy chọn)</Label>
                <AudioUpload
                  value={audioRemoved ? null : (formData.audio || editingVocabulary?.audioUrl)}
                  onChange={(file) => {
                    if (file === null) {
                      setAudioRemoved(true)
                      setFormData(prev => ({ ...prev, audio: undefined }))
                    } else {
                      setAudioRemoved(false)
                      setFormData(prev => ({ ...prev, audio: file }))
                    }
                  }}
                  maxSize={10}
                  accept="audio/*"
                />
                {editingVocabulary?.audioUrl && !formData.audio && !audioRemoved && (
                  <div className="text-sm text-gray-600">
                    Âm thanh hiện tại: {editingVocabulary.audioUrl.split('/').pop()}
                  </div>
                )}
                {audioRemoved && (
                  <div className="text-sm text-red-600">
                    File âm thanh đã được xóa. Bạn có thể upload file mới.
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Ví dụ</Label>
                <div className="space-y-2">
                  {formData.examples.map((example, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{example}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExample(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      value={newExample}
                      onChange={(e) => setNewExample(e.target.value)}
                      placeholder="Thêm ví dụ..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExample())}
                    />
                    <Button type="button" onClick={addExample} disabled={!newExample.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Từ đồng nghĩa</Label>
                <div className="space-y-2">
                  {formData.synonyms.map((synonym, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Badge variant="secondary">{synonym}</Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSynonym(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      value={newSynonym}
                      onChange={(e) => setNewSynonym(e.target.value)}
                      placeholder="Thêm từ đồng nghĩa..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSynonym())}
                    />
                    <Button type="button" onClick={addSynonym} disabled={!newSynonym.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Từ trái nghĩa</Label>
                <div className="space-y-2">
                  {formData.antonyms.map((antonym, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Badge variant="destructive">{antonym}</Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAntonym(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      value={newAntonym}
                      onChange={(e) => setNewAntonym(e.target.value)}
                      placeholder="Thêm từ trái nghĩa..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAntonym())}
                    />
                    <Button type="button" onClick={addAntonym} disabled={!newAntonym.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Câu hỏi khảo bài</Label>
                <div className="space-y-4">
                  {formData.questions.map((question, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Câu hỏi {index + 1}</h4>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditQuestion(index)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeQuestion(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm">{question.question}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className={`p-2 rounded text-sm ${
                            optIndex === question.correctAnswer 
                              ? 'bg-green-100 text-green-800 border border-green-300' 
                              : 'bg-gray-100'
                          }`}>
                            {String.fromCharCode(65 + optIndex)}. {option}
                          </div>
                        ))}
                      </div>
                      {question.explanation && (
                        <p className="text-xs text-gray-600">Giải thích: {question.explanation}</p>
                      )}
                    </div>
                  ))}
                  
                  {/* Edit Question Form */}
                  {editingQuestionIndex !== null && (
                    <div className="border-2 border-blue-300 rounded-lg p-4 space-y-3 bg-blue-50">
                      <h4 className="font-semibold text-blue-800">Chỉnh sửa câu hỏi {editingQuestionIndex + 1}</h4>
                      <div className="space-y-2">
                        <Label htmlFor="edit-question">Câu hỏi</Label>
                        <Input
                          id="edit-question"
                          value={editQuestion}
                          onChange={(e) => setEditQuestion(e.target.value)}
                          placeholder="Nhập câu hỏi..."
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Các lựa chọn</Label>
                        {editQuestionOptions.map((option, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className="w-6 text-sm font-medium">{String.fromCharCode(65 + index)}.</span>
                            <Input
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...editQuestionOptions]
                                newOptions[index] = e.target.value
                                setEditQuestionOptions(newOptions)
                              }}
                              placeholder={`Lựa chọn ${String.fromCharCode(65 + index)}`}
                            />
                            <Button
                              type="button"
                              variant={editQuestionCorrectAnswer === index ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setEditQuestionCorrectAnswer(index)}
                            >
                              Đúng
                            </Button>
                          </div>
                        ))}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="edit-explanation">Giải thích (tùy chọn)</Label>
                        <Input
                          id="edit-explanation"
                          value={editQuestionExplanation}
                          onChange={(e) => setEditQuestionExplanation(e.target.value)}
                          placeholder="Giải thích câu trả lời..."
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          onClick={saveEditQuestion}
                          disabled={!editQuestion.trim() || !editQuestionOptions.every(opt => opt.trim())}
                        >
                          Lưu
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={cancelEditQuestion}
                        >
                          Hủy
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold">Thêm câu hỏi mới</h4>
                    <div className="space-y-2">
                      <Label htmlFor="edit-new-question">Câu hỏi</Label>
                      <Input
                        id="edit-new-question"
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        placeholder="Nhập câu hỏi..."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Các lựa chọn</Label>
                      {newQuestionOptions.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="w-6 text-sm font-medium">{String.fromCharCode(65 + index)}.</span>
                          <Input
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...newQuestionOptions]
                              newOptions[index] = e.target.value
                              setNewQuestionOptions(newOptions)
                            }}
                            placeholder={`Lựa chọn ${String.fromCharCode(65 + index)}`}
                          />
                          <Button
                            type="button"
                            variant={newQuestionCorrectAnswer === index ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setNewQuestionCorrectAnswer(index)}
                          >
                            Đúng
                          </Button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-new-explanation">Giải thích (tùy chọn)</Label>
                      <Input
                        id="edit-new-explanation"
                        value={newQuestionExplanation}
                        onChange={(e) => setNewQuestionExplanation(e.target.value)}
                        placeholder="Giải thích câu trả lời..."
                      />
                    </div>
                    
                    <Button
                      type="button"
                      onClick={addQuestion}
                      disabled={!newQuestion.trim() || !newQuestionOptions.every(opt => opt.trim())}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm câu hỏi
                    </Button>
                  </div>
                </div>
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
                    'Cập nhật'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Import Dialog */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Import từ vựng từ Excel
              </DialogTitle>
              <DialogDescription>
                Tải lên file Excel để import nhiều từ vựng cùng lúc. Hệ thống sẽ tự động tạo chủ đề mới nếu chưa có.
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
                  <Button onClick={() => fileInputRef.current?.click()} disabled={importing}>
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

                  {/* Created Topics */}
                  {importProgress.createdTopics && importProgress.createdTopics.length > 0 && (
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <h4 className="font-medium text-yellow-800 mb-2">Chủ đề mới được tạo:</h4>
                      <div className="flex flex-wrap gap-2">
                        {importProgress.createdTopics.map((topic, index) => (
                          <Badge key={index} variant="secondary" className="bg-yellow-100 text-yellow-800">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

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
                        fetchVocabularies()
                        fetchTopics()
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

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xác nhận xóa từ vựng</DialogTitle>
              <DialogDescription>
                Bạn có chắc chắn muốn xóa từ vựng "{vocabularyToDelete?.word}"? 
                Hành động này không thể hoàn tác.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteDialog(false)}
              >
                Hủy
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteVocabulary}
                disabled={formLoading}
              >
                {formLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  'Xóa'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* View Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              Grid
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              Table
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="items-per-page">Hiển thị:</Label>
            <Select value={itemsPerPage.toString()} onValueChange={(value) => {
              setItemsPerPage(parseInt(value))
              setCurrentPage(1) // Reset to first page when changing items per page
            }}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          Hiển thị {displayVocabularies.length} trong {totalItems} từ vựng (Trang {currentPage}/{totalPages})
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Tìm kiếm từ vựng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Cấp độ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {levels.map((level) => (
              <SelectItem key={level._id} value={level.level?.toString() || level.number.toString()}>
                Cấp {level.level || level.number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={topicFilter} onValueChange={setTopicFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Chủ đề" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {topics.map(topic => (
              <SelectItem key={topic._id} value={topic.name}>{topic.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Vocabulary List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayVocabularies.map((vocabulary) => (
          <Card key={vocabulary._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    {vocabulary.word}
                  </CardTitle>
                  <CardDescription className="text-lg text-blue-600">
                    {vocabulary.pinyin}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {vocabulary.audio && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePlayAudio(vocabulary.audio!, vocabulary._id)}
                      disabled={audioLoading === vocabulary._id}
                    >
                      {audioLoading === vocabulary._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isPlaying === vocabulary._id ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(vocabulary)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDeleteDialog(vocabulary)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Nghĩa:</h4>
                <p className="text-gray-600">{vocabulary.meaning}</p>
              </div>

              {vocabulary.partOfSpeech && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Từ loại:</h4>
                  <Badge variant="outline">{vocabulary.partOfSpeech}</Badge>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Cấp độ:</h4>
                <Badge variant="secondary">Cấp {vocabulary.level}</Badge>
              </div>

              {vocabulary.topics.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Chủ đề:</h4>
                  <div className="flex flex-wrap gap-1">
                    {vocabulary.topics.map((topic, index) => (
                      <Badge key={index} variant="outline">{topic}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {vocabulary.examples.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Ví dụ:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {vocabulary.examples.slice(0, 2).map((example, index) => (
                      <li key={index}>• {example}</li>
                    ))}
                    {vocabulary.examples.length > 2 && (
                      <li className="text-gray-500">... và {vocabulary.examples.length - 2} ví dụ khác</li>
                    )}
                  </ul>
                </div>
              )}

              {vocabulary.synonyms.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Từ đồng nghĩa:</h4>
                  <div className="flex flex-wrap gap-1">
                    {vocabulary.synonyms.slice(0, 3).map((synonym, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">{synonym}</Badge>
                    ))}
                    {vocabulary.synonyms.length > 3 && (
                      <Badge variant="outline" className="text-xs">+{vocabulary.synonyms.length - 3}</Badge>
                    )}
                  </div>
                </div>
              )}

              {vocabulary.antonyms.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Từ trái nghĩa:</h4>
                  <div className="flex flex-wrap gap-1">
                    {vocabulary.antonyms.slice(0, 3).map((antonym, index) => (
                      <Badge key={index} variant="destructive" className="text-xs">{antonym}</Badge>
                    ))}
                    {vocabulary.antonyms.length > 3 && (
                      <Badge variant="outline" className="text-xs">+{vocabulary.antonyms.length - 3}</Badge>
                    )}
                  </div>
                </div>
              )}

              {vocabulary.questions && vocabulary.questions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Câu hỏi khảo bài:</h4>
                  <div className="space-y-2">
                    {vocabulary.questions.slice(0, 2).map((question, index) => (
                      <div key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        <div className="font-medium">{question.question}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {question.options.length} lựa chọn
                        </div>
                      </div>
                    ))}
                    {vocabulary.questions.length > 2 && (
                      <div className="text-xs text-gray-500">
                        ... và {vocabulary.questions.length - 2} câu hỏi khác
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500 pt-2 border-t">
                Tạo: {new Date(vocabulary.createdAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Từ vựng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nghĩa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cấp độ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chủ đề
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Câu hỏi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayVocabularies.map((vocabulary) => (
                <tr key={vocabulary._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-lg font-semibold text-gray-900">{vocabulary.word}</div>
                      <div className="text-sm text-blue-600">{vocabulary.pinyin}</div>
                      {vocabulary.zhuyin && (
                        <div className="text-xs text-gray-500">{vocabulary.zhuyin}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{vocabulary.meaning}</div>
                    <div className="text-xs text-gray-500">{vocabulary.partOfSpeech}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="secondary">Cấp {vocabulary.level}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {vocabulary.topics.slice(0, 2).map((topic, index) => (
                        <Badge key={index} variant="outline" className="text-xs">{topic}</Badge>
                      ))}
                      {vocabulary.topics.length > 2 && (
                        <Badge variant="outline" className="text-xs">+{vocabulary.topics.length - 2}</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {vocabulary.questions?.length || 0} câu
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {vocabulary.audio && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePlayAudio(vocabulary.audio!, vocabulary._id)}
                          disabled={audioLoading === vocabulary._id}
                        >
                          {audioLoading === vocabulary._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : isPlaying === vocabulary._id ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(vocabulary)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(vocabulary)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Trước
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Sau
            </Button>
          </div>
          <div className="text-sm text-gray-600">
            Trang {currentPage} / {totalPages}
          </div>
        </div>
      )}

      {displayVocabularies.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Không tìm thấy từ vựng nào
            </h3>
            <p className="text-gray-500">
              {searchTerm || levelFilter !== 'all' || topicFilter !== 'all' 
                ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                : 'Hãy thêm từ vựng đầu tiên'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
