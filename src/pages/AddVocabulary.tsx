import { useState, useEffect } from 'react'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { 
  // ArrowLeft,
  Plus, 
  Search,
  BookOpen,
  Tag,
  
  Loader2
} from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'

interface PersonalTopic {
  _id: string
  name: string
  description: string
  vocabularyCount: number
  createdAt: string
  updatedAt: string
}

interface SystemCategory {
  _id: string
  name: string
  description: string
  vocabularyCount: number
}

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
  audioUrl?: string
}

interface AddVocabularyProps {
  inDialog?: boolean
  onClose?: () => void
  initialSelectedPersonalTopics?: string[]
}

export const AddVocabulary = ({ inDialog, initialSelectedPersonalTopics }: AddVocabularyProps) => {
  const [personalTopics, setPersonalTopics] = useState<PersonalTopic[]>([])
  const [systemCategories, setSystemCategories] = useState<SystemCategory[]>([])
  const [selectedPersonalTopics, setSelectedPersonalTopics] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [availableVocabularies, setAvailableVocabularies] = useState<Vocabulary[]>([])
  const [selectedVocabularies, setSelectedVocabularies] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateTopicDialog, setShowCreateTopicDialog] = useState(false)
  const [newTopicName, setNewTopicName] = useState('')
  const [newTopicDescription, setNewTopicDescription] = useState('')

  useEffect(() => {
    fetchPersonalTopics()
    fetchSystemCategories()
  }, [])

  // Preselect personal topics when provided (e.g., opened from VocabularyLearning with a chosen topic)
  useEffect(() => {
    if (initialSelectedPersonalTopics && initialSelectedPersonalTopics.length > 0) {
      setSelectedPersonalTopics(initialSelectedPersonalTopics)
    }
  }, [initialSelectedPersonalTopics])

  useEffect(() => {
    if (selectedCategories.length > 0) {
      fetchVocabulariesByCategories()
    } else {
      setAvailableVocabularies([])
    }
  }, [selectedCategories, searchTerm])

  const fetchPersonalTopics = async () => {
    try {
      const response = await api.get('/vocabulary-learning/user/personal-topics')
      setPersonalTopics(response.data.topics || response.data)
    } catch (error) {
      console.error('Failed to fetch personal topics:', error)
    }
  }

  const fetchSystemCategories = async () => {
    try {
      const response = await api.get('/vocabulary/categories')
      setSystemCategories(response.data.categories || response.data)
    } catch (error) {
      console.error('Failed to fetch system categories:', error)
      // Mock data for now
      setSystemCategories([
        { _id: '1', name: 'Gia đình', description: 'Từ vựng về gia đình', vocabularyCount: 50 },
        { _id: '2', name: 'Màu sắc', description: 'Từ vựng về màu sắc', vocabularyCount: 30 },
        { _id: '3', name: 'Thức ăn', description: 'Từ vựng về thức ăn', vocabularyCount: 80 },
        { _id: '4', name: 'Thời tiết', description: 'Từ vựng về thời tiết', vocabularyCount: 25 },
        { _id: '5', name: 'Trường học', description: 'Từ vựng về trường học', vocabularyCount: 60 },
        { _id: '6', name: 'Công việc', description: 'Từ vựng về công việc', vocabularyCount: 40 }
      ])
    } finally {
      setLoading(false)
    }
  }

  const fetchVocabulariesByCategories = async () => {
    try {
      setLoading(true)
      
      const response = await api.get('/vocabulary/by-categories', {
        params: {
          categories: selectedCategories.join(','),
          search: searchTerm,
          limit: 50
        }
      })
      
      const vocabularies = response.data.vocabularies || response.data
      setAvailableVocabularies(vocabularies)
    } catch (error) {
      console.error('Error fetching vocabularies by categories:', error)
      toast.error('Không thể tải từ vựng theo danh mục')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTopic = async () => {
    if (!newTopicName.trim()) {
      toast.error('Vui lòng nhập tên chủ đề')
      return
    }

    try {
      const response = await api.post('/vocabulary-learning/user/personal-topics', {
        name: newTopicName,
        description: newTopicDescription
      })
      
      const newTopic = response.data.topic || response.data
      setPersonalTopics(prev => [...prev, newTopic])
      setSelectedPersonalTopics([newTopic._id])
      setNewTopicName('')
      setNewTopicDescription('')
      setShowCreateTopicDialog(false)
      toast.success('Tạo chủ đề thành công')
    } catch (error: any) {
      console.error('Error creating topic:', error)
      toast.error(error.response?.data?.message || 'Không thể tạo chủ đề')
    }
  }

  const handleCategorySelect = (categoryId: string) => {
    // Find the category name by ID
    const category = systemCategories.find(cat => cat._id === categoryId)
    const categoryName = category ? category.name : categoryId
    
    setSelectedCategories(prev => 
      prev.includes(categoryName)
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    )
  }

  const handleVocabularySelect = (vocabularyId: string) => {
    setSelectedVocabularies(prev =>
      prev.includes(vocabularyId)
        ? prev.filter(id => id !== vocabularyId)
        : [...prev, vocabularyId]
    )
  }

  const handleTopicSelect = (topicId: string) => {
    setSelectedPersonalTopics(prev =>
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    )
  }

  const handleAddVocabularies = async () => {
    if (selectedPersonalTopics.length === 0) {
      toast.error('Vui lòng chọn ít nhất một chủ đề')
      return
    }

    if (selectedVocabularies.length === 0) {
      toast.error('Vui lòng chọn ít nhất một từ vựng')
      return
    }

    try {
      // Thêm từ vựng vào từng chủ đề đã chọn
      const promises = selectedPersonalTopics.map(topicId => 
        api.post('/vocabulary-learning/personal-topics/add-vocabularies', {
          topicId: topicId,
          vocabularyIds: selectedVocabularies
        })
      )

      const responses = await Promise.all(promises)
      
      // Tính tổng số từ đã thêm và bỏ qua
      let totalAdded = 0
      let totalSkipped = 0
      
      responses.forEach(response => {
        totalAdded += response.data.added || 0
        totalSkipped += response.data.skipped || 0
      })
      
      if (totalAdded > 0 && totalSkipped > 0) {
        toast.success(`Đã thêm ${totalAdded} từ vựng mới vào ${selectedPersonalTopics.length} chủ đề, ${totalSkipped} từ đã tồn tại`)
      } else if (totalAdded > 0) {
        toast.success(`Đã thêm ${totalAdded} từ vựng vào ${selectedPersonalTopics.length} chủ đề`)
      } else {
        toast('Tất cả từ vựng đã tồn tại trong các chủ đề')
      }
      
      setSelectedVocabularies([])
      setSelectedPersonalTopics([])
      
      // Refresh personal topics to update vocabulary count
      fetchPersonalTopics()
    } catch (error: any) {
      console.error('Error adding vocabularies:', error)
      toast.error(error.response?.data?.message || 'Không thể thêm từ vựng')
    }
  }

  // Removed audio play helper in compact UI

  return (
    <div className={`${inDialog ? '' : 'min-h-screen'} bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6`}>
      <div className="max-w-6xl mx-auto">
        {/* Enhanced Header */}
        <div className="mb-8 text-center">
          <div className="relative inline-block">
            {/* <Button
              variant="outline"
              onClick={() => {
                if (onClose) {
                  onClose()
                } else {
                  try { window.history.back() } catch {}
                }
              }}
              className="absolute -left-32 top-0 bg-white/50 border-white/30 text-gray-700 hover:bg-white/70 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {inDialog ? 'Đóng' : 'Quay lại'}
            </Button> */}
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-4">
              📚 Thêm từ vựng
            </h1>
            <div className="absolute -top-2 -right-2">
              <BookOpen className="h-8 w-8 text-yellow-400 animate-bounce" />
            </div>
            <div className="absolute -bottom-2 -left-2">
              <Tag className="h-6 w-6 text-purple-400 animate-pulse" />
            </div>
          </div>
          <p className="text-xl text-gray-700 font-medium">
            Chọn chủ đề và thêm từ vựng từ danh mục hệ thống
          </p>
        </div>

        <div className="space-y-6">
          {/* 1) Personal topics - compact badges */}
          <Card className="border-0 shadow bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-purple-600" />
                  <span className="font-semibold">Chủ đề của bạn</span>
                  <Badge variant="outline" className="text-xs">Có thể chọn nhiều</Badge>
                </div>
                <Button size="sm" onClick={() => setShowCreateTopicDialog(true)} className="h-8 px-3"> 
                  <Plus className="w-3 h-3 mr-1" /> Tạo chủ đề
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {personalTopics.map((topic) => (
                  <button
                    key={topic._id}
                    onClick={() => handleTopicSelect(topic._id)}
                    className={`px-3 py-1 rounded-full border text-sm transition ${
                      selectedPersonalTopics.includes(topic._id)
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {topic.name}
                    <span className={`ml-2 inline-flex items-center justify-center text-[10px] px-1.5 py-0.5 rounded-full border ${
                      selectedPersonalTopics.includes(topic._id) ? 'border-white/40' : 'border-gray-300 text-gray-500'
                    }`}>{topic.vocabularyCount}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 2) System categories - compact badges */}
          <Card className="border-0 shadow bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span className="font-semibold">Danh mục hệ thống</span>
                <Badge variant="outline" className="text-xs">Chọn để xem từ vựng</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {systemCategories.map((category) => (
                  <button
                    key={category._id}
                    onClick={() => handleCategorySelect(category._id)}
                    className={`px-3 py-1 rounded-full border text-sm transition ${
                      selectedCategories.includes(category.name)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {category.name}
                    <span className={`ml-2 inline-flex items-center justify-center text-[10px] px-1.5 py-0.5 rounded-full border ${
                      selectedCategories.includes(category.name) ? 'border-white/40' : 'border-gray-300 text-gray-500'
                    }`}>{category.vocabularyCount}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 3) Vocabulary list for selected categories */}
          <Card className="border-0 shadow bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-rose-600" />
                <span className="font-semibold">Từ vựng</span>
                <span className="text-sm text-gray-500">{selectedCategories.length > 0 ? 'Theo danh mục đã chọn' : 'Chọn danh mục để hiển thị'}</span>
              </div>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Tìm kiếm từ vựng..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
              ) : selectedCategories.length === 0 ? (
                <div className="text-sm text-gray-600 py-6 text-center">Hãy chọn danh mục hệ thống ở trên để xem từ vựng.</div>
              ) : availableVocabularies.length > 0 ? (
                <>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {availableVocabularies.map((vocabulary) => (
                      <button
                        key={vocabulary._id}
                        onClick={() => handleVocabularySelect(vocabulary._id)}
                        className={`px-3 py-1 rounded-full border text-sm transition ${
                          selectedVocabularies.includes(vocabulary._id)
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                        title={vocabulary.examples[0] || ''}
                      >
                        {vocabulary.word}
                        <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full border ${
                          selectedVocabularies.includes(vocabulary._id) ? 'border-white/40' : 'border-gray-300 text-gray-500'
                        }`}>L{vocabulary.level}</span>
                      </button>
                    ))}
                  </div>
                  {selectedPersonalTopics.length > 0 && selectedVocabularies.length > 0 && (
                    <div className="flex justify-center">
                      <Button onClick={handleAddVocabularies} className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                        <Plus className="w-4 h-4 mr-2" /> Thêm {selectedVocabularies.length} từ vào {selectedPersonalTopics.length} chủ đề
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-gray-600 py-6 text-center">Không có từ vựng phù hợp.</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Create Topic Dialog */}
        <Dialog open={showCreateTopicDialog} onOpenChange={setShowCreateTopicDialog}>
          <DialogContent className="border-0 shadow-2xl bg-gradient-to-br from-white to-purple-50">
            <DialogHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg p-6 -m-6 mb-6">
              <DialogTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-white/20 rounded-full">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <span>Tạo chủ đề mới</span>
                  <div className="flex items-center gap-1 mt-1">
                    <Tag className="h-4 w-4 text-purple-200" />
                    <span className="text-sm text-purple-100">Tổ chức từ vựng cá nhân</span>
                  </div>
                </div>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <Label htmlFor="topicName" className="text-lg font-semibold text-gray-700">Tên chủ đề *</Label>
                <Input
                  id="topicName"
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  placeholder="Nhập tên chủ đề..."
                  className="mt-2 text-lg py-3 border-2 focus:border-purple-400"
                />
              </div>
              <div>
                <Label htmlFor="topicDescription" className="text-lg font-semibold text-gray-700">Mô tả</Label>
                <Input
                  id="topicDescription"
                  value={newTopicDescription}
                  onChange={(e) => setNewTopicDescription(e.target.value)}
                  placeholder="Nhập mô tả chủ đề..."
                  className="mt-2 text-lg py-3 border-2 focus:border-purple-400"
                />
              </div>
              <div className="flex justify-end gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateTopicDialog(false)}
                  className="px-6 py-3 text-lg border-2 border-gray-300 hover:border-gray-400"
                >
                  Hủy
                </Button>
                <Button 
                  onClick={handleCreateTopic}
                  className="px-6 py-3 text-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  Tạo chủ đề
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
