import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  
  Play,
  Pause,
  Loader2,
  X
} from 'lucide-react'
import { api } from '../../services/api'
import toast from 'react-hot-toast'

interface Vocabulary {
  _id: string
  word: string
  pronunciation: string
  meaning: string
  partOfSpeech: string
  level: number
  topics: string[]
  examples: string[]
  synonyms: string[]
  antonyms: string[]
  audio?: string
  createdAt: string
  updatedAt: string
}

interface Topic {
  _id: string
  name: string
  color: string
  description: string
}

interface VocabularyFormData {
  word: string
  pronunciation: string
  meaning: string
  partOfSpeech: string
  level: number
  topics: string[]
  examples: string[]
  synonyms: string[]
  antonyms: string[]
  audio?: File
}

export const AdminVocabulary = () => {
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
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
    pronunciation: '',
    meaning: '',
    partOfSpeech: '',
    level: 1,
    topics: [],
    examples: [],
    synonyms: [],
    antonyms: []
  })
  const [formLoading, setFormLoading] = useState(false)
  const [newExample, setNewExample] = useState('')
  const [newSynonym, setNewSynonym] = useState('')
  const [newAntonym, setNewAntonym] = useState('')

  useEffect(() => {
    fetchVocabularies()
    fetchTopics()
  }, [])

  const fetchVocabularies = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/vocabularies')
      setVocabularies(response.data.vocabularies || response.data || [])
    } catch (error) {
      console.error('Error fetching vocabularies:', error)
      toast.error('Không thể tải danh sách từ vựng')
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

  const handleCreateVocabulary = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.word || !formData.pronunciation || !formData.meaning) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    try {
      setFormLoading(true)
      const formDataToSend = new FormData()
      formDataToSend.append('word', formData.word)
      formDataToSend.append('pronunciation', formData.pronunciation)
      formDataToSend.append('meaning', formData.meaning)
      formDataToSend.append('partOfSpeech', formData.partOfSpeech)
      formDataToSend.append('level', formData.level.toString())
      formDataToSend.append('topics', JSON.stringify(formData.topics))
      formDataToSend.append('examples', JSON.stringify(formData.examples))
      formDataToSend.append('synonyms', JSON.stringify(formData.synonyms))
      formDataToSend.append('antonyms', JSON.stringify(formData.antonyms))
      
      if (formData.audio) {
        formDataToSend.append('audio', formData.audio)
      }

      await api.post('/admin/vocabularies', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
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
      formDataToSend.append('pronunciation', formData.pronunciation)
      formDataToSend.append('meaning', formData.meaning)
      formDataToSend.append('partOfSpeech', formData.partOfSpeech)
      formDataToSend.append('level', formData.level.toString())
      formDataToSend.append('topics', JSON.stringify(formData.topics))
      formDataToSend.append('examples', JSON.stringify(formData.examples))
      formDataToSend.append('synonyms', JSON.stringify(formData.synonyms))
      formDataToSend.append('antonyms', JSON.stringify(formData.antonyms))
      
      if (formData.audio) {
        formDataToSend.append('audio', formData.audio)
      }

      await api.put(`/admin/vocabularies/${editingVocabulary._id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
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

  const handleDeleteVocabulary = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa từ vựng này?')) return

    try {
      await api.delete(`/admin/vocabularies/${id}`)
      toast.success('Xóa từ vựng thành công!')
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
      pronunciation: '',
      meaning: '',
      partOfSpeech: '',
      level: 1,
      topics: [],
      examples: [],
      synonyms: [],
      antonyms: []
    })
    setNewExample('')
    setNewSynonym('')
    setNewAntonym('')
  }

  const openEditDialog = (vocabulary: Vocabulary) => {
    setEditingVocabulary(vocabulary)
    setFormData({
      word: vocabulary.word,
      pronunciation: vocabulary.pronunciation,
      meaning: vocabulary.meaning,
      partOfSpeech: vocabulary.partOfSpeech,
      level: vocabulary.level,
      topics: vocabulary.topics,
      examples: vocabulary.examples,
      synonyms: vocabulary.synonyms,
      antonyms: vocabulary.antonyms
    })
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

  const filteredVocabularies = vocabularies.filter(vocabulary => {
    const matchesSearch = vocabulary.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vocabulary.meaning.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLevel = levelFilter === 'all' || vocabulary.level.toString() === levelFilter
    const matchesTopic = topicFilter === 'all' || vocabulary.topics.includes(topicFilter)
    
    return matchesSearch && matchesLevel && matchesTopic
  })

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
                  <Label htmlFor="pronunciation">Phiên âm *</Label>
                  <Input
                    id="pronunciation"
                    value={formData.pronunciation}
                    onChange={(e) => setFormData(prev => ({ ...prev, pronunciation: e.target.value }))}
                    placeholder="nǐ hǎo"
                    required
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
                      <SelectItem value="1">Cấp 1</SelectItem>
                      <SelectItem value="2">Cấp 2</SelectItem>
                      <SelectItem value="3">Cấp 3</SelectItem>
                      <SelectItem value="4">Cấp 4</SelectItem>
                      <SelectItem value="5">Cấp 5</SelectItem>
                      <SelectItem value="6">Cấp 6</SelectItem>
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
                <Label htmlFor="audio">File âm thanh</Label>
                <Input
                  id="audio"
                  type="file"
                  accept="audio/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setFormData(prev => ({ ...prev, audio: e.target.files![0] }))
                    }
                  }}
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
                  <Label htmlFor="edit-pronunciation">Phiên âm *</Label>
                  <Input
                    id="edit-pronunciation"
                    value={formData.pronunciation}
                    onChange={(e) => setFormData(prev => ({ ...prev, pronunciation: e.target.value }))}
                    placeholder="nǐ hǎo"
                    required
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
                      <SelectItem value="1">Cấp 1</SelectItem>
                      <SelectItem value="2">Cấp 2</SelectItem>
                      <SelectItem value="3">Cấp 3</SelectItem>
                      <SelectItem value="4">Cấp 4</SelectItem>
                      <SelectItem value="5">Cấp 5</SelectItem>
                      <SelectItem value="6">Cấp 6</SelectItem>
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
                <Label htmlFor="edit-audio">File âm thanh mới (tùy chọn)</Label>
                <Input
                  id="edit-audio"
                  type="file"
                  accept="audio/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setFormData(prev => ({ ...prev, audio: e.target.files![0] }))
                    }
                  }}
                />
                {editingVocabulary?.audio && (
                  <div className="text-sm text-gray-600">
                    Âm thanh hiện tại: {editingVocabulary.audio.split('/').pop()}
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
            <SelectItem value="1">Cấp 1</SelectItem>
            <SelectItem value="2">Cấp 2</SelectItem>
            <SelectItem value="3">Cấp 3</SelectItem>
            <SelectItem value="4">Cấp 4</SelectItem>
            <SelectItem value="5">Cấp 5</SelectItem>
            <SelectItem value="6">Cấp 6</SelectItem>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVocabularies.map((vocabulary) => (
          <Card key={vocabulary._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    {vocabulary.word}
                  </CardTitle>
                  <CardDescription className="text-lg text-blue-600">
                    {vocabulary.pronunciation}
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
                    onClick={() => handleDeleteVocabulary(vocabulary._id)}
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

              <div className="text-xs text-gray-500 pt-2 border-t">
                Tạo: {new Date(vocabulary.createdAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVocabularies.length === 0 && (
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
