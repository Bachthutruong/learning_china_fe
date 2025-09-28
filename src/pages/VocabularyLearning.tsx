import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { 
  Plus, 
  Play,
  CheckCircle,
  Clock,
  X,
  Target,
  Loader2,
  BookOpen,
  TrendingUp,
  Pause,
  RotateCcw,
  Brain,
  XCircle,
  Flag
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

interface Topic {
  _id: string
  name: string
  description?: string
  color?: string
}


export const VocabularyLearning = () => {
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([])
  const [personalTopics, setPersonalTopics] = useState<PersonalTopic[]>([])
  const [systemTopics, setSystemTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTopic, setSelectedTopic] = useState<string>('all')
  const [showStudyDialog, setShowStudyDialog] = useState(false)
  const [currentStudyVocabulary, setCurrentStudyVocabulary] = useState<Vocabulary | null>(null)
  const [showQuizDialog, setShowQuizDialog] = useState(false)
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [quizAnswers, setQuizAnswers] = useState<number[]>([])
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [quizScore, setQuizScore] = useState(0)
  const [isPlaying, setIsPlaying] = useState<string | null>(null)
  const [audioLoading, setAudioLoading] = useState<string | null>(null)
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [wordStatus, setWordStatus] = useState<'learning' | 'known' | 'needs-study' | 'skip'>('learning')
  const [showTopicSelector, setShowTopicSelector] = useState(true)
  const [showQuiz, setShowQuiz] = useState(false)
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0)
  const [showCreateTopicDialog, setShowCreateTopicDialog] = useState(false)
  const [newTopicName, setNewTopicName] = useState('')
  const [newTopicDescription, setNewTopicDescription] = useState('')
  const [showAddVocabularyDialog, setShowAddVocabularyDialog] = useState(false)
  const [selectedPersonalTopic, setSelectedPersonalTopic] = useState('')
  const [availableVocabularies, setAvailableVocabularies] = useState<any[]>([])
  const [selectedVocabularies, setSelectedVocabularies] = useState<string[]>([])
  const [searchVocabularyTerm, setSearchVocabularyTerm] = useState('')
  const [loadingVocabularies, setLoadingVocabularies] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalVocabularies, setTotalVocabularies] = useState(0)
  const [userVocabularies, setUserVocabularies] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (showAddVocabularyDialog) {
      const timeoutId = setTimeout(() => {
        setCurrentPage(1)
        setAvailableVocabularies([])
        fetchAvailableVocabularies(1, false)
      }, 500) // 500ms debounce
      
      return () => clearTimeout(timeoutId)
    }
  }, [showAddVocabularyDialog, searchVocabularyTerm])

  const fetchData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchVocabularies(),
        fetchPersonalTopics(),
        fetchSystemTopics(),
        fetchUserVocabularies().then(setUserVocabularies)
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Không thể tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const fetchVocabularies = async () => {
    try {
      let topicParam = undefined
      if (selectedTopic !== 'all') {
        if (selectedTopic.startsWith('sys_')) {
          // System topic - use topic name
          const topicId = selectedTopic.replace('sys_', '')
          const topic = systemTopics.find(t => t._id === topicId)
          topicParam = topic?.name
        } else {
          // Personal topic - use topic ID
          topicParam = selectedTopic
        }
      }

      const response = await api.get('/vocabulary-learning/vocabularies', {
        params: {
          topic: topicParam,
          limit: 10
        }
      })
      setVocabularies(response.data.vocabularies || response.data || [])
      setCurrentWordIndex(0)
      setShowTopicSelector(false)
    } catch (error) {
      console.error('Error fetching vocabularies:', error)
    }
  }

  const fetchPersonalTopics = async () => {
    try {
      const response = await api.get('/vocabulary-learning/user/personal-topics')
      setPersonalTopics(response.data.topics || response.data || [])
    } catch (error) {
      console.error('Error fetching personal topics:', error)
    }
  }

  const fetchSystemTopics = async () => {
    try {
      const response = await api.get('/vocabulary/topics')
      setSystemTopics(response.data || [])
    } catch (error) {
      console.error('Error fetching system topics:', error)
    }
  }

  const fetchUserVocabularies = async () => {
    try {
      console.log('Fetching user vocabularies...')
      const response = await api.get('/vocabulary-learning/user/vocabularies')
      console.log('User vocabularies response:', response.data)
      const userVocabs = response.data.userVocabularies || []
      console.log('User vocabularies count:', userVocabs.length)
      return userVocabs
    } catch (error) {
      console.error('Error fetching user vocabularies:', error)
      return []
    }
  }

  const handleCreatePersonalTopic = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newTopicName.trim()) {
      toast.error('Vui lòng nhập tên chủ đề')
      return
    }

    try {
      await api.post('/vocabulary-learning/user/personal-topics', {
        name: newTopicName.trim(),
        description: newTopicDescription.trim()
      })
      
      toast.success('Tạo chủ đề cá nhân thành công!')
      setShowCreateTopicDialog(false)
      setNewTopicName('')
      setNewTopicDescription('')
      fetchPersonalTopics()
    } catch (error: any) {
      console.error('Error creating personal topic:', error)
      toast.error(error.response?.data?.message || 'Không thể tạo chủ đề')
    }
  }

  const fetchAvailableVocabularies = async (page = 1, append = false) => {
    try {
      setLoadingVocabularies(true)
      console.log('Fetching vocabularies:', { page, search: searchVocabularyTerm, append })
      
      const response = await api.get('/vocabulary', {
        params: {
          page,
          limit: 20, // Load 20 items per page
          search: searchVocabularyTerm
        }
      })
      console.log('API Response:', response.data) // Debug log
      
      const newVocabularies = response.data.vocabularies || []
      const total = response.data.total || 0
      
      console.log('New vocabularies:', newVocabularies.length, 'Total:', total)
      
      if (append) {
        setAvailableVocabularies(prev => {
          const combined = [...prev, ...newVocabularies]
          console.log('Appending - Previous:', prev.length, 'New:', newVocabularies.length, 'Combined:', combined.length)
          return combined
        })
      } else {
        setAvailableVocabularies(newVocabularies)
        console.log('Replacing - New vocabularies:', newVocabularies.length)
      }
      
      setTotalVocabularies(total)
      setCurrentPage(page)
      
      // Calculate hasMore based on current state
      const currentLength = append ? availableVocabularies.length + newVocabularies.length : newVocabularies.length
      const hasMoreData = newVocabularies.length === 20 && currentLength < total
      setHasMore(hasMoreData)
      
      // Force update hasMore after state update
      setTimeout(() => {
        const finalLength = append ? availableVocabularies.length + newVocabularies.length : newVocabularies.length
        const finalHasMore = newVocabularies.length === 20 && finalLength < total
        setHasMore(finalHasMore)
        console.log('Final hasMore:', finalHasMore, 'Final length:', finalLength, 'Total:', total)
      }, 100)
      
      console.log('Has more:', hasMoreData, 'Current length:', currentLength, 'Total:', total, 'New vocabularies:', newVocabularies.length)
    } catch (error) {
      console.error('Error fetching available vocabularies:', error)
      toast.error('Không thể tải từ vựng')
    } finally {
      setLoadingVocabularies(false)
    }
  }

  const handleAddVocabulariesToTopic = async () => {
    if (!selectedPersonalTopic || selectedVocabularies.length === 0) {
      toast.error('Vui lòng chọn chủ đề và từ vựng')
      return
    }

    try {
      // Thêm từng từ vựng vào chủ đề cá nhân
      for (const vocabularyId of selectedVocabularies) {
        await api.post('/vocabulary-learning/user/vocabularies', {
          vocabularyId,
          status: 'studying',
          personalTopicId: selectedPersonalTopic
        })
      }
      
      toast.success(`Đã thêm ${selectedVocabularies.length} từ vựng vào chủ đề!`)
      setShowAddVocabularyDialog(false)
      setSelectedPersonalTopic('')
      setSelectedVocabularies([])
      setSearchVocabularyTerm('')
      
      // Refresh user vocabularies
      const updatedUserVocabs = await fetchUserVocabularies()
      setUserVocabularies(updatedUserVocabs)
    } catch (error: any) {
      console.error('Error adding vocabularies:', error)
      toast.error(error.response?.data?.message || 'Không thể thêm từ vựng')
    }
  }

  const handleVocabularySelection = (vocabularyId: string) => {
    setSelectedVocabularies(prev => 
      prev.includes(vocabularyId) 
        ? prev.filter(id => id !== vocabularyId)
        : [...prev, vocabularyId]
    )
  }

  const loadMoreVocabularies = () => {
    if (hasMore && !loadingVocabularies) {
      fetchAvailableVocabularies(currentPage + 1, true)
    }
  }

  // Scroll detection for lazy loading
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const isNearBottom = scrollHeight - scrollTop <= clientHeight + 100
    
    console.log('Scroll detected:', {
      scrollTop,
      scrollHeight,
      clientHeight,
      isNearBottom,
      hasMore,
      loadingVocabularies,
      currentPage
    })
    
    if (isNearBottom && hasMore && !loadingVocabularies) {
      console.log('Loading more vocabularies...')
      loadMoreVocabularies()
    }
  }


  const handleVocabularyAction = async (action: 'learned' | 'studying' | 'skipped', personalTopicId?: string) => {
    if (!currentStudyVocabulary) return

    try {
      if (action === 'learned') {
        // Start quiz for learned vocabulary
        await fetchQuizQuestions(currentStudyVocabulary._id)
        setShowStudyDialog(false)
        setShowQuizDialog(true)
      } else {
        // Add to user vocabularies
        await api.post('/vocabulary-learning/user/vocabularies', {
          vocabularyId: currentStudyVocabulary._id,
          status: action,
          personalTopicId: personalTopicId
        })
        
        toast.success(`Đã thêm từ "${currentStudyVocabulary.word}" vào ${action === 'studying' ? 'danh sách học' : 'danh sách bỏ qua'}`)
        setShowStudyDialog(false)
        fetchUserVocabularies()
      }
    } catch (error: any) {
      console.error('Error handling vocabulary action:', error)
      toast.error(error.response?.data?.message || 'Không thể xử lý từ vựng')
    }
  }

  const fetchQuizQuestions = async (vocabularyId: string) => {
    try {
      const response = await api.get(`/vocabulary-learning/vocabularies/${vocabularyId}/quiz`)
      const questions = response.data.questions || []
      
      // Take up to 3 random questions
      const shuffled = questions.sort(() => 0.5 - Math.random())
      const selectedQuestions = shuffled.slice(0, Math.min(3, questions.length))
      
      setQuizQuestions(selectedQuestions)
      setQuizAnswers(new Array(selectedQuestions.length).fill(-1))
      setQuizCompleted(false)
      setQuizScore(0)
    } catch (error) {
      console.error('Error fetching quiz questions:', error)
      toast.error('Không thể tải câu hỏi khảo bài')
    }
  }

  const handleQuizAnswer = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...quizAnswers]
    newAnswers[questionIndex] = answerIndex
    setQuizAnswers(newAnswers)
  }

  const handleSubmitQuiz = async () => {
    if (quizAnswers.some(answer => answer === -1)) {
      toast.error('Vui lòng trả lời tất cả câu hỏi')
      return
    }

    let correctAnswers = 0
    quizQuestions.forEach((question, index) => {
      if (quizAnswers[index] === question.correctAnswer) {
        correctAnswers++
      }
    })

    const score = (correctAnswers / quizQuestions.length) * 100
    setQuizScore(score)
    setQuizCompleted(true)

    if (score === 100) {
      // All correct - add to learned and give rewards
      try {
        await api.post('/vocabulary-learning/user/vocabularies', {
          vocabularyId: currentStudyVocabulary?._id,
          status: 'learned',
          personalTopicId: selectedTopic !== 'all' ? selectedTopic : undefined
        })
        
        toast.success(`Chúc mừng! Bạn đã học thuộc từ "${currentStudyVocabulary?.word}" và nhận được 0.5 XP + 0.5 xu!`)
        fetchUserVocabularies()
      } catch (error: any) {
        console.error('Error adding learned vocabulary:', error)
        toast.error('Không thể lưu tiến độ học tập')
      }
    } else {
      // Not all correct - add to studying
      try {
        await api.post('/vocabulary-learning/user/vocabularies', {
          vocabularyId: currentStudyVocabulary?._id,
          status: 'studying',
          personalTopicId: selectedTopic !== 'all' ? selectedTopic : undefined
        })
        
        toast.error(`Bạn cần học thêm từ "${currentStudyVocabulary?.word}". Đã thêm vào danh sách cần học.`)
        fetchUserVocabularies()
      } catch (error: any) {
        console.error('Error adding studying vocabulary:', error)
        toast.error('Không thể lưu tiến độ học tập')
      }
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

  const handleNext = () => {
    if (currentWordIndex < vocabularies.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1)
      setWordStatus('learning')
    }
  }

  const handlePrevious = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(currentWordIndex - 1)
      setWordStatus('learning')
    }
  }

  const handleReset = () => {
    setCurrentWordIndex(0)
    setWordStatus('learning')
  }

  const handleWordStatus = async (status: 'known' | 'needs-study' | 'skip') => {
    if (status === 'known') {
      // Show quiz - 3 câu hỏi ngẫu nhiên
      try {
        const response = await api.get(`/vocabulary-learning/vocabularies/${vocabularies[currentWordIndex]?._id}/quiz`)
        const questions = response.data.questions || []
        // Lấy tối đa 3 câu hỏi ngẫu nhiên
        const randomQuestions = questions
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.min(3, questions.length))
        
        setQuizQuestions(randomQuestions)
        setQuizAnswers([])
        setCurrentQuizIndex(0)
        setShowQuiz(true)
      } catch (error) {
        console.error('Failed to fetch quiz:', error)
        toast.error('Không thể tải câu hỏi')
      }
    } else {
      // Skip or mark as needs study
      setWordStatus(status)
      if (status === 'skip') {
        handleNext()
      } else {
        // Tự động tạo chủ đề nếu chưa có
        let topicId = selectedTopic
        if (selectedTopic === 'all' || selectedTopic.startsWith('sys_')) {
          // Tạo chủ đề cá nhân mới
          try {
            const topicResponse = await api.post('/vocabulary-learning/user/personal-topics', {
              name: `Học từ vựng ${new Date().toLocaleDateString()}`,
              description: 'Chủ đề tự động tạo khi học từ vựng'
            })
            topicId = topicResponse.data.topic._id
            setSelectedTopic(topicId)
            fetchPersonalTopics()
            toast.success('Đã tạo chủ đề cá nhân mới!')
          } catch (error) {
            console.error('Failed to create personal topic:', error)
            toast.error('Không thể tạo chủ đề cá nhân')
            return
          }
        }

        // Thêm từ vựng vào chủ đề
        try {
          await api.post('/vocabulary-learning/user/vocabularies', {
            vocabularyId: vocabularies[currentWordIndex]?._id,
            status: status,
            personalTopicId: topicId
          })
          toast.success('Đã thêm từ vựng vào chủ đề cá nhân!')
          handleNext()
        } catch (error) {
          console.error('Failed to add vocabulary:', error)
          toast.error('Không thể thêm từ vựng')
        }
      }
    }
  }


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  const currentWord = vocabularies[currentWordIndex]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Học từ vựng</h1>
              <p className="text-gray-600">Chọn chủ đề để bắt đầu học từ vựng mới</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowCreateTopicDialog(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Tạo chủ đề
              </Button>
              <Button
                onClick={() => setShowAddVocabularyDialog(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Thêm từ vựng
              </Button>
            </div>
          </div>
        </div>

        {/* Topic Selector */}
        {showTopicSelector && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                Chọn chủ đề học từ vựng
              </CardTitle>
              <CardDescription>
                Chọn chủ đề để bắt đầu học 10 từ vựng mới
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* System Topics */}
                {systemTopics.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Chủ đề hệ thống</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {systemTopics.map((topic) => (
                        <Button
                          key={topic._id}
                          variant="outline"
                          className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-blue-50"
                        onClick={() => {
                          setSelectedTopic(`sys_${topic._id}`)
                          setShowTopicSelector(false)
                          fetchVocabularies()
                        }}
                        >
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <BookOpen className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="text-sm font-medium">{topic.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Personal Topics */}
                {personalTopics.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Chủ đề cá nhân</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {personalTopics.map((topic) => (
                        <Button
                          key={topic._id}
                          variant="outline"
                          className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-purple-50 border-purple-200"
                          onClick={() => {
                            setSelectedTopic(topic._id)
                            setShowTopicSelector(false)
                            fetchVocabularies()
                          }}
                        >
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <BookOpen className="h-4 w-4 text-purple-600" />
                          </div>
                          <span className="text-sm font-medium">{topic.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Topics */}
                {systemTopics.length === 0 && personalTopics.length === 0 && (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      Không có chủ đề nào
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Hãy liên hệ admin để thêm chủ đề hệ thống
                    </p>
                    <Button
                      onClick={() => setShowTopicSelector(false)}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                    >
                      Bắt đầu với tất cả từ vựng
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Learning Area */}
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Topic Selection */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  Chủ đề
                </CardTitle>
                <CardDescription>
                  Chọn chủ đề bạn muốn học
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant={selectedTopic === 'all' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => {
                    setSelectedTopic('all')
                    fetchVocabularies()
                  }}
                >
                  <Target className="mr-2 h-4 w-4" />
                  Tất cả ({vocabularies.length})
                </Button>
                
                {/* System Topics */}
                {systemTopics.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Hệ thống</div>
                    {systemTopics.map((topic) => (
                      <Button
                        key={topic._id}
                        variant={selectedTopic === `sys_${topic._id}` ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => {
                          setSelectedTopic(`sys_${topic._id}`)
                          fetchVocabularies()
                        }}
                      >
                        <div className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
                        {topic.name}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Personal Topics */}
                {personalTopics.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cá nhân</div>
                    {personalTopics.map((topic) => (
                      <Button
                        key={topic._id}
                        variant={selectedTopic === topic._id ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => {
                          setSelectedTopic(topic._id)
                          fetchVocabularies()
                        }}
                      >
                        <div className="w-3 h-3 rounded-full bg-purple-500 mr-2" />
                        {topic.name}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Progress */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Tiến độ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Đã học</span>
                    <span>{currentWordIndex + 1}/{vocabularies.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Từ vựng cá nhân</span>
                    <span className="text-blue-600 font-semibold">{userVocabularies.length}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${vocabularies.length > 0 ? ((currentWordIndex + 1) / vocabularies.length) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Điểm số</span>
                    <span className="font-semibold">0</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Learning Area */}
          <div className="lg:col-span-3">
            {currentWord && !showQuiz ? (
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Cấp {currentWord.level}</Badge>
                      {selectedTopic !== 'all' ? (
                        selectedTopic.startsWith('sys_') ? (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {systemTopics.find(t => t._id === selectedTopic.replace('sys_', ''))?.name}
                          </Badge>
                        ) : personalTopics.find(t => t._id === selectedTopic) ? (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                            {personalTopics.find(t => t._id === selectedTopic)?.name}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            {selectedTopic}
                          </Badge>
                        )
                      ) : (
                        currentWord.topics.map((topic) => (
                          <Badge key={topic} variant="secondary">{topic}</Badge>
                        ))
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-gray-500">
                        {currentWordIndex + 1} / {vocabularies.length}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      >
                        <Flag className="h-4 w-4 mr-1" />
                        Báo lỗi
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-6">
                    {/* Chinese Character */}
                    <div className="text-6xl font-bold text-gray-900 mb-4">
                      {currentWord.word}
                    </div>

                    {/* Pinyin */}
                    <div className="text-2xl text-blue-600 font-medium">
                      {currentWord.pronunciation}
                    </div>

                    {/* Audio Button */}
                    {currentWord.audio && (
                      <Button
                        onClick={() => handlePlayAudio(currentWord.audio!, currentWord._id)}
                        disabled={isPlaying === currentWord._id}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                      >
                        {isPlaying === currentWord._id ? (
                          <Pause className="mr-2 h-4 w-4" />
                        ) : (
                          <Play className="mr-2 h-4 w-4" />
                        )}
                        {isPlaying === currentWord._id ? 'Đang phát...' : 'Phát âm thanh'}
                      </Button>
                    )}

                    {/* Word Status Buttons */}
                    {wordStatus === 'learning' && (
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-700">
                          Bạn đã thuộc từ này chưa?
                        </h4>
                        <div className="flex gap-2 justify-center">
                          <Button
                            onClick={() => handleWordStatus('known')}
                            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Đã thuộc
                          </Button>
                          <Button
                            onClick={() => handleWordStatus('needs-study')}
                            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                          >
                            <Brain className="mr-2 h-4 w-4" />
                            Cần học thêm
                          </Button>
                          <Button
                            onClick={() => handleWordStatus('skip')}
                            variant="outline"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Bỏ qua
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Show word details after status selection */}
                    {wordStatus !== 'learning' && (
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-semibold text-gray-700 mb-2">Nghĩa:</h4>
                          <p className="text-lg">{currentWord.meaning}</p>
                        </div>

                        {currentWord.examples.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-700">Ví dụ:</h4>
                            {currentWord.examples.map((example, index) => (
                              <div key={index} className="text-gray-600 italic">
                                {example}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2 justify-center">
                          <Button
                            onClick={handleNext}
                            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                          >
                            Tiếp theo
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : showQuiz && quizQuestions.length > 0 ? (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Kiểm tra từ vựng: {currentWord?.word}</CardTitle>
                  <CardDescription>
                    Câu {currentQuizIndex + 1} / {quizQuestions.length}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold">
                      {quizQuestions[currentQuizIndex]?.question}
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {quizQuestions[currentQuizIndex]?.options.map((option, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="justify-start h-auto p-4 text-left"
                          onClick={() => handleQuizAnswer(index, index)}
                        >
                          {String.fromCharCode(65 + index)}. {option}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="mb-6">
                <CardContent className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Không có từ vựng nào
                  </h3>
                  <p className="text-gray-500">
                    Hãy chọn một chủ đề để bắt đầu học
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            {currentWord && !showQuiz && (
              <div className="flex justify-between">
                <Button
                  onClick={handlePrevious}
                  disabled={currentWordIndex === 0}
                  variant="outline"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Trước
                </Button>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleReset}
                    variant="outline"
                  >
                    Bắt đầu lại
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={currentWordIndex === vocabularies.length - 1}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                  >
                    Tiếp theo
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

      {/* Study Dialog */}
      <Dialog open={showStudyDialog} onOpenChange={setShowStudyDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Học từ vựng: {currentStudyVocabulary?.word}</DialogTitle>
            <DialogDescription>
              Hãy suy nghĩ về nghĩa của từ này trước khi xem đáp án
            </DialogDescription>
          </DialogHeader>
          {currentStudyVocabulary && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {currentStudyVocabulary.word}
                </div>
                <div className="text-xl text-blue-600 mb-4">
                  {currentStudyVocabulary.pronunciation}
                </div>
                {currentStudyVocabulary.audio && (
                  <Button
                    onClick={() => handlePlayAudio(currentStudyVocabulary.audio!, currentStudyVocabulary._id)}
                    disabled={audioLoading === currentStudyVocabulary._id}
                    className="mb-4"
                  >
                    {audioLoading === currentStudyVocabulary._id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Phát âm
                  </Button>
                )}
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Nghĩa:</h3>
                <p className="text-lg">{currentStudyVocabulary.meaning}</p>
                {currentStudyVocabulary.partOfSpeech && (
                  <Badge variant="outline" className="mt-2">{currentStudyVocabulary.partOfSpeech}</Badge>
                )}
              </div>

              {currentStudyVocabulary.examples.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Ví dụ:</h3>
                  <ul className="space-y-1">
                    {currentStudyVocabulary.examples.slice(0, 2).map((example, index) => (
                      <li key={index} className="text-sm">• {example}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-center space-x-4">
                <Button
                  onClick={() => handleVocabularyAction('learned')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Đã thuộc
                </Button>
                <Button
                  onClick={() => handleVocabularyAction('studying')}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Cần học thêm
                </Button>
                <Button
                  onClick={() => handleVocabularyAction('skipped')}
                  variant="outline"
                >
                  <X className="h-4 w-4 mr-2" />
                  Bỏ qua
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quiz Dialog */}
      <Dialog open={showQuizDialog} onOpenChange={setShowQuizDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Khảo bài: {currentStudyVocabulary?.word}</DialogTitle>
            <DialogDescription>
              Trả lời đúng tất cả câu hỏi để hoàn thành học từ này
            </DialogDescription>
          </DialogHeader>
          {quizQuestions.length > 0 && (
            <div className="space-y-6">
              {quizQuestions.map((question, questionIndex) => (
                <div key={questionIndex} className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">
                    Câu {questionIndex + 1}: {question.question}
                  </h3>
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <label key={optionIndex} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`question-${questionIndex}`}
                          value={optionIndex}
                          checked={quizAnswers[questionIndex] === optionIndex}
                          onChange={() => handleQuizAnswer(questionIndex, optionIndex)}
                          className="text-blue-600"
                        />
                        <span className="text-sm">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {quizCompleted ? (
                <div className="text-center space-y-4">
                  <div className={`text-2xl font-bold ${quizScore === 100 ? 'text-green-600' : 'text-red-600'}`}>
                    {quizScore === 100 ? '🎉 Chúc mừng!' : '😔 Cần học thêm'}
                  </div>
                  <div className="text-lg">
                    Điểm: {quizScore.toFixed(0)}% ({quizScore === 100 ? 'Hoàn hảo!' : 'Chưa đạt yêu cầu'})
                  </div>
                  <Button
                    onClick={() => {
                      setShowQuizDialog(false)
                      setCurrentStudyVocabulary(null)
                    }}
                    className="w-full"
                  >
                    Đóng
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleSubmitQuiz}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Nộp bài
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Personal Topic Dialog */}
      <Dialog open={showCreateTopicDialog} onOpenChange={setShowCreateTopicDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo chủ đề cá nhân</DialogTitle>
            <DialogDescription>
              Tạo chủ đề học tập cá nhân để quản lý từ vựng
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreatePersonalTopic} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topicName">Tên chủ đề *</Label>
              <Input
                id="topicName"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                placeholder="Gia đình, Công việc, Du lịch..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topicDescription">Mô tả</Label>
              <Input
                id="topicDescription"
                value={newTopicDescription}
                onChange={(e) => setNewTopicDescription(e.target.value)}
                placeholder="Mô tả về chủ đề này..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateTopicDialog(false)}>
                Hủy
              </Button>
              <Button type="submit">Tạo chủ đề</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Vocabulary to Personal Topic Dialog */}
      <Dialog open={showAddVocabularyDialog} onOpenChange={setShowAddVocabularyDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Thêm từ vựng vào chủ đề cá nhân</DialogTitle>
            <DialogDescription>
              Chọn từ vựng từ hệ thống để thêm vào chủ đề cá nhân của bạn
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden flex flex-col space-y-4">
            {/* Select Personal Topic */}
            <div className="space-y-2">
              <Label>Chọn chủ đề cá nhân</Label>
              <select
                value={selectedPersonalTopic}
                onChange={(e) => setSelectedPersonalTopic(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">-- Chọn chủ đề --</option>
                {personalTopics.map((topic) => (
                  <option key={topic._id} value={topic._id}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Vocabularies */}
            <div className="space-y-2">
              <Label>Tìm kiếm từ vựng</Label>
              <Input
                value={searchVocabularyTerm}
                onChange={(e) => setSearchVocabularyTerm(e.target.value)}
                placeholder="Nhập từ khóa để tìm kiếm..."
              />
            </div>

            {/* Vocabulary List */}
            <div className="flex-1 overflow-auto border rounded-md" onScroll={handleScroll}>
              <div className="p-4 space-y-2">
                {loadingVocabularies && availableVocabularies.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Đang tải từ vựng...
                  </div>
                ) : availableVocabularies.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Không tìm thấy từ vựng nào
                  </div>
                ) : (
                  <>
                    {availableVocabularies.map((vocab) => (
                      <div
                        key={vocab._id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedVocabularies.includes(vocab._id)
                            ? 'bg-blue-50 border-blue-300'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleVocabularySelection(vocab._id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-lg">{vocab.word}</div>
                            <div className="text-gray-600">{vocab.meaning}</div>
                            {vocab.pronunciation && (
                              <div className="text-sm text-gray-500">{vocab.pronunciation}</div>
                            )}
                          </div>
                          <div className="ml-4">
                            {selectedVocabularies.includes(vocab._id) ? (
                              <CheckCircle className="h-5 w-5 text-blue-600" />
                            ) : (
                              <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Load More Button */}
                    {hasMore && (
                      <div className="text-center py-4">
                        <Button
                          variant="outline"
                          onClick={loadMoreVocabularies}
                          disabled={loadingVocabularies}
                          className="w-full"
                        >
                          {loadingVocabularies ? 'Đang tải...' : 'Tải thêm từ vựng'}
                        </Button>
                      </div>
                    )}
                    
                    {/* Loading indicator when scrolling */}
                    {loadingVocabularies && availableVocabularies.length > 0 && (
                      <div className="text-center py-4 text-gray-500">
                        Đang tải thêm từ vựng...
                      </div>
                    )}
                    
                    {/* Total count */}
                    <div className="text-center text-sm text-gray-500 py-2">
                      Hiển thị {availableVocabularies.length} / {totalVocabularies} từ vựng
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Selected Count */}
            {selectedVocabularies.length > 0 && (
              <div className="text-sm text-gray-600">
                Đã chọn {selectedVocabularies.length} từ vựng
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddVocabularyDialog(false)
                  setSelectedPersonalTopic('')
                  setSelectedVocabularies([])
                  setSearchVocabularyTerm('')
                }}
              >
                Hủy
              </Button>
              <Button
                onClick={handleAddVocabulariesToTopic}
                disabled={!selectedPersonalTopic || selectedVocabularies.length === 0}
              >
                Thêm {selectedVocabularies.length} từ vựng
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
