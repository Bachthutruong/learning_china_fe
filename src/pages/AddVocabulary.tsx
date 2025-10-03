import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { 
  ArrowLeft,
  Plus, 
  Search,
  BookOpen,
  Tag,
  CheckCircle,
  Play,
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
  pronunciation: string
  meaning: string
  partOfSpeech: string
  level: number
  topics: string[]
  examples: string[]
  synonyms: string[]
  antonyms: string[]
  audioUrl?: string
}

export const AddVocabulary = () => {
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

  const handlePlayAudio = async (audioUrl: string) => {
    try {
      const audio = new Audio(audioUrl)
      await audio.play()
    } catch (error) {
      console.error('Error playing audio:', error)
      toast.error('Không thể phát âm thanh')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Enhanced Header */}
        <div className="mb-8 text-center">
          <div className="relative inline-block">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="absolute -left-32 top-0 bg-white/50 border-white/30 text-gray-700 hover:bg-white/70 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
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
          <div className="flex justify-center mt-4">
            <div className="flex items-center gap-2 bg-white/50 px-4 py-2 rounded-full">
              <Plus className="h-5 w-5 text-green-500" />
              <span className="text-sm font-semibold text-green-700">Tạo bộ sưu tập từ vựng</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Topic Selection */}
          <div className="space-y-6">
            {/* Personal Topic Selection */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-purple-50">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-white/20 rounded-full">
                    <Tag className="w-6 h-6" />
                  </div>
                  <div>
                    <span>Chọn chủ đề</span>
                    <div className="flex items-center gap-1 mt-1">
                      <BookOpen className="h-4 w-4 text-purple-200" />
                      <span className="text-sm text-purple-100">Tổ chức từ vựng</span>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {personalTopics.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label>Chủ đề của bạn:</Label>
                      <Badge variant="outline" className="text-xs">
                        Có thể chọn nhiều chủ đề
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {personalTopics.map((topic) => (
                        <div
                          key={topic._id}
                          className={`p-4 rounded-xl cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                            selectedPersonalTopics.includes(topic._id)
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                              : 'bg-white hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 border-2 hover:border-purple-300'
                          }`}
                          onClick={() => handleTopicSelect(topic._id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-bold text-lg">{topic.name}</h4>
                              <p className={`text-sm ${
                                selectedPersonalTopics.includes(topic._id) ? 'text-purple-100' : 'text-gray-600'
                              }`}>{topic.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="secondary"
                                className={`${
                                  selectedPersonalTopics.includes(topic._id)
                                    ? 'bg-white/20 text-white border-white/30'
                                    : 'bg-purple-100 text-purple-700 border-purple-200'
                                }`}
                              >
                                {topic.vocabularyCount}
                              </Badge>
                              {selectedPersonalTopics.includes(topic._id) && (
                                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                                  <div className="w-2 h-2 rounded-full bg-white"></div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => setShowCreateTopicDialog(true)}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tạo chủ đề mới
                </Button>
              </CardContent>
            </Card>

            {/* System Categories */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-white/20 rounded-full">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <span>Danh mục hệ thống</span>
                    <div className="flex items-center gap-1 mt-1">
                      <Tag className="h-4 w-4 text-blue-200" />
                      <span className="text-sm text-blue-100">Chọn danh mục</span>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-3">
                  {systemCategories.map((category) => (
                    <div
                      key={category._id}
                      className={`px-4 py-2 rounded-xl cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                        selectedCategories.includes(category.name)
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                          : 'bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 border-2 hover:border-blue-300 text-gray-700'
                      }`}
                      onClick={() => handleCategorySelect(category._id)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{category.name}</span>
                        <Badge 
                          variant="secondary"
                          className={`text-xs ${
                            selectedCategories.includes(category.name)
                              ? 'bg-white/20 text-white border-white/30'
                              : 'bg-blue-100 text-blue-700 border-blue-200'
                          }`}
                        >
                          {category.vocabularyCount}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Vocabulary Selection */}
          <div className="lg:col-span-2">
            {selectedCategories.length > 0 ? (
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-pink-50">
                <CardHeader className="bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-white/20 rounded-full">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <span>Từ vựng theo danh mục đã chọn</span>
                      <div className="flex items-center gap-1 mt-1">
                        <Tag className="h-4 w-4 text-pink-200" />
                        <span className="text-sm text-pink-100">Chọn từ vựng để thêm</span>
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Search */}
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

                  {/* Vocabulary Table */}
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : availableVocabularies && availableVocabularies.length > 0 ? (
                    <div className="space-y-4">
                      {/* Add Button */}
                      {selectedPersonalTopics.length > 0 && selectedVocabularies.length > 0 && (
                        <div className="text-center mb-6">
                          <Button
                            onClick={handleAddVocabularies}
                            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-lg px-8 py-4 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                          >
                            <Plus className="w-5 h-5 mr-3" />
                            Thêm {selectedVocabularies.length} từ vựng vào {selectedPersonalTopics.length} chủ đề
                          </Button>
                        </div>
                      )}

                      {/* Vocabulary List */}
                      <div className="flex flex-wrap gap-3">
                        {availableVocabularies.map((vocabulary) => (
                          <div
                            key={vocabulary._id}
                            className="relative group"
                            onClick={() => handleVocabularySelect(vocabulary._id)}
                          >
                            <div
                              className={`px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                                selectedVocabularies.includes(vocabulary._id)
                                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                                  : 'bg-white text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 border-2 hover:border-purple-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="text-center">
                                  <div className="font-bold text-lg">{vocabulary.word}</div>
                                </div>
                                <Badge 
                                  variant="secondary" 
                                  className={`text-xs px-2 py-1 ${
                                    selectedVocabularies.includes(vocabulary._id)
                                      ? 'bg-white/20 text-white border-white/30'
                                      : 'bg-purple-100 text-purple-700 border-purple-200'
                                  }`}
                                >
                                  L{vocabulary.level}
                                </Badge>
                                {vocabulary.audioUrl && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className={`h-7 w-7 p-0 ${
                                      selectedVocabularies.includes(vocabulary._id)
                                        ? 'hover:bg-white/20 text-white'
                                        : 'hover:bg-purple-100 text-purple-600'
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handlePlayAudio(vocabulary.audioUrl!)
                                    }}
                                  >
                                    <Play className="w-3 h-3" />
                                  </Button>
                                )}
                                {selectedVocabularies.includes(vocabulary._id) && (
                                  <CheckCircle className="w-5 h-5 text-white" />
                                )}
                              </div>
                            </div>
                            
                            {/* Tooltip with example */}
                            {vocabulary.examples.length > 0 && (
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 shadow-xl">
                                VD: {vocabulary.examples[0]}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="relative inline-block mb-6">
                        <div className="p-6 bg-gradient-to-r from-pink-100 to-rose-100 rounded-full">
                          <BookOpen className="h-16 w-16 text-pink-500" />
                        </div>
                        <div className="absolute -top-2 -right-2">
                          <Search className="h-8 w-8 text-yellow-400 animate-bounce" />
                        </div>
                        <div className="absolute -bottom-2 -left-2">
                          <Tag className="h-6 w-6 text-purple-400 animate-pulse" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-3">
                        🔍 Không tìm thấy từ vựng phù hợp
                      </h3>
                      <p className="text-lg text-gray-600 mb-6">
                        Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác
                      </p>
                      <div className="flex justify-center gap-4">
                        <div className="flex items-center gap-2 bg-pink-100 text-pink-700 px-4 py-2 rounded-full">
                          <Search className="h-5 w-5" />
                          <span className="font-semibold">Tìm kiếm thông minh</span>
                        </div>
                        <div className="flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full">
                          <Tag className="h-5 w-5" />
                          <span className="font-semibold">Chọn danh mục</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-indigo-50">
                <CardContent className="text-center py-16">
                  <div className="relative inline-block mb-6">
                    <div className="p-6 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full">
                      <BookOpen className="h-16 w-16 text-indigo-500" />
                    </div>
                    <div className="absolute -top-2 -right-2">
                      <Tag className="h-8 w-8 text-yellow-400 animate-bounce" />
                    </div>
                    <div className="absolute -bottom-2 -left-2">
                      <Search className="h-6 w-6 text-purple-400 animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">
                    🎯 Chọn danh mục để xem từ vựng
                  </h3>
                  <p className="text-lg text-gray-600 mb-6">
                    Hãy chọn một hoặc nhiều danh mục ở bên trái để xem từ vựng có sẵn
                  </p>
                  <div className="flex justify-center gap-4">
                    <div className="flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full">
                      <BookOpen className="h-5 w-5" />
                      <span className="font-semibold">Danh mục phong phú</span>
                    </div>
                    <div className="flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full">
                      <Tag className="h-5 w-5" />
                      <span className="font-semibold">Tổ chức dễ dàng</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
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
