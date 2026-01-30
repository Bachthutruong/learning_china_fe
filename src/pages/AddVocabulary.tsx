import { useState, useEffect } from 'react'
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
  
  Loader2,
  CheckCircle
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
    <div className={`${inDialog ? '' : 'min-h-screen'} bg-[#fdfaf6] p-4 md:p-8`}>
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header Section */}
        {!inDialog && (
          <div className="text-center space-y-4 max-w-3xl mx-auto">
             <div className="inline-flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
                <Plus className="w-4 h-4 text-primary" />
                <span className="text-primary text-xs font-bold uppercase tracking-widest">Mở rộng kho kiến thức</span>
             </div>
             <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">Thêm <span className="text-primary">Từ vựng mới</span></h1>
             <p className="text-gray-500 font-medium">Tìm kiếm từ vựng từ hệ thống và tổ chức chúng vào các chủ đề cá nhân của bạn.</p>
          </div>
        )}

        <div className="space-y-8">
          {/* Step 1: Search & Filter Categories */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl space-y-8">
             <div className="flex items-center space-x-4">
                <div className="w-10 h-10 chinese-gradient rounded-xl flex items-center justify-center text-white shadow-lg">
                   <Search className="w-5 h-5" />
                </div>
                <div>
                   <h3 className="text-xl font-black text-gray-900">1. Tìm kiếm từ hệ thống</h3>
                   <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Khám phá kho từ vựng Jiudi</p>
                </div>
             </div>

             <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-4">
                   <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
                      <Input
                        placeholder="Nhập Hán tự, Pinyin hoặc nghĩa của từ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-14 pl-12 rounded-2xl border-2 border-gray-50 bg-gray-50/50 focus:bg-white focus:border-primary transition-all text-base font-bold"
                      />
                   </div>
                   
                   <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center">
                         <BookOpen className="w-3 h-3 mr-2" /> Danh mục phổ biến
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {systemCategories.map((category) => (
                          <button
                            key={category._id}
                            onClick={() => handleCategorySelect(category._id)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${
                              selectedCategories.includes(category.name)
                                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                : 'bg-white text-gray-500 border-gray-100 hover:border-primary/20 hover:text-primary'
                            }`}
                          >
                            {category.name}
                            <span className="ml-2 opacity-50 font-black">({category.vocabularyCount})</span>
                          </button>
                        ))}
                      </div>
                   </div>
                </div>

                <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 flex flex-col justify-between">
                   <p className="text-xs font-medium text-primary leading-relaxed italic">"Hệ thống sẽ lọc những từ vựng phù hợp nhất với tiêu chí tìm kiếm và danh mục bạn chọn."</p>
                   <div className="pt-4 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      <span className="text-[10px] font-black uppercase text-primary tracking-widest">AI Assisted Filter</span>
                   </div>
                </div>
             </div>
          </div>

          {/* Step 2: Vocabulary Selection */}
          {selectedCategories.length > 0 && (
            <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl space-y-6 animate-in slide-in-from-bottom duration-500">
               <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                     <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                        <Tag className="w-5 h-5" />
                     </div>
                     <div>
                        <h3 className="text-xl font-black text-gray-900">2. Lựa chọn từ vựng</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Chọn các từ bạn muốn học</p>
                     </div>
                  </div>
                  <Badge className="bg-blue-50 text-blue-600 border-blue-100 rounded-lg font-black">{availableVocabularies.length} Từ khả dụng</Badge>
               </div>

               {loading ? (
                 <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                 </div>
               ) : availableVocabularies.length > 0 ? (
                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {availableVocabularies.map((vocabulary) => (
                      <button
                        key={vocabulary._id}
                        onClick={() => handleVocabularySelect(vocabulary._id)}
                        className={`p-4 rounded-2xl border-2 text-center transition-all group relative ${
                          selectedVocabularies.includes(vocabulary._id)
                            ? 'bg-blue-50 border-blue-500 shadow-md ring-4 ring-blue-50'
                            : 'bg-white border-gray-50 hover:border-blue-200 hover:bg-blue-50/30'
                        }`}
                      >
                        <p className={`text-2xl font-black transition-colors ${selectedVocabularies.includes(vocabulary._id) ? 'text-blue-700' : 'text-gray-900'}`}>{vocabulary.word}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{vocabulary.pinyin}</p>
                        <p className="text-xs text-gray-500 line-clamp-1 mt-2 font-medium">{vocabulary.meaning}</p>
                        
                        {selectedVocabularies.includes(vocabulary._id) && (
                          <div className="absolute top-2 right-2">
                             <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-3 h-3 text-white" />
                             </div>
                          </div>
                        )}
                      </button>
                    ))}
                 </div>
               ) : (
                 <div className="text-center py-12 text-gray-400 italic font-medium">Không tìm thấy từ vựng nào phù hợp.</div>
               )}
            </div>
          )}

          {/* Step 3: Target Personal Topics */}
          {selectedVocabularies.length > 0 && (
            <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl space-y-8 animate-in slide-in-from-bottom duration-700">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center space-x-4">
                     <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-200">
                        <Plus className="w-5 h-5" />
                     </div>
                     <div>
                        <h3 className="text-xl font-black text-gray-900">3. Đích đến học tập</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Chọn chủ đề cá nhân của bạn</p>
                     </div>
                  </div>
                  <Button 
                    onClick={() => setShowCreateTopicDialog(true)}
                    variant="ghost"
                    className="rounded-xl font-black text-xs text-primary hover:bg-primary/5"
                  >
                     <Plus className="w-4 h-4 mr-2" /> Tạo chủ đề mới
                  </Button>
               </div>

               <div className="flex flex-wrap gap-3">
                  {personalTopics.map((topic) => (
                    <button
                      key={topic._id}
                      onClick={() => handleTopicSelect(topic._id)}
                      className={`flex items-center px-6 py-3 rounded-2xl border-2 transition-all font-bold ${
                        selectedPersonalTopics.includes(topic._id)
                          ? 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-100'
                          : 'bg-white text-gray-500 border-gray-100 hover:border-green-300 hover:text-green-600'
                      }`}
                    >
                      <Tag className={`w-4 h-4 mr-3 ${selectedPersonalTopics.includes(topic._id) ? 'text-white' : 'text-green-500'}`} />
                      {topic.name}
                      <Badge className={`ml-3 rounded-lg border-none ${selectedPersonalTopics.includes(topic._id) ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'}`}>
                         {topic.vocabularyCount}
                      </Badge>
                    </button>
                  ))}
               </div>

               <div className="pt-8 border-t border-gray-50 flex justify-center">
                  <Button
                    onClick={handleAddVocabularies}
                    disabled={selectedPersonalTopics.length === 0}
                    className="h-16 px-12 rounded-2xl chinese-gradient text-white font-black text-xl shadow-2xl shadow-primary/20 hover:shadow-primary/30 transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:transform-none"
                  >
                     Hoàn tất & Thêm {selectedVocabularies.length} từ vào {selectedPersonalTopics.length} chủ đề
                  </Button>
               </div>
            </div>
          )}
        </div>

        {/* Create Topic Dialog */}
        <Dialog open={showCreateTopicDialog} onOpenChange={setShowCreateTopicDialog}>
          <DialogContent className="rounded-[2.5rem] p-10 border-none shadow-2xl">
            <DialogHeader className="text-center space-y-4 mb-8">
               <div className="w-16 h-16 chinese-gradient rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <Plus className="w-8 h-8 text-white" />
               </div>
               <DialogTitle className="text-3xl font-black text-gray-900">Tạo chủ đề học tập</DialogTitle>
               <p className="text-gray-500 font-medium leading-relaxed">Tổ chức từ vựng theo cách riêng của bạn để ghi nhớ tốt hơn.</p>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="topicName" className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Tên chủ đề của bạn</Label>
                <Input
                  id="topicName"
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  placeholder="Ví dụ: Tiếng Trung chuyên ngành IT..."
                  className="h-14 rounded-2xl border-2 border-gray-50 bg-gray-50/50 focus:bg-white focus:border-primary transition-all font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="topicDescription" className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Mô tả ngắn gọn (tùy chọn)</Label>
                <Input
                  id="topicDescription"
                  value={newTopicDescription}
                  onChange={(e) => setNewTopicDescription(e.target.value)}
                  placeholder="Mục tiêu của chủ đề này là gì?..."
                  className="h-14 rounded-2xl border-2 border-gray-50 bg-gray-50/50 focus:bg-white focus:border-primary transition-all font-bold"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setShowCreateTopicDialog(false)}
                  className="flex-1 h-12 rounded-xl font-bold text-gray-400"
                >
                  Hủy bỏ
                </Button>
                <Button 
                  onClick={handleCreateTopic}
                  className="flex-1 chinese-gradient h-12 rounded-xl font-black text-white shadow-lg"
                >
                  Tạo ngay
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
