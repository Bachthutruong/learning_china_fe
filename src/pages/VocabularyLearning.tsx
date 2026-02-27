import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
// import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { VocabularyStudyCard } from '../components/VocabularyStudyCard'
import { TopicQuiz } from '../components/TopicQuiz'
import { AddVocabulary } from './AddVocabulary'
import {
  Plus,
  Loader2,
  BookOpen,
  Tag,
  Play,
  RotateCcw,
  ArrowLeft,
  CheckCircle,
  TrendingUp
} from 'lucide-react'
import { api } from '../services/api'
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

interface MonthlyVocabularyLearner {
  userId: string
  name: string
  email: string
  level: number | null
  learnedCount: number
  studyingCount: number
  totalVocabularies: number
}

export const VocabularyLearning = () => {
  const [personalTopics, setPersonalTopics] = useState<PersonalTopic[]>([])
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [availableVocabularies, setAvailableVocabularies] = useState<Vocabulary[]>([])
  // Removed add-to-topic local selection; handled in AddVocabulary dialog
  const [loading, setLoading] = useState(true)
  const [showCreateTopicDialog, setShowCreateTopicDialog] = useState(false)
  const [showAddVocabularyDialog, setShowAddVocabularyDialog] = useState(false)
  const [newTopicName, setNewTopicName] = useState('')
  const [newTopicDescription, setNewTopicDescription] = useState('')
  const [searchTerm] = useState('')
  // No longer used after moving add flow to dialog page
  
  // Study mode states
  const [studyMode, setStudyMode] = useState(false)
  const [studyVocabularies, setStudyVocabularies] = useState<Vocabulary[]>([])
  const [currentStudyIndex, setCurrentStudyIndex] = useState(0)
  const [showTopicQuiz, setShowTopicQuiz] = useState(false)
  const [selectedTopicForQuiz, setSelectedTopicForQuiz] = useState<{id: string, name: string} | null>(null)
  const [vocabularyStatuses, setVocabularyStatuses] = useState<Record<string, 'learned' | 'studying' | 'skipped'>>({})
  const [activeTab, setActiveTab] = useState<'studying' | 'learned'>('studying')
  const [isSingleWordMode, setIsSingleWordMode] = useState(false)
  const vocabListAnchorRef = useRef<HTMLDivElement | null>(null)
  const [selectedInlineVocabulary, setSelectedInlineVocabulary] = useState<Vocabulary | null>(null)
  console.log(selectedInlineVocabulary)
  const studyTopRef = useRef<HTMLDivElement | null>(null)
  // Monthly test stats states
  const [statsMonth, setStatsMonth] = useState<string>(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = (now.getMonth() + 1).toString().padStart(2, '0')
    return `${y}-${m}`
  })
  const [statsLoading, setStatsLoading] = useState<boolean>(false)
  const [vocabLearnerStats, setVocabLearnerStats] = useState<MonthlyVocabularyLearner[]>([])
  const [statsError, setStatsError] = useState<string | null>(null)

  useEffect(() => {
    fetchPersonalTopics()
    // Load this month's stats initially
    void fetchMonthlyVocabularyLearnerStats()
  }, [])

  const fetchMonthlyVocabularyLearnerStats = async (month?: string) => {
    try {
      setStatsLoading(true)
      setStatsError(null)
      const params: any = {}
      if (month && /^\d{4}-\d{2}$/.test(month)) params.month = month
      const response = await api.get('/vocabulary-learning/stats/monthly', { params })
      const rows: MonthlyVocabularyLearner[] = response.data?.results || []
      setVocabLearnerStats(rows)
    } catch (error: any) {
      console.error('Error fetching monthly vocabulary learner stats:', error)
      setStatsError(error?.response?.data?.message || 'Không thể tải thống kê người học từ vựng')
      setVocabLearnerStats([])
    } finally {
      setStatsLoading(false)
    }
  }

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

  const fetchAvailableVocabularies = async (): Promise<Vocabulary[]> => {
    if (selectedTopics.length === 0) {
      setAvailableVocabularies([])
      return []
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
      const list: Vocabulary[] = response.data.vocabularies || response.data
      setAvailableVocabularies(list)
      // nhận trạng thái từ server (nếu có) để hiển thị lại sau reload
      if (response.data.statuses) {
        setVocabularyStatuses(response.data.statuses)
      }
      return list
    } catch (error) {
      console.error('Error fetching vocabularies:', error)
      toast.error('Không thể tải danh sách từ vựng')
      return []
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

  // Removed legacy inline add handler; handled inside AddVocabulary

  const handleTopicSelect = (topicId: string) => {
    setSelectedTopics(prev => 
      prev.includes(topicId) 
        ? [] // Bỏ chọn nếu đã chọn
        : [topicId] // Chỉ chọn 1 chủ đề
    )
  }



  const startStudyMode = async (vocabularies: Vocabulary[], singleWord = false, initialIndex = 0) => {
    // Bắt đầu học: luôn vào giao diện học đầy đủ
    setSelectedInlineVocabulary(null)
    let listToUse = vocabularies
    if (!listToUse || listToUse.length === 0) {
      listToUse = await fetchAvailableVocabularies()
    }
    setStudyVocabularies(listToUse)
    setCurrentStudyIndex(Math.min(Math.max(initialIndex, 0), Math.max(0, listToUse.length - 1)))
    setStudyMode(true)
    setIsSingleWordMode(singleWord)
    try { window.scrollTo({ top: 0, behavior: 'smooth' }) } catch {}
  }

  const handleStudyStatusChange = async (status: 'learned' | 'studying' | 'skipped'): Promise<void> => {
    const currentVocab = studyVocabularies[currentStudyIndex]

    // Bỏ qua: chỉ tạm thời trong phiên học, không gọi API, đưa từ hiện tại xuống cuối hàng
    if (status === 'skipped') {
      setVocabularyStatuses(prev => ({
        ...prev,
        [currentVocab._id]: 'skipped'
      }))

      if (isSingleWordMode) {
        // Nếu là chế độ học từng từ, quay lại danh sách sau khi bỏ qua
        setStudyMode(false)
        setCurrentStudyIndex(0)
        setIsSingleWordMode(false)
        fetchAvailableVocabularies()
        toast('Đã bỏ qua từ vựng này.')
        return
      }

      // Chuyển ngay sang từ tiếp theo, không thay đổi thứ tự danh sách
      setCurrentStudyIndex(prev => {
        const nextIndex = prev + 1
        if (nextIndex < studyVocabularies.length) return nextIndex
        return 0
      })
      toast('Đã bỏ qua. Chuyển sang từ kế tiếp.')
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
      if (isSingleWordMode) {
        // Nếu là chế độ học từng từ, quay lại danh sách sau khi hoàn thành
        setStudyMode(false)
        setCurrentStudyIndex(0)
        setIsSingleWordMode(false)
        // Refresh danh sách từ vựng để cập nhật trạng thái
        fetchAvailableVocabularies()
        toast.success('Đã cập nhật trạng thái từ vựng!')
      } else if (currentStudyIndex < studyVocabularies.length - 1) {
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

  // Pre-computed lists để dùng chung cho cả hiển thị và badge đếm
  const studyingVocabularies = availableVocabularies.filter(vocab =>
    vocabularyStatuses[vocab._id] !== 'learned'
  )
  const learnedVocabularies = availableVocabularies.filter(vocab =>
    vocabularyStatuses[vocab._id] === 'learned'
  )

  const getFilteredVocabularies = () => {
    return activeTab === 'studying' ? studyingVocabularies : learnedVocabularies
  }

  const handleVocabularyClick = (vocabulary: Vocabulary) => {
    const index = availableVocabularies.findIndex(v => v._id === vocabulary._id)
    setSelectedInlineVocabulary(null)
    startStudyMode(availableVocabularies, false, index >= 0 ? index : 0)
  }

  useEffect(() => {
    fetchAvailableVocabularies()
  }, [selectedTopics, searchTerm])


  // Scroll to vocab list when a topic gets selected
  useEffect(() => {
    if (selectedTopics.length > 0) {
      // Ensure DOM is ready
      requestAnimationFrame(() => {
        vocabListAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }, [selectedTopics])

  // Reset inline study card and study states when switching topics
  useEffect(() => {
    if (selectedTopics.length > 0) {
      setSelectedInlineVocabulary(null)
      setIsSingleWordMode(false)
      setStudyVocabularies([])
      setCurrentStudyIndex(0)
    }
  }, [selectedTopics])

  // Khi bắt đầu học, tự động cuộn lên đầu phần học
  useEffect(() => {
    if (studyMode) {
      requestAnimationFrame(() => {
        // Cuộn hẳn lên đầu trang
        try {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        } catch {}
        try {
          // Fallback cho một số trình duyệt/webview
          document.documentElement.scrollTop = 0
          document.body.scrollTop = 0
        } catch {}
        // Đồng thời đảm bảo scroll đến anchor đầu phần học
        studyTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setTimeout(() => {
          try {
            window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
          } catch {}
        }, 50)
      })
    }
  }, [studyMode])

  // Study mode render
  if (studyMode && studyVocabularies.length > 0) {
    return (
      <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8">
        <div ref={studyTopRef} />
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setStudyMode(false)}
              className="rounded-xl font-bold text-gray-500 hover:text-primary hover:bg-primary/5"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
            </Button>
            <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-sm font-black text-gray-900">
                Đang học: {personalTopics.find(t => t._id === selectedTopics[0])?.name}
              </span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-wrap justify-center gap-2">
              {studyVocabularies.map((v, idx) => (
                <button
                  key={v._id}
                  onClick={() => setCurrentStudyIndex(idx)}
                  className={`w-10 h-10 rounded-xl font-bold text-sm transition-all transform hover:scale-110 ${
                    idx === currentStudyIndex
                      ? 'chinese-gradient text-white shadow-lg ring-4 ring-primary/10'
                      : 'bg-white text-gray-400 border border-gray-100 hover:border-primary/20 hover:text-primary'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <div className="animate-in fade-in zoom-in duration-500">
              <VocabularyStudyCard
                vocabulary={studyVocabularies[currentStudyIndex]}
                onStatusChange={handleStudyStatusChange}
                status={vocabularyStatuses[studyVocabularies[currentStudyIndex]._id]}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-primary text-xs font-bold uppercase tracking-widest">Kho học liệu cá nhân</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
            Chinh phục <span className="text-primary">Từ vựng</span>
          </h1>
          <p className="text-gray-500 font-medium">
            Hệ thống học tập thông minh giúp bạn ghi nhớ từ vựng vĩnh viễn thông qua các chủ đề cá nhân hóa.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Button
              onClick={() => setShowCreateTopicDialog(true)}
              className="chinese-gradient h-12 px-6 rounded-2xl font-black shadow-lg shadow-primary/20 hover:shadow-primary/30 transform hover:-translate-y-1 transition-all"
            >
              <Plus className="w-5 h-5 mr-2" />
              Tạo chủ đề
            </Button>
            <Button
              onClick={() => setShowAddVocabularyDialog(true)}
              variant="outline"
              className="h-12 px-6 rounded-2xl font-black border-2 border-gray-200 hover:border-primary hover:text-primary transform hover:-translate-y-1 transition-all"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Thêm từ mới
            </Button>
          </div>
        </div>

        {/* Topics Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900 flex items-center">
              <Tag className="w-5 h-5 mr-2 text-primary" />
              Chủ đề của bạn
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {personalTopics.map((topic) => (
              <div
                key={topic._id}
                onClick={() => handleTopicSelect(topic._id)}
                className={`group relative p-6 rounded-[2rem] cursor-pointer transition-all duration-300 border-2 overflow-hidden ${
                  selectedTopics.includes(topic._id)
                    ? 'bg-white border-primary shadow-xl ring-4 ring-primary/5'
                    : 'bg-white border-gray-100 hover:border-primary/20 shadow-sm hover:shadow-lg'
                }`}
              >
                {selectedTopics.includes(topic._id) && (
                  <div className="absolute top-0 right-0 w-24 h-24 chinese-gradient opacity-5 rounded-bl-[4rem]" />
                )}
                
                <div className="relative z-10 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-6 ${
                      selectedTopics.includes(topic._id) ? 'chinese-gradient text-white shadow-lg' : 'bg-gray-50 text-gray-400'
                    }`}>
                      <Tag className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Từ vựng</span>
                      <span className="text-lg font-black text-gray-900">{topic.vocabularyCount}</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{topic.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1 font-medium">
                      {topic.description || 'Học tập không giới hạn...'}
                    </p>
                  </div>
                  
                  <div className="pt-4 flex items-center justify-between">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        startTopicQuiz(topic._id, topic.name)
                      }}
                      className="rounded-xl font-bold text-xs hover:bg-primary/5 hover:text-primary h-9"
                      disabled={(topic as any).learnedCount === 0}
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                      Khảo bài
                    </Button>
                    {selectedTopics.includes(topic._id) && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          startStudyMode(availableVocabularies, false)
                        }}
                        className="chinese-gradient text-white rounded-xl font-black text-xs h-9 shadow-md"
                      >
                        <Play className="w-3.5 h-3.5 mr-1.5" />
                        Học ngay
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Topic Detail */}
        {selectedTopics.length > 0 && (
          <div ref={vocabListAnchorRef} className="space-y-8 animate-in slide-in-from-bottom duration-700">
            <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Chi tiết từ vựng</h2>
                  <p className="text-gray-500 font-medium">Quản lý và ôn tập các từ vựng trong chủ đề đã chọn.</p>
                </div>
                
                <div className="flex items-center space-x-2 bg-gray-50 p-1.5 rounded-2xl">
                  <button
                    onClick={() => setActiveTab('studying')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                      activeTab === 'studying'
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Đang học ({studyingVocabularies.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('learned')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                      activeTab === 'learned'
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Đã thuộc ({learnedVocabularies.length})
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : availableVocabularies.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {getFilteredVocabularies().map((vocabulary) => (
                    <div
                      key={vocabulary._id}
                      onClick={() => handleVocabularyClick(vocabulary)}
                      className="group p-4 rounded-2xl bg-gray-50/50 border border-gray-100 hover:border-primary/30 hover:bg-white hover:shadow-lg transition-all text-center cursor-pointer relative"
                    >
                      <div className="text-2xl font-black text-gray-900 group-hover:text-primary transition-colors">{vocabulary.word}</div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{vocabulary.pinyin}</div>
                      <div className="text-xs text-gray-500 line-clamp-1 mt-2 font-medium">{vocabulary.meaning}</div>
                      
                      {vocabularyStatuses[vocabulary._id] === 'learned' && (
                        <div className="absolute top-2 right-2">
                           <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-3 h-3 text-white" />
                           </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  <button 
                    onClick={() => setShowAddVocabularyDialog(true)}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                  >
                    <Plus className="w-6 h-6 mb-2" />
                    <span className="text-[10px] font-black uppercase">Thêm từ</span>
                  </button>
                </div>
              ) : (
                <div className="text-center py-16 space-y-6">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                    <BookOpen className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-gray-900">Chưa có từ vựng nào</h3>
                    <p className="text-gray-500 font-medium">Hãy bắt đầu hành trình bằng cách thêm từ vựng đầu tiên của bạn.</p>
                  </div>
                  <Button
                    onClick={() => setShowAddVocabularyDialog(true)}
                    className="chinese-gradient h-12 px-8 rounded-2xl font-black shadow-lg"
                  >
                    Thêm từ ngay
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Statistics Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-primary" />
              Bảng vàng học tập
            </h2>
            
            <div className="flex items-center space-x-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
               <input
                 type="month"
                 value={statsMonth}
                 onChange={(e) => {
                   setStatsMonth(e.target.value)
                   void fetchMonthlyVocabularyLearnerStats(e.target.value)
                 }}
                 className="text-xs font-black uppercase tracking-widest text-gray-600 bg-transparent border-none focus:ring-0 cursor-pointer"
               />
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-xl">
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead>
                   <tr className="bg-gray-50/50 border-b border-gray-100">
                     <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Thứ hạng</th>
                     <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Học viên</th>
                     <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Trình độ</th>
                     <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Đã thuộc</th>
                     <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Tổng vốn từ</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                    {statsLoading ? (
                      [1, 2, 3].map(i => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={5} className="px-8 py-6 h-16 bg-gray-50/20" />
                        </tr>
                      ))
                    ) : vocabLearnerStats.length > 0 ? (
                      vocabLearnerStats.map((row, idx) => (
                        <tr key={row.userId} className="group hover:bg-gray-50/50 transition-colors">
                          <td className="px-8 py-6">
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${
                              idx === 0 ? 'bg-yellow-400 text-white shadow-lg' :
                              idx === 1 ? 'bg-gray-300 text-white shadow-lg' :
                              idx === 2 ? 'bg-amber-600 text-white shadow-lg' : 'text-gray-400'
                            }`}>
                              {idx + 1}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center space-x-3">
                               <div className="w-10 h-10 rounded-xl chinese-gradient flex items-center justify-center text-white font-black">
                                  {row.name.charAt(0).toUpperCase()}
                               </div>
                               <div>
                                  <p className="text-sm font-black text-gray-900">{row.name}</p>
                                  <p className="text-[10px] text-gray-500 font-medium italic">{row.email}</p>
                               </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                             <span className="bg-primary/5 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/10">
                                Level {row.level || 1}
                             </span>
                          </td>
                          <td className="px-8 py-6 text-center">
                             <span className="text-sm font-black text-green-600">+{row.learnedCount}</span>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <span className="text-sm font-black text-gray-900">{row.totalVocabularies}</span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-8 py-12 text-center text-gray-400 font-medium">Chưa có dữ liệu thống kê cho tháng này.</td>
                      </tr>
                    )}
                 </tbody>
               </table>
             </div>
          </div>
        </div>

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
                Chưa có chủ đề nào
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
      <Dialog open={showAddVocabularyDialog} onOpenChange={(open) => {
        setShowAddVocabularyDialog(open)
        if (!open) {
          // Refresh lists when dialog closes
          fetchPersonalTopics()
          fetchAvailableVocabularies()
        }
      }}>
        <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto p-0">
          <AddVocabulary
            inDialog
            onClose={() => setShowAddVocabularyDialog(false)}
            initialSelectedPersonalTopics={selectedTopics}
          />
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
  )
}