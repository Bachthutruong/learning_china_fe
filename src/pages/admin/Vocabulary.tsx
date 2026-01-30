import { useEffect, useRef, useState } from 'react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { BookOpen, Plus, Edit, Trash2, Search, Download, Upload, Play, Pause, Grid3X3, Table, Loader2, FileSpreadsheet, X, CheckCircle, AlertCircle } from 'lucide-react'
import { api } from '../../services/api'
import toast from 'react-hot-toast'
import { AudioUpload } from '../../components/ui/audio-upload'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
    word: '', pinyin: '', zhuyin: '', meaning: '', partOfSpeech: '', level: 1,
    topics: [], examples: [], synonyms: [], antonyms: [], questions: []
  })
  const [formLoading, setFormLoading] = useState(false)
  const [newExample, setNewExample] = useState('')
  const [newSynonym, setNewSynonym] = useState('')
  const [newAntonym, setNewAntonym] = useState('')
  const [newQuestion, setNewQuestion] = useState('')
  const [newQuestionOptions, setNewQuestionOptions] = useState(['', '', '', ''])
  const [newQuestionCorrectAnswer, setNewQuestionCorrectAnswer] = useState(0)
  const [newQuestionExplanation, setNewQuestionExplanation] = useState('')
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null)
  const [editQuestion, setEditQuestion] = useState('')
  const [editQuestionOptions, setEditQuestionOptions] = useState(['', '', '', ''])
  const [editQuestionCorrectAnswer, setEditQuestionCorrectAnswer] = useState(0)
  const [editQuestionExplanation, setEditQuestionExplanation] = useState('')
  const [audioRemoved, setAudioRemoved] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [importing, setImporting] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importProgress, setImportProgress] = useState<{
    total: number; processed: number; created: number; updated: number
    errors: Array<{ row: number; message: string }>; createdTopics?: string[]
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [vocabularyToDelete, setVocabularyToDelete] = useState<Vocabulary | null>(null)

  useEffect(() => { fetchTopics(); fetchLevels() }, [])
  useEffect(() => { fetchVocabularies() }, [currentPage, itemsPerPage, levelFilter, topicFilter])

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage !== 1) setCurrentPage(1)
      else fetchVocabularies()
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const fetchVocabularies = async () => {
    try {
      setLoading(true)
      const res = await api.get('/admin/vocabularies', {
        params: {
          page: currentPage, limit: itemsPerPage, search: searchTerm,
          level: levelFilter !== 'all' ? levelFilter : undefined,
          topic: topicFilter !== 'all' ? topicFilter : undefined
        }
      })
      if (res.data.vocabularies) {
        setVocabularies(res.data.vocabularies)
        setTotalPages(res.data.totalPages || 1)
        setTotalItems(res.data.total || res.data.vocabularies.length)
      } else if (Array.isArray(res.data)) {
        setVocabularies(res.data)
        setTotalPages(1)
        setTotalItems(res.data.length)
      } else {
        setVocabularies([]); setTotalPages(1); setTotalItems(0)
      }
    } catch { toast.error('Không thể tải danh sách từ vựng'); setVocabularies([]) }
    finally { setLoading(false) }
  }

  const fetchTopics = async () => {
    try { const res = await api.get('/admin/topics'); setTopics(res.data || []) } catch {}
  }

  const fetchLevels = async () => {
    try { const res = await api.get('/admin/levels'); setLevels(res.data.levels || res.data || []) } catch {}
  }

  const handlePlayAudio = async (audioUrl: string, vocabularyId: string) => {
    try {
      setAudioLoading(vocabularyId)
      const url = audioUrl.startsWith('http') ? audioUrl : `${import.meta.env.VITE_API_URL || ''}${audioUrl}`
      const audio = new Audio(url)
      audio.onplay = () => { setIsPlaying(vocabularyId); setAudioLoading(null) }
      audio.onended = () => setIsPlaying(null)
      audio.onerror = () => { setAudioLoading(null); toast.error('Không thể phát âm thanh') }
      await audio.play()
    } catch { setAudioLoading(null); toast.error('Không thể phát âm thanh') }
  }

  const resetForm = () => {
    setFormData({ word: '', pinyin: '', zhuyin: '', meaning: '', partOfSpeech: '', level: 1, topics: [], examples: [], synonyms: [], antonyms: [], questions: [] })
    setNewExample(''); setNewSynonym(''); setNewAntonym(''); setNewQuestion('')
    setNewQuestionOptions(['', '', '', '']); setNewQuestionCorrectAnswer(0); setNewQuestionExplanation('')
  }

  const handleCreateVocabulary = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.word || !formData.pinyin || !formData.meaning) { toast.error('Vui lòng điền đầy đủ thông tin bắt buộc'); return }
    try {
      setFormLoading(true)
      const fd = new FormData()
      fd.append('word', formData.word); fd.append('pinyin', formData.pinyin); fd.append('zhuyin', formData.zhuyin)
      fd.append('meaning', formData.meaning); fd.append('partOfSpeech', formData.partOfSpeech)
      fd.append('level', formData.level.toString()); fd.append('topics', JSON.stringify(formData.topics))
      fd.append('examples', JSON.stringify(formData.examples)); fd.append('synonyms', JSON.stringify(formData.synonyms))
      fd.append('antonyms', JSON.stringify(formData.antonyms)); fd.append('questions', JSON.stringify(formData.questions))
      if (formData.image) fd.append('image', formData.image)
      if (formData.audio) fd.append('audio', formData.audio)
      await api.post('/admin/vocabularies', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Tạo từ vựng thành công!'); setShowCreateDialog(false); resetForm(); fetchVocabularies()
    } catch (error: any) { toast.error(error.response?.data?.message || 'Không thể tạo từ vựng') }
    finally { setFormLoading(false) }
  }

  const handleEditVocabulary = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingVocabulary) return
    try {
      setFormLoading(true)
      const fd = new FormData()
      fd.append('word', formData.word); fd.append('pinyin', formData.pinyin); fd.append('zhuyin', formData.zhuyin)
      fd.append('meaning', formData.meaning); fd.append('partOfSpeech', formData.partOfSpeech)
      fd.append('level', formData.level.toString()); fd.append('topics', JSON.stringify(formData.topics))
      fd.append('examples', JSON.stringify(formData.examples)); fd.append('synonyms', JSON.stringify(formData.synonyms))
      fd.append('antonyms', JSON.stringify(formData.antonyms)); fd.append('questions', JSON.stringify(formData.questions))
      if (formData.image) fd.append('image', formData.image)
      if (formData.audio) fd.append('audio', formData.audio)
      await api.put(`/admin/vocabularies/${editingVocabulary._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Cập nhật từ vựng thành công!'); setShowEditDialog(false); setEditingVocabulary(null); resetForm(); fetchVocabularies()
    } catch (error: any) { toast.error(error.response?.data?.message || 'Không thể cập nhật từ vựng') }
    finally { setFormLoading(false) }
  }

  const openEditDialog = (vocabulary: Vocabulary) => {
    setEditingVocabulary(vocabulary)
    setFormData({
      word: vocabulary.word, pinyin: vocabulary.pinyin, zhuyin: vocabulary.zhuyin || '',
      meaning: vocabulary.meaning, partOfSpeech: vocabulary.partOfSpeech, level: vocabulary.level,
      topics: vocabulary.topics, examples: vocabulary.examples || [], synonyms: vocabulary.synonyms || [],
      antonyms: vocabulary.antonyms || [], questions: (vocabulary as any).questions || [], audio: undefined
    })
    setAudioRemoved(false)
    setShowEditDialog(true)
  }

  const openDeleteDialog = (vocabulary: Vocabulary) => { setVocabularyToDelete(vocabulary); setShowDeleteDialog(true) }

  const handleDeleteVocabulary = async () => {
    if (!vocabularyToDelete) return
    try {
      await api.delete(`/admin/vocabularies/${vocabularyToDelete._id}`)
      toast.success('Xóa từ vựng thành công!'); setShowDeleteDialog(false); setVocabularyToDelete(null); fetchVocabularies()
    } catch (error: any) { toast.error(error.response?.data?.message || 'Không thể xóa từ vựng') }
  }

  // Example / Synonym / Antonym helpers
  const addExample = () => { if (newExample.trim()) { setFormData(prev => ({ ...prev, examples: [...prev.examples, newExample.trim()] })); setNewExample('') } }
  const removeExample = (i: number) => setFormData(prev => ({ ...prev, examples: prev.examples.filter((_, idx) => idx !== i) }))
  const addSynonym = () => { if (newSynonym.trim()) { setFormData(prev => ({ ...prev, synonyms: [...prev.synonyms, newSynonym.trim()] })); setNewSynonym('') } }
  const removeSynonym = (i: number) => setFormData(prev => ({ ...prev, synonyms: prev.synonyms.filter((_, idx) => idx !== i) }))
  const addAntonym = () => { if (newAntonym.trim()) { setFormData(prev => ({ ...prev, antonyms: [...prev.antonyms, newAntonym.trim()] })); setNewAntonym('') } }
  const removeAntonym = (i: number) => setFormData(prev => ({ ...prev, antonyms: prev.antonyms.filter((_, idx) => idx !== i) }))

  // Quiz question helpers
  const addQuestion = () => {
    if (newQuestion.trim() && newQuestionOptions.every(opt => opt.trim())) {
      setFormData(prev => ({ ...prev, questions: [...prev.questions, { question: newQuestion.trim(), options: newQuestionOptions.map(o => o.trim()), correctAnswer: newQuestionCorrectAnswer, explanation: newQuestionExplanation.trim() || undefined }] }))
      setNewQuestion(''); setNewQuestionOptions(['', '', '', '']); setNewQuestionCorrectAnswer(0); setNewQuestionExplanation('')
    }
  }
  const removeQuestion = (i: number) => setFormData(prev => ({ ...prev, questions: prev.questions.filter((_, idx) => idx !== i) }))
  const startEditQuestion = (i: number) => {
    const q = formData.questions[i]
    setEditingQuestionIndex(i); setEditQuestion(q.question); setEditQuestionOptions([...q.options]); setEditQuestionCorrectAnswer(q.correctAnswer); setEditQuestionExplanation(q.explanation || '')
  }
  const saveEditQuestion = () => {
    if (editingQuestionIndex !== null && editQuestion.trim() && editQuestionOptions.every(o => o.trim())) {
      const updated = [...formData.questions]
      updated[editingQuestionIndex] = { question: editQuestion.trim(), options: editQuestionOptions.map(o => o.trim()), correctAnswer: editQuestionCorrectAnswer, explanation: editQuestionExplanation.trim() || undefined }
      setFormData(prev => ({ ...prev, questions: updated }))
      cancelEditQuestion()
    }
  }
  const cancelEditQuestion = () => { setEditingQuestionIndex(null); setEditQuestion(''); setEditQuestionOptions(['', '', '', '']); setEditQuestionCorrectAnswer(0); setEditQuestionExplanation('') }

  // Import
  const onFileSelected = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0]; if (!file) return
    setImporting(true); setImportProgress({ total: 0, processed: 0, created: 0, updated: 0, errors: [] })
    try {
      const form = new FormData(); form.append('file', file)
      const progressInterval = setInterval(() => {
        setImportProgress(prev => prev ? { ...prev, processed: Math.min(prev.processed + 1, prev.total) } : null)
      }, 100)
      const res = await api.post('/admin/vocabularies/import', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      clearInterval(progressInterval)
      const { created = 0, updated = 0, errors = [], createdTopics = [] } = res.data || {}
      setImportProgress({ total: created + updated + errors.length, processed: created + updated + errors.length, created, updated, errors, createdTopics })
      if (errors.length === 0) {
        toast.success(`Import thành công: +${created} mới, cập nhật ${updated}${createdTopics.length ? `, tạo ${createdTopics.length} chủ đề mới` : ''}`)
        fetchVocabularies(); fetchTopics()
      } else {
        toast.error(`Import hoàn tất với ${errors.length} lỗi: +${created} mới, cập nhật ${updated}`)
      }
    } catch (e: any) {
      setImportProgress(prev => prev ? { ...prev, errors: [{ row: 0, message: e?.response?.data?.message || 'Import thất bại' }] } : null)
      toast.error(e?.response?.data?.message || 'Import thất bại')
    } finally { setImporting(false); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  const downloadTemplate = async () => {
    try {
      const res = await api.get('/admin/vocabularies/template', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a'); link.href = url; link.setAttribute('download', 'vocabularies_template.xlsx')
      document.body.appendChild(link); link.click(); link.remove()
    } catch { toast.error('Tải template thất bại') }
  }

  // --- Form fields renderer (shared between create & edit) ---
  const renderFormFields = (isEdit: boolean) => (
    <>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Hán tự *</Label>
          <Input value={formData.word} onChange={e => setFormData(prev => ({ ...prev, word: e.target.value }))} placeholder="你好" required className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>Pinyin *</Label>
          <Input value={formData.pinyin} onChange={e => setFormData(prev => ({ ...prev, pinyin: e.target.value }))} placeholder="nǐ hǎo" required className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>Chú âm (Zhuyin)</Label>
          <Input value={formData.zhuyin} onChange={e => setFormData(prev => ({ ...prev, zhuyin: e.target.value }))} placeholder="ㄋㄧˇ ㄏㄠˇ" className="rounded-xl" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Ý nghĩa *</Label>
        <Input value={formData.meaning} onChange={e => setFormData(prev => ({ ...prev, meaning: e.target.value }))} placeholder="Xin chào" required className="rounded-xl" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Từ loại</Label>
          <Select value={formData.partOfSpeech} onValueChange={v => setFormData(prev => ({ ...prev, partOfSpeech: v }))}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Chọn từ loại" /></SelectTrigger>
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
          <Label>Cấp độ</Label>
          <Select value={formData.level.toString()} onValueChange={v => setFormData(prev => ({ ...prev, level: parseInt(v) }))}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {levels.map(l => (
                <SelectItem key={l._id} value={(l.level ?? l.number).toString()}>Cấp {l.level || l.number}: {l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Chủ đề</Label>
        <div className="flex flex-wrap gap-2">
          {topics.map(topic => (
            <Button key={topic._id} type="button" variant={formData.topics.includes(topic.name) ? 'default' : 'outline'} size="sm" className="rounded-xl"
              onClick={() => {
                if (formData.topics.includes(topic.name)) setFormData(prev => ({ ...prev, topics: prev.topics.filter(t => t !== topic.name) }))
                else setFormData(prev => ({ ...prev, topics: [...prev.topics, topic.name] }))
              }}>
              <div className={`w-2 h-2 rounded-full ${topic.color} mr-2`} />{topic.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Hình ảnh</Label>
        <Input type="file" accept="image/*" className="rounded-xl" onChange={e => { const f = e.target.files?.[0]; if (f) setFormData(prev => ({ ...prev, image: f })) }} />
        {formData.image && <div className="text-sm text-green-600">Đã chọn: {formData.image.name}</div>}
        {isEdit && editingVocabulary?.imageUrl && !formData.image && (
          <div className="text-sm text-gray-500">Hình ảnh hiện tại: <a href={editingVocabulary.imageUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Xem</a></div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Âm thanh</Label>
        <AudioUpload
          value={isEdit ? (audioRemoved ? null : (formData.audio || editingVocabulary?.audioUrl)) : formData.audio}
          onChange={file => {
            if (file === null) { setAudioRemoved(true); setFormData(prev => ({ ...prev, audio: undefined })) }
            else { setAudioRemoved(false); setFormData(prev => ({ ...prev, audio: file || undefined })) }
          }}
          maxSize={10} accept="audio/*"
        />
        {isEdit && editingVocabulary?.audioUrl && !formData.audio && !audioRemoved && (
          <div className="text-sm text-gray-500">Âm thanh hiện tại: {editingVocabulary.audioUrl.split('/').pop()}</div>
        )}
        {audioRemoved && <div className="text-sm text-red-500">File âm thanh đã được xóa.</div>}
      </div>

      {/* Examples */}
      <div className="space-y-2">
        <Label>Ví dụ</Label>
        <div className="space-y-2">
          {formData.examples.map((ex, i) => (
            <div key={i} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl">
              <span className="text-sm flex-1">{ex}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeExample(i)}><X className="h-4 w-4" /></Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input value={newExample} onChange={e => setNewExample(e.target.value)} placeholder="Thêm ví dụ..." className="rounded-xl"
              onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addExample())} />
            <Button type="button" onClick={addExample} disabled={!newExample.trim()} className="rounded-xl"><Plus className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      {/* Synonyms */}
      <div className="space-y-2">
        <Label>Từ đồng nghĩa</Label>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {formData.synonyms.map((s, i) => (
              <div key={i} className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-xl">
                <Badge variant="secondary" className="text-xs">{s}</Badge>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeSynonym(i)} className="h-5 w-5 p-0"><X className="h-3 w-3" /></Button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={newSynonym} onChange={e => setNewSynonym(e.target.value)} placeholder="Thêm từ đồng nghĩa..." className="rounded-xl"
              onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addSynonym())} />
            <Button type="button" onClick={addSynonym} disabled={!newSynonym.trim()} className="rounded-xl"><Plus className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      {/* Antonyms */}
      <div className="space-y-2">
        <Label>Từ trái nghĩa</Label>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {formData.antonyms.map((a, i) => (
              <div key={i} className="flex items-center gap-1 bg-red-50 px-3 py-1 rounded-xl">
                <Badge variant="destructive" className="text-xs">{a}</Badge>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeAntonym(i)} className="h-5 w-5 p-0"><X className="h-3 w-3" /></Button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={newAntonym} onChange={e => setNewAntonym(e.target.value)} placeholder="Thêm từ trái nghĩa..." className="rounded-xl"
              onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addAntonym())} />
            <Button type="button" onClick={addAntonym} disabled={!newAntonym.trim()} className="rounded-xl"><Plus className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      {/* Quiz Questions */}
      <div className="space-y-3">
        <Label>Câu hỏi khảo bài</Label>
        {formData.questions.map((q, i) => (
          <div key={i} className="bg-gray-50 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-gray-400">Câu hỏi {i + 1}</span>
              <div className="flex gap-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => startEditQuestion(i)}><Edit className="h-4 w-4" /></Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeQuestion(i)}><X className="h-4 w-4" /></Button>
              </div>
            </div>
            <p className="text-sm font-bold">{q.question}</p>
            <div className="grid grid-cols-2 gap-2">
              {q.options.map((opt, oi) => (
                <div key={oi} className={`px-3 py-2 rounded-xl text-sm ${oi === q.correctAnswer ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-white border'}`}>
                  {String.fromCharCode(65 + oi)}. {opt}
                </div>
              ))}
            </div>
            {q.explanation && <p className="text-xs text-gray-500">Giải thích: {q.explanation}</p>}
          </div>
        ))}

        {/* Edit question form */}
        {editingQuestionIndex !== null && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 space-y-3">
            <span className="text-[10px] font-black uppercase text-blue-600">Chỉnh sửa câu hỏi {editingQuestionIndex + 1}</span>
            <Input value={editQuestion} onChange={e => setEditQuestion(e.target.value)} placeholder="Nhập câu hỏi..." className="rounded-xl" />
            <div className="space-y-2">
              {editQuestionOptions.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-6 text-sm font-bold">{String.fromCharCode(65 + i)}.</span>
                  <Input value={opt} onChange={e => { const o = [...editQuestionOptions]; o[i] = e.target.value; setEditQuestionOptions(o) }} placeholder={`Lựa chọn ${String.fromCharCode(65 + i)}`} className="rounded-xl" />
                  <Button type="button" variant={editQuestionCorrectAnswer === i ? 'default' : 'outline'} size="sm" onClick={() => setEditQuestionCorrectAnswer(i)} className="rounded-xl">Đúng</Button>
                </div>
              ))}
            </div>
            <Input value={editQuestionExplanation} onChange={e => setEditQuestionExplanation(e.target.value)} placeholder="Giải thích (tùy chọn)" className="rounded-xl" />
            <div className="flex gap-2">
              <Button type="button" onClick={saveEditQuestion} disabled={!editQuestion.trim() || !editQuestionOptions.every(o => o.trim())} className="rounded-xl chinese-gradient text-white">Lưu</Button>
              <Button type="button" variant="ghost" onClick={cancelEditQuestion} className="rounded-xl">Hủy</Button>
            </div>
          </div>
        )}

        {/* Add new question */}
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 space-y-3">
          <span className="text-[10px] font-black uppercase text-gray-400">Thêm câu hỏi mới</span>
          <Input value={newQuestion} onChange={e => setNewQuestion(e.target.value)} placeholder="Nhập câu hỏi..." className="rounded-xl" />
          <div className="space-y-2">
            {newQuestionOptions.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-6 text-sm font-bold">{String.fromCharCode(65 + i)}.</span>
                <Input value={opt} onChange={e => { const o = [...newQuestionOptions]; o[i] = e.target.value; setNewQuestionOptions(o) }} placeholder={`Lựa chọn ${String.fromCharCode(65 + i)}`} className="rounded-xl" />
                <Button type="button" variant={newQuestionCorrectAnswer === i ? 'default' : 'outline'} size="sm" onClick={() => setNewQuestionCorrectAnswer(i)} className="rounded-xl">Đúng</Button>
              </div>
            ))}
          </div>
          <Input value={newQuestionExplanation} onChange={e => setNewQuestionExplanation(e.target.value)} placeholder="Giải thích (tùy chọn)" className="rounded-xl" />
          <Button type="button" onClick={addQuestion} disabled={!newQuestion.trim() || !newQuestionOptions.every(o => o.trim())} className="w-full rounded-xl">
            <Plus className="h-4 w-4 mr-2" /> Thêm câu hỏi
          </Button>
        </div>
      </div>
    </>
  )

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-black text-gray-900 flex items-center"><BookOpen className="w-8 h-8 mr-3 text-primary" /> Kho từ vựng</h1></div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={downloadTemplate} className="rounded-xl"><Download className="mr-2 h-4 w-4" /> Template</Button>
          <Button variant="outline" onClick={() => { setShowImportDialog(true); setImportProgress(null) }} disabled={importing} className="rounded-xl"><Upload className="mr-2 h-4 w-4" /> Import Excel</Button>
          <Button onClick={() => { resetForm(); setEditingVocabulary(null); setShowCreateDialog(true) }} className="chinese-gradient text-white rounded-xl"><Plus className="mr-2" /> Thêm mới</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-[2rem] border shadow-xl flex gap-6 items-center flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Tìm kiếm..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-11 rounded-xl" />
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-32 rounded-xl"><SelectValue placeholder="HSK" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {levels.map(l => <SelectItem key={l._id} value={(l.level ?? l.number).toString()}>HSK {l.level || l.number}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={topicFilter} onValueChange={setTopicFilter}>
          <SelectTrigger className="w-40 rounded-xl"><SelectValue placeholder="Chủ đề" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {topics.map(t => <SelectItem key={t._id} value={t.name}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-gray-400 uppercase">Hiển thị</span>
          <Select value={itemsPerPage.toString()} onValueChange={v => { setItemsPerPage(parseInt(v)); setCurrentPage(1) }}>
            <SelectTrigger className="w-20 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="12">12</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="bg-gray-100 p-1 rounded-xl flex">
          <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="icon" onClick={() => setViewMode('grid')}><Grid3X3 /></Button>
          <Button variant={viewMode === 'table' ? 'default' : 'ghost'} size="icon" onClick={() => setViewMode('table')}><Table /></Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-[2.5rem] border shadow-sm animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : viewMode === 'grid' ? (
        vocabularies.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] border shadow-xl py-20 text-center">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-black text-gray-400">Không tìm thấy từ vựng nào</h3>
            <p className="text-sm text-gray-400 mt-1">
              {searchTerm || levelFilter !== 'all' || topicFilter !== 'all' ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm' : 'Hãy thêm từ vựng đầu tiên'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {vocabularies.map(v => (
              <div key={v._id} className="bg-white p-6 rounded-[2.5rem] border shadow-sm group hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="text-2xl font-black">{v.word}</div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(v)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(v)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
                <p className="text-primary font-black uppercase text-xs mt-2">{v.pinyin}</p>
                {v.zhuyin && <p className="text-gray-400 text-xs">{v.zhuyin}</p>}
                <p className="font-bold text-gray-900 mt-1">{v.meaning}</p>

                {v.partOfSpeech && <Badge variant="outline" className="mt-2 text-xs rounded-lg">{v.partOfSpeech}</Badge>}

                {v.topics && v.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {v.topics.slice(0, 3).map((t, i) => <Badge key={i} variant="outline" className="text-[10px] rounded-lg">{t}</Badge>)}
                    {v.topics.length > 3 && <Badge variant="outline" className="text-[10px] rounded-lg">+{v.topics.length - 3}</Badge>}
                  </div>
                )}

                {v.examples && v.examples.length > 0 && (
                  <div className="mt-3 text-xs text-gray-500 space-y-0.5">
                    {v.examples.slice(0, 2).map((ex, i) => <p key={i}>• {ex}</p>)}
                    {v.examples.length > 2 && <p className="text-gray-400">... +{v.examples.length - 2}</p>}
                  </div>
                )}

                {v.synonyms && v.synonyms.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {v.synonyms.slice(0, 3).map((s, i) => <Badge key={i} variant="secondary" className="text-[10px]">{s}</Badge>)}
                    {v.synonyms.length > 3 && <Badge variant="outline" className="text-[10px]">+{v.synonyms.length - 3}</Badge>}
                  </div>
                )}

                {v.antonyms && v.antonyms.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {v.antonyms.slice(0, 3).map((a, i) => <Badge key={i} variant="destructive" className="text-[10px]">{a}</Badge>)}
                    {v.antonyms.length > 3 && <Badge variant="outline" className="text-[10px]">+{v.antonyms.length - 3}</Badge>}
                  </div>
                )}

                <div className="mt-6 pt-4 border-t flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-gray-300">HSK {v.level}</span>
                    {v.questions && v.questions.length > 0 && <span className="text-[10px] text-gray-300">• {v.questions.length} câu hỏi</span>}
                  </div>
                  {(v.audio || v.audioUrl) && (
                    <button onClick={() => handlePlayAudio((v.audio || v.audioUrl)!, v._id)}
                      disabled={audioLoading === v._id}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${isPlaying === v._id ? 'chinese-gradient text-white' : audioLoading === v._id ? 'bg-gray-100' : 'bg-gray-50'}`}>
                      {audioLoading === v._id ? <Loader2 className="w-3 animate-spin" /> : isPlaying === v._id ? <Pause className="w-3" /> : <Play className="w-3" />}
                    </button>
                  )}
                </div>
                {v.createdAt && <p className="text-[10px] text-gray-300 mt-2">Tạo: {new Date(v.createdAt).toLocaleDateString()}</p>}
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="bg-white rounded-[2.5rem] border shadow-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b">
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400">Từ vựng</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400">Nghĩa</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 text-center">Trình độ</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400">Chủ đề</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 text-center">Câu hỏi</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {vocabularies.map(v => (
                <tr key={v._id} className="group hover:bg-gray-50/50">
                  <td className="px-8 py-6">
                    <div className="text-lg font-black">{v.word}</div>
                    <div className="text-xs font-bold text-primary">{v.pinyin}</div>
                    {v.zhuyin && <div className="text-xs text-gray-400">{v.zhuyin}</div>}
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-sm font-bold">{v.meaning}</div>
                    {v.partOfSpeech && <div className="text-xs text-gray-400">{v.partOfSpeech}</div>}
                  </td>
                  <td className="px-8 py-6 text-center"><Badge className="bg-primary/5 text-primary border-none">HSK {v.level}</Badge></td>
                  <td className="px-8 py-6">
                    <div className="flex flex-wrap gap-1">
                      {v.topics?.slice(0, 2).map((t, i) => <Badge key={i} variant="outline" className="text-xs">{t}</Badge>)}
                      {v.topics && v.topics.length > 2 && <Badge variant="outline" className="text-xs">+{v.topics.length - 2}</Badge>}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center text-sm text-gray-500">{v.questions?.length || 0} câu</td>
                  <td className="px-8 py-6 text-right space-x-1">
                    {(v.audio || v.audioUrl) && (
                      <Button variant="ghost" size="sm" onClick={() => handlePlayAudio((v.audio || v.audioUrl)!, v._id)} disabled={audioLoading === v._id}>
                        {audioLoading === v._id ? <Loader2 className="h-4 w-4 animate-spin" /> : isPlaying === v._id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(v)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(v)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                  </td>
                </tr>
              ))}
              {vocabularies.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-gray-400 font-bold">Không tìm thấy từ vựng nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">Hiển thị {vocabularies.length} trong {totalItems} từ vựng</span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="rounded-xl font-bold">Trước</Button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let page: number
            if (totalPages <= 5) page = i + 1
            else if (currentPage <= 3) page = i + 1
            else if (currentPage >= totalPages - 2) page = totalPages - 4 + i
            else page = currentPage - 2 + i
            return (
              <Button key={page} variant={currentPage === page ? 'default' : 'ghost'} size="sm" onClick={() => setCurrentPage(page)}
                className={`rounded-xl font-black ${currentPage === page ? 'chinese-gradient text-white' : ''}`}>{page}</Button>
            )
          })}
          <Button variant="ghost" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="rounded-xl font-bold">Tiếp</Button>
        </div>
        <span className="bg-white px-4 py-2 rounded-xl border font-black text-sm">Trang {currentPage}/{totalPages}</span>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="rounded-[2.5rem] p-10 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black">Thêm từ vựng mới</DialogTitle>
            <DialogDescription>Tạo từ vựng mới với đầy đủ thông tin và âm thanh</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateVocabulary} className="space-y-6">
            {renderFormFields(false)}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={() => setShowCreateDialog(false)} className="rounded-xl font-bold text-gray-400">Hủy</Button>
              <Button type="submit" disabled={formLoading} className="flex-1 chinese-gradient text-white rounded-xl h-12 font-black">
                {formLoading ? <Loader2 className="animate-spin" /> : 'Tạo từ vựng'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="rounded-[2.5rem] p-10 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black">Chỉnh sửa từ vựng</DialogTitle>
            <DialogDescription>Cập nhật thông tin từ vựng</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditVocabulary} className="space-y-6">
            {renderFormFields(true)}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={() => setShowEditDialog(false)} className="rounded-xl font-bold text-gray-400">Hủy</Button>
              <Button type="submit" disabled={formLoading} className="flex-1 chinese-gradient text-white rounded-xl h-12 font-black">
                {formLoading ? <Loader2 className="animate-spin" /> : 'Cập nhật'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="rounded-[2.5rem] p-10 max-w-2xl">
          <DialogHeader className="text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-500"><FileSpreadsheet className="w-8 h-8" /></div>
            <DialogTitle className="text-3xl font-black">Import dữ liệu</DialogTitle>
            <DialogDescription>Tải lên file Excel để import nhiều từ vựng cùng lúc. Hệ thống sẽ tự động tạo chủ đề mới nếu chưa có.</DialogDescription>
          </DialogHeader>

          {!importProgress ? (
            <div onClick={() => fileInputRef.current?.click()}
              className="aspect-video rounded-[2.5rem] border-2 border-dashed border-gray-100 bg-gray-50/50 hover:border-primary/30 flex flex-col items-center justify-center cursor-pointer group">
              {importing ? <Loader2 className="w-10 h-10 animate-spin text-primary" /> : (
                <>
                  <Upload className="w-10 h-10 text-gray-300 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-bold text-gray-400">Click để chọn tệp Excel (.xlsx, .xls)</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold text-gray-500">
                  <span>Tiến độ import</span>
                  <span>{importProgress.processed}/{importProgress.total}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="chinese-gradient h-2 rounded-full transition-all duration-300"
                    style={{ width: `${importProgress.total > 0 ? (importProgress.processed / importProgress.total) * 100 : 0}%` }} />
                </div>
              </div>

              {/* Results */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-5 bg-green-50 rounded-2xl">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-black text-green-600">{importProgress.created}</div>
                  <div className="text-[10px] font-black uppercase text-green-500">Tạo mới</div>
                </div>
                <div className="text-center p-5 bg-blue-50 rounded-2xl">
                  <CheckCircle className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-black text-blue-600">{importProgress.updated}</div>
                  <div className="text-[10px] font-black uppercase text-blue-500">Cập nhật</div>
                </div>
                <div className="text-center p-5 bg-red-50 rounded-2xl">
                  <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <div className="text-2xl font-black text-red-600">{importProgress.errors.length}</div>
                  <div className="text-[10px] font-black uppercase text-red-500">Lỗi</div>
                </div>
              </div>

              {/* Created Topics */}
              {importProgress.createdTopics && importProgress.createdTopics.length > 0 && (
                <div className="p-4 bg-yellow-50 rounded-2xl">
                  <p className="text-[10px] font-black uppercase text-yellow-600 mb-2">Chủ đề mới được tạo:</p>
                  <div className="flex flex-wrap gap-2">
                    {importProgress.createdTopics.map((t, i) => <Badge key={i} variant="secondary" className="bg-yellow-100 text-yellow-800">{t}</Badge>)}
                  </div>
                </div>
              )}

              {/* Errors */}
              {importProgress.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-red-500">Chi tiết lỗi:</p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {importProgress.errors.map((err, i) => (
                      <div key={i} className="text-sm text-red-700 bg-red-50 p-2 rounded-xl">
                        <span className="font-bold">Dòng {err.row}:</span> {err.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => { setShowImportDialog(false); setImportProgress(null); fetchVocabularies(); fetchTopics() }}
                  className="flex-1 rounded-xl font-bold text-gray-400">Đóng</Button>
                {importProgress.errors.length > 0 && (
                  <Button onClick={() => setImportProgress(null)} className="rounded-xl font-bold">Import lại</Button>
                )}
              </div>
            </div>
          )}

          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onFileSelected} />
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="rounded-[2.5rem] p-10 text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Xóa từ vựng?</DialogTitle>
            <DialogDescription>Từ <span className="font-bold">{vocabularyToDelete?.word}</span> sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-8">
            <Button onClick={handleDeleteVocabulary} disabled={formLoading} className="h-12 rounded-xl font-black text-white bg-red-500 hover:bg-red-600">
              {formLoading ? <Loader2 className="animate-spin" /> : 'Xóa'}
            </Button>
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)} className="h-12 rounded-xl font-bold">Hủy</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
