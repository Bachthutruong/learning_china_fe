import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { VocabularyStudyCard } from '../components/VocabularyStudyCard'
import { TopicQuiz } from '../components/TopicQuiz'
import { 
  Plus, 
  Loader2,
  BookOpen,
  Tag,
  Play,
  RotateCcw
} from 'lucide-react'
import { api } from '../services/api'
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
  audioUrl?: string
  questions?: QuizQuestion[]
  createdAt: string
  updatedAt: string
}

interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

interface PersonalTopic {
  _id: string
  name: string
  description: string
  userId: string
  vocabularyCount: number
  createdAt: string
  updatedAt: string
}


export const VocabularyLearning = () => {
  const [personalTopics, setPersonalTopics] = useState<PersonalTopic[]>([])
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [availableVocabularies, setAvailableVocabularies] = useState<Vocabulary[]>([])
  const [selectedVocabularies, setSelectedVocabularies] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateTopicDialog, setShowCreateTopicDialog] = useState(false)
  const [showAddVocabularyDialog, setShowAddVocabularyDialog] = useState(false)
  const [newTopicName, setNewTopicName] = useState('')
  const [newTopicDescription, setNewTopicDescription] = useState('')
  const [searchTerm] = useState('')
  const [selectedPersonalTopic, setSelectedPersonalTopic] = useState('')
  
  // Study mode states
  const [studyMode, setStudyMode] = useState(false)
  const [studyVocabularies, setStudyVocabularies] = useState<Vocabulary[]>([])
  const [currentStudyIndex, setCurrentStudyIndex] = useState(0)
  const [showTopicQuiz, setShowTopicQuiz] = useState(false)
  const [selectedTopicForQuiz, setSelectedTopicForQuiz] = useState<{id: string, name: string} | null>(null)
  const [vocabularyStatuses, setVocabularyStatuses] = useState<Record<string, 'learned' | 'studying' | 'skipped'>>({})

  useEffect(() => {
    fetchPersonalTopics()
  }, [])

  const fetchPersonalTopics = async () => {
    try {
      setLoading(true)
      const response = await api.get('/vocabulary-learning/user/personal-topics')
      setPersonalTopics(response.data.topics || response.data)
    } catch (error) {
      console.error('Error fetching personal topics:', error)
      toast.error('Không thể tải danh sách chủ đề')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableVocabularies = async () => {
    if (selectedTopics.length === 0) {
      setAvailableVocabularies([])
      return
    }

    try {
      setLoading(true)
      const response = await api.get('/vocabulary-learning/vocabulary/by-topic', {
        params: {
          personalTopicId: selectedTopics[0],
          search: searchTerm,
          limit: 20
        }
      })
      setAvailableVocabularies(response.data.vocabularies || response.data)
      // nhận trạng thái từ server (nếu có) để hiển thị lại sau reload
      if (response.data.statuses) {
        setVocabularyStatuses(response.data.statuses)
      }
    } catch (error) {
      console.error('Error fetching vocabularies:', error)
      toast.error('Không thể tải danh sách từ vựng')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTopicName.trim()) {
      toast.error('Vui lòng nhập tên chủ đề')
      return
    }

    try {
      await api.post('/vocabulary-learning/user/personal-topics', {
        name: newTopicName,
        description: newTopicDescription
      })
      
      toast.success('Tạo chủ đề thành công!')
      setNewTopicName('')
      setNewTopicDescription('')
      setShowCreateTopicDialog(false)
      fetchPersonalTopics()
    } catch (error: any) {
      console.error('Error creating topic:', error)
      toast.error(error.response?.data?.message || 'Không thể tạo chủ đề')
    }
  }

  const handleAddVocabularies = async () => {
    if (selectedVocabularies.length === 0) {
      toast.error('Vui lòng chọn từ vựng để thêm')
      return
    }

    if (!selectedPersonalTopic) {
      toast.error('Vui lòng chọn chủ đề')
      return
    }

    try {
      await api.post('/vocabulary-learning/personal-topics/add-vocabularies', {
        topicId: selectedPersonalTopic,
        vocabularyIds: selectedVocabularies
      })
      
      toast.success('Thêm từ vựng thành công!')
      setSelectedVocabularies([])
      setShowAddVocabularyDialog(false)
      fetchPersonalTopics()
    } catch (error: any) {
      console.error('Error adding vocabularies:', error)
      toast.error(error.response?.data?.message || 'Không thể thêm từ vựng')
    }
  }

  const handleTopicSelect = (topicId: string) => {
    setSelectedTopics(prev => 
      prev.includes(topicId) 
        ? [] // Bỏ chọn nếu đã chọn
        : [topicId] // Chỉ chọn 1 chủ đề
    )
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

  const startStudyMode = (vocabularies: Vocabulary[]) => {
    setStudyVocabularies(vocabularies)
    setCurrentStudyIndex(0)
    setStudyMode(true)
  }

  const handleStudyStatusChange = async (status: 'learned' | 'studying' | 'skipped'): Promise<void> => {
    const currentVocab = studyVocabularies[currentStudyIndex]

    // Bỏ qua: chỉ tạm thời trong phiên học, không gọi API, đưa từ hiện tại xuống cuối hàng
    if (status === 'skipped') {
      setVocabularyStatuses(prev => ({
        ...prev,
        [currentVocab._id]: 'skipped'
      }))

      setStudyVocabularies(prev => {
        const next = [...prev]
        const [item] = next.splice(currentStudyIndex, 1)
        next.push(item)
        return next
      })

      // giữ nguyên currentStudyIndex để đi tiếp sang phần tử kế tiếp sau khi đã đẩy phần tử hiện tại xuống cuối
      if (currentStudyIndex === studyVocabularies.length - 1) {
        setCurrentStudyIndex(currentStudyIndex) // sẽ trỏ tới phần tử mới cuối hàng, vòng tiếp theo sẽ reset nếu cần
      }
      toast('Đã bỏ qua tạm thời. Sẽ ôn lại ở vòng sau.')
      return
    }

    // Các trạng thái còn lại học/đang học: lưu server
    const selectedTopicId = selectedTopics[0]
    try {
      const response = await api.post('/vocabulary-learning/user/vocabularies', {
        vocabularyId: currentVocab._id,
        status,
        personalTopicId: selectedTopicId
      })

      if (status === 'learned' && response.data.rewards) {
        const { exp, coins, levelUp, newLevel, isNewlyLearned } = response.data.rewards
        if (levelUp) {
          toast.success(
            isNewlyLearned
              ? `🎉 Level up! Level ${newLevel}! Từ mới: +${exp} EXP, +${coins} xu`
              : `🎉 Level up! Level ${newLevel}! Ôn tập: +${exp} EXP, +${coins} xu`
          )
        } else {
          toast.success(
            isNewlyLearned
              ? `🎉 Từ mới! +${exp} EXP, +${coins} xu`
              : `🎉 Ôn tập! +${exp} EXP, +${coins} xu`
          )
        }
      } else {
        toast.success(`Đã ${status === 'learned' ? 'đánh dấu đã thuộc' : 'thêm vào danh sách học'} từ vựng`)
      }

      setVocabularyStatuses(prev => ({
        ...prev,
        [currentVocab._id]: status
      }))

      // Di chuyển tiếp
      if (currentStudyIndex < studyVocabularies.length - 1) {
        setCurrentStudyIndex(currentStudyIndex + 1)
      } else {
        // Kết thúc một vòng: nếu còn từ chưa learned, bắt đầu vòng mới chỉ với các từ đó
        const remaining = studyVocabularies.filter(v => (vocabularyStatuses[v._id] ?? (v._id === currentVocab._id ? status : undefined)) !== 'learned')
        if (remaining.length > 0) {
          setStudyVocabularies(remaining)
          setCurrentStudyIndex(0)
          toast('Bắt đầu lại với các từ chưa thuộc')
        } else {
          setStudyMode(false)
          setCurrentStudyIndex(0)
          toast.success('Hoàn thành học từ vựng!')
        }
      }
    } catch (error: any) {
      console.error('Error updating vocabulary status:', error)
      toast.error(error.response?.data?.message || 'Không thể cập nhật trạng thái từ vựng')
    }
  }


  const startTopicQuiz = (topicId: string, topicName: string) => {
    setSelectedTopicForQuiz({ id: topicId, name: topicName })
    setShowTopicQuiz(true)
  }

  useEffect(() => {
    fetchAvailableVocabularies()
  }, [selectedTopics, searchTerm])

  // Study mode render
  if (studyMode && studyVocabularies.length > 0) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Enhanced Header */}
          <div className="mb-8 text-center">
            <div className="relative inline-block">
                <Button
                  variant="outline"
                onClick={() => setStudyMode(false)}
                className="absolute -left-32 top-0 bg-white/50 border-white/30 text-gray-700 hover:bg-white/70 hover:text-gray-900"
                >
                ← Quay lại
                </Button>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-4">
                📚 Học từ vựng
              </h1>
              <div className="absolute -top-2 -right-2">
                <BookOpen className="h-8 w-8 text-yellow-400 animate-bounce" />
              </div>
              <div className="absolute -bottom-2 -left-2">
                <Tag className="h-6 w-6 text-purple-400 animate-pulse" />
          </div>
          </div>
            <p className="text-xl text-gray-700 font-medium">
              Học từng từ một cách có hệ thống
            </p>
            <div className="flex justify-center mt-4">
              <div className="flex items-center gap-2 bg-white/50 px-4 py-2 rounded-full">
                <Play className="h-5 w-5 text-green-500" />
                <span className="text-sm font-semibold text-green-700">
                  Câu {currentStudyIndex + 1} / {studyVocabularies.length}
                </span>
        </div>
                          </div>
                    </div>
          
          <VocabularyStudyCard
            vocabulary={studyVocabularies[currentStudyIndex]}
            onStatusChange={handleStudyStatusChange}
            currentIndex={currentStudyIndex}
            totalCount={studyVocabularies.length}
          />
                  </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Enhanced Header */}
        <div className="mb-8 text-center">
          <div className="relative inline-block">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-4">
              📚 Học từ vựng
            </h1>
            <div className="absolute -top-2 -right-2">
              <BookOpen className="h-8 w-8 text-yellow-400 animate-bounce" />
                          </div>
            <div className="absolute -bottom-2 -left-2">
              <Tag className="h-6 w-6 text-purple-400 animate-pulse" />
                    </div>
                  </div>
          <p className="text-xl text-gray-700 font-medium">
            Chọn chủ đề để bắt đầu học từ vựng
          </p>
          <div className="flex justify-center mt-4">
            <div className="flex items-center gap-2 bg-white/50 px-4 py-2 rounded-full">
              <Play className="h-5 w-5 text-green-500" />
              <span className="text-sm font-semibold text-green-700">Học tập thông minh</span>
                  </div>
              </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mb-8">
                <Button
                  onClick={() => setShowCreateTopicDialog(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
            <Plus className="w-5 h-5 mr-2" />
            Tạo chủ đề mới
                </Button>
                      <Button
            onClick={() => window.location.href = '/vocabulary-learning/add'}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6 py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
            <BookOpen className="w-5 h-5 mr-2" />
                  Thêm từ vựng
                      </Button>
                  </div>

                {/* Personal Topics */}
                {personalTopics.length > 0 && (
          <Card className="mb-6 border-0 shadow-xl bg-gradient-to-br from-white to-purple-50">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-white/20 rounded-full">
                  <Tag className="w-6 h-6" />
                  </div>
                <div>
                  <span>Chủ đề của bạn</span>
                  <div className="flex items-center gap-1 mt-1">
                    <BookOpen className="h-4 w-4 text-purple-200" />
                    <span className="text-sm text-purple-100">Chọn một chủ đề để học</span>
        </div>
                </div>
                </CardTitle>
              </CardHeader>
            <CardContent className="p-6">
                <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {personalTopics.map((topic) => (
                    <div
                          key={topic._id}
                      className={`p-6 rounded-xl cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                        selectedTopics.includes(topic._id)
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                          : 'bg-white hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 border-2 hover:border-purple-300'
                      }`}
                      onClick={() => handleTopicSelect(topic._id)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-xl">{topic.name}</h3>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="secondary"
                            className={`${
                              selectedTopics.includes(topic._id)
                                ? 'bg-white/20 text-white border-white/30'
                                : 'bg-purple-100 text-purple-700 border-purple-200'
                            }`}
                          >
                            {topic.vocabularyCount} từ
                          </Badge>
                          {(topic as any).learnedCount !== undefined && (
                            <Badge 
                              variant="secondary"
                              className={`${
                                selectedTopics.includes(topic._id)
                                  ? 'bg-white/20 text-white border-white/30'
                                  : 'bg-green-100 text-green-700 border-green-200'
                              }`}
                            >
                              Đã thuộc: {(topic as any).learnedCount}
                            </Badge>
                          )}
                        </div>
                    </div>
                      <p className={`text-sm mb-4 ${
                        selectedTopics.includes(topic._id) ? 'text-purple-100' : 'text-gray-600'
                      }`}>
                        {topic.description || 'Không có mô tả'}
                      </p>
                      <div className="flex gap-2">
                      <Button
                        size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            startTopicQuiz(topic._id, topic.name)
                          }}
                          className={`text-xs ${
                            selectedTopics.includes(topic._id)
                              ? 'border-white/30 text-black hover:bg-white/20'
                              : 'border-purple-300 text-purple-700 hover:bg-purple-100'
                          }`}
                          disabled={(topic as any).learnedCount === 0}
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Khảo bài
                      </Button>
                        {selectedTopics.includes(topic._id) && (
                      <Button
                            size="sm"
                            onClick={() => startStudyMode(availableVocabularies)}
                            className="text-xs bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    >
                            <Play className="w-3 h-3 mr-1" />
                            Bắt đầu học
                      </Button>
                    )}
                        </div>
                      </div>
                    ))}
                        </div>
                <div className="text-center mt-6">
                  <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full">
                    <Tag className="h-4 w-4" />
                    <span className="text-sm font-semibold">💡 Click vào chủ đề để chọn, click "Khảo bài" để kiểm tra từ vựng đã học</span>
                              </div>
                          </div>
                </div>
              </CardContent>
            </Card>
        )}

        {/* Selected Topic Vocabularies */}
        {selectedTopics.length > 0 && (
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-pink-50">
            <CardHeader className="bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-white/20 rounded-full">
                  <BookOpen className="w-6 h-6" />
                        </div>
                <div>
                  <span>Từ vựng trong chủ đề đã chọn</span>
                  <div className="flex items-center gap-1 mt-1">
                    <Tag className="h-4 w-4 text-pink-200" />
                    <span className="text-sm text-pink-100">Từ vựng có sẵn trong chủ đề</span>
                      </div>
                  </div>
              </CardTitle>
                </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
              ) : availableVocabularies.length > 0 ? (
                  <div className="space-y-4">
                  {/* Start Study Button */}
                  <div className="text-center mb-6">
                          <Button
                      onClick={() => startStudyMode(availableVocabularies)}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-4 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                    >
                      <Play className="w-5 h-5 mr-3" />
                      Bắt đầu học {availableVocabularies.length} từ vựng
                          </Button>
                    <p className="text-sm text-gray-600 mt-3 font-medium">
                      Học từng từ một cách có hệ thống
                    </p>
                  </div>

                  {/* Vocabulary Grid */}
                  <div className="flex flex-wrap gap-3">
                    {availableVocabularies.map((vocabulary) => {
                      const status = vocabularyStatuses[vocabulary._id]
                      return (
                        <div
                          key={vocabulary._id}
                          className="relative group"
                        >
                          <div className="px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 transform hover:scale-105 bg-white hover:bg-gradient-to-r hover:from-pink-50 hover:to-rose-50 border-2 hover:border-pink-300 text-gray-700">
                            {/* status badge at top-right */}
                            {status && (
                              <div className={`absolute -top-2 -right-2 rounded-full px-2 py-0.5 text-[11px] border ${
                                status === 'learned'
                                  ? 'bg-green-100 text-green-700 border-green-200'
                                  : status === 'studying'
                                  ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                  : 'bg-gray-100 text-gray-700 border-gray-200'
                              }`}> 
                                {status === 'learned' ? 'Đã thuộc' : status === 'studying' ? 'Cần học thêm' : ''}
                              </div>
                            )}
                            <div className="flex items-center gap-3">
                                <div className="text-center">
                                  <div className="font-bold text-lg">{vocabulary.word}</div>
                                </div>
                                <Badge 
                                  variant="secondary" 
                                  className="text-xs px-2 py-1 bg-pink-100 text-pink-700 border-pink-200"
                                >
                                  L{vocabulary.level}
                                </Badge>
                                {vocabulary.audioUrl && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 hover:bg-pink-100 text-pink-600"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handlePlayAudio(vocabulary.audioUrl!)
                                    }}
                                  >
                                    <Play className="w-3 h-3" />
                                  </Button>
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
                      )
                    })}
                          </div>
                        </div>
              ) : (
                <div className="text-center py-12">
                  <div className="relative inline-block mb-6">
                    <div className="p-6 bg-gradient-to-r from-pink-100 to-rose-100 rounded-full">
                      <BookOpen className="h-16 w-16 text-pink-500" />
              </div>
                    <div className="absolute -top-2 -right-2">
                      <Tag className="h-8 w-8 text-yellow-400 animate-bounce" />
              </div>
                    <div className="absolute -bottom-2 -left-2">
                      <Play className="h-6 w-6 text-purple-400 animate-pulse" />
                </div>
                      </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">
                    📚 Chưa có từ vựng nào trong chủ đề này
                  </h3>
                  <p className="text-lg text-gray-600 mb-6">
                    Hãy thêm từ vựng vào chủ đề để bắt đầu học
                  </p>
                  <div className="flex justify-center gap-4">
                    <div className="flex items-center gap-2 bg-pink-100 text-pink-700 px-4 py-2 rounded-full">
                      <BookOpen className="h-5 w-5" />
                      <span className="font-semibold">Thêm từ vựng</span>
                </div>
                    <div className="flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full">
                      <Play className="h-5 w-5" />
                      <span className="font-semibold">Bắt đầu học</span>
              </div>
              </div>
            </div>
          )}
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {personalTopics.length === 0 && (
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
                  <Plus className="h-6 w-6 text-purple-400 animate-pulse" />
                  </div>
                  </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                🎯 Chưa có chủ đề nào
                  </h3>
              <p className="text-lg text-gray-600 mb-6">
                Tạo chủ đề đầu tiên để bắt đầu học từ vựng
              </p>
                  <Button
                onClick={() => setShowCreateTopicDialog(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-4 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                <Plus className="w-5 h-5 mr-3" />
                Tạo chủ đề đầu tiên
                  </Button>
            </CardContent>
          </Card>
        )}

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
            <form onSubmit={handleCreateTopic} className="space-y-6">
              <div>
                <Label htmlFor="topicName" className="text-lg font-semibold text-gray-700">Tên chủ đề *</Label>
              <Input
                id="topicName"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                  placeholder="Ví dụ: Từ vựng công việc"
                  className="mt-2 text-lg py-3 border-2 focus:border-purple-400"
                required
              />
            </div>
              <div>
                <Label htmlFor="topicDescription" className="text-lg font-semibold text-gray-700">Mô tả (tùy chọn)</Label>
              <Input
                id="topicDescription"
                value={newTopicDescription}
                onChange={(e) => setNewTopicDescription(e.target.value)}
                  placeholder="Mô tả ngắn về chủ đề này"
                  className="mt-2 text-lg py-3 border-2 focus:border-purple-400"
              />
            </div>
              <div className="flex justify-end gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateTopicDialog(false)}
                  className="px-6 py-3 text-lg border-2 border-gray-300 hover:border-gray-400"
                >
                Hủy
              </Button>
                <Button 
                  type="submit"
                  className="px-6 py-3 text-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  Tạo chủ đề
                </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

        {/* Add Vocabulary Dialog */}
      <Dialog open={showAddVocabularyDialog} onOpenChange={setShowAddVocabularyDialog}>
          <DialogContent className="max-w-4xl">
          <DialogHeader>
              <DialogTitle>Thêm từ vựng vào chủ đề</DialogTitle>
          </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Chọn chủ đề *</Label>
              <select
                value={selectedPersonalTopic}
                onChange={(e) => setSelectedPersonalTopic(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
              >
                  <option value="">Chọn chủ đề</option>
                {personalTopics.map((topic) => (
                  <option key={topic._id} value={topic._id}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedVocabularies.length > 0 && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-800">
                Đã chọn {selectedVocabularies.length} từ vựng
                  </p>
              </div>
            )}

              <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                  onClick={() => setShowAddVocabularyDialog(false)}
              >
                Hủy
              </Button>
              <Button
                  onClick={handleAddVocabularies}
                  disabled={selectedVocabularies.length === 0 || !selectedPersonalTopic}
              >
                  Thêm từ vựng
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

        {/* Topic Quiz */}
        {selectedTopicForQuiz && (
          <TopicQuiz
            topicId={selectedTopicForQuiz.id}
            topicName={selectedTopicForQuiz.name}
            isOpen={showTopicQuiz}
            onClose={() => {
              setShowTopicQuiz(false)
              setSelectedTopicForQuiz(null)
              // Refresh list and statuses after quiz persists results
              fetchAvailableVocabularies()
            }}
          />
        )}
      </div>
    </div>
  )
}