import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { 
  BookOpen, 
  Volume2, 
  Star, 
  Target, 
  Brain, 
  TrendingUp,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  XCircle,
  Loader2,
  Flag,
  Plus
} from 'lucide-react'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { ReportErrorDialog } from '../components/ReportErrorDialog'
import toast from 'react-hot-toast'

interface Vocabulary {
  _id: string
  word: string
  pronunciation: string
  meaning: string
  level: number
  topics: string[]
  audio?: string
  examples: string[]
  synonyms: string[]
  antonyms: string[]
  partOfSpeech: string
  questions?: any[]
}

interface Topic {
  _id: string
  name: string
  description?: string
  color?: string
}

interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: string
  explanation?: string
}

export const Vocabulary = () => {
  const { user } = useAuth()
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const [userAnswer, setUserAnswer] = useState('')
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [quizAnswers, setQuizAnswers] = useState<string[]>([])
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0)
  const [wordStatus, setWordStatus] = useState<'learning' | 'known' | 'needs-study' | 'skip'>('learning')
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [showTopicSelector, setShowTopicSelector] = useState(true)
  const [aiSuggestions, setAiSuggestions] = useState<Vocabulary[]>([])
  const [suggestionLoading, setSuggestionLoading] = useState(false)
  const [customKeywords, setCustomKeywords] = useState('')

  const filteredVocabulary = selectedTopic 
    ? vocabularies.filter(word => word.topics.includes(selectedTopic))
    : vocabularies

  const currentWord = filteredVocabulary[currentWordIndex]

  useEffect(() => {
    fetchTopics()
    fetchVocabularies()
  }, [])

  useEffect(() => {
    if (selectedTopic) {
      fetchVocabularies(selectedTopic)
    }
  }, [selectedTopic])

  const fetchTopics = async () => {
    try {
      const response = await api.get('/vocabulary/topics')
      setTopics(response.data)
    } catch (error) {
      console.error('Failed to fetch topics:', error)
      toast.error('Không thể tải danh sách chủ đề')
    }
  }

  const fetchVocabularies = async (topic?: string) => {
    try {
      setLoading(true)
      const params = topic ? { topic } : {}
      const response = await api.get('/vocabulary/suggested', { params })
      setVocabularies(response.data)
      setCurrentWordIndex(0)
      setShowAnswer(false)
      setUserAnswer('')
    } catch (error) {
      console.error('Failed to fetch vocabularies:', error)
      toast.error('Không thể tải từ vựng')
    } finally {
      setLoading(false)
    }
  }

  const getAISuggestions = async (topic: string, keywords?: string) => {
    try {
      setSuggestionLoading(true)
      const response = await api.post('/vocabulary/ai-suggestions', {
        topic,
        keywords: keywords || ''
      })
      setAiSuggestions(response.data.suggestedVocabulary || [])
      setVocabularies(response.data.suggestedVocabulary || [])
      setCurrentWordIndex(0)
      setShowAnswer(false)
      setUserAnswer('')
      setShowTopicSelector(false)
      toast.success(`Đã tìm thấy ${response.data.suggestedVocabulary?.length || 0} từ vựng theo chủ đề "${topic}"`)
    } catch (error) {
      console.error('Failed to get AI suggestions:', error)
      toast.error('Không thể lấy gợi ý từ AI')
    } finally {
      setSuggestionLoading(false)
    }
  }

  const handlePlayAudio = () => {
    if (currentWord?.audio) {
      setIsPlaying(true)
      const audio = new Audio(currentWord.audio)
      audio.play()
      audio.onended = () => setIsPlaying(false)
    }
  }

  const handleNext = () => {
    if (currentWordIndex < filteredVocabulary.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1)
      setShowAnswer(false)
      setUserAnswer('')
      setWordStatus('learning')
    }
  }

  const handlePrevious = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(currentWordIndex - 1)
      setShowAnswer(false)
      setUserAnswer('')
      setWordStatus('learning')
    }
  }

  const handleWordStatus = async (status: 'known' | 'needs-study' | 'skip') => {
    if (status === 'known') {
      // Show quiz
      try {
        const response = await api.get(`/vocabulary/${currentWord._id}/quiz`)
        setQuizQuestions(response.data.questions)
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
      }
    }
  }

  const handleQuizAnswer = (answer: string) => {
    const newAnswers = [...quizAnswers]
    newAnswers[currentQuizIndex] = answer
    setQuizAnswers(newAnswers)
    
    if (currentQuizIndex < quizQuestions.length - 1) {
      setCurrentQuizIndex(currentQuizIndex + 1)
    } else {
      // Submit quiz
      completeVocabulary(newAnswers)
    }
  }

  const completeVocabulary = async (answers: string[]) => {
    try {
      const response = await api.post('/vocabulary/complete', {
        vocabularyId: currentWord._id,
        quizAnswers: answers
      })
      
      if (response.data.quizPassed) {
        toast.success('Chúc mừng! Bạn đã hoàn thành từ vựng này!')
        setScore(score + 1)
      } else {
        toast.error('Bạn cần học thêm từ này')
      }
      
      setShowQuiz(false)
      setShowAnswer(true)
      setWordStatus(response.data.quizPassed ? 'known' : 'needs-study')
    } catch (error) {
      console.error('Failed to complete vocabulary:', error)
      toast.error('Không thể hoàn thành từ vựng')
    }
  }

  const handleReset = () => {
    setCurrentWordIndex(0)
    setShowAnswer(false)
    setUserAnswer('')
    setScore(0)
    setWordStatus('learning')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Đang tải từ vựng...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Học từ vựng</h1>
          <p className="text-gray-600">Chọn chủ đề để bắt đầu học từ vựng mới</p>
        </div>

        {/* Topic Selector */}
        {showTopicSelector && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600" />
                Chọn cách học từ vựng
              </CardTitle>
              <CardDescription>
                Chọn chủ đề có sẵn hoặc nhập từ khóa để AI gợi ý từ vựng
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Predefined Topics */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Chủ đề có sẵn</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {topics.map((topic) => (
                    <Button
                      key={topic._id}
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-blue-50"
                      onClick={() => getAISuggestions(topic.name)}
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium">{topic.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Keywords */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Tùy chỉnh từ khóa</h3>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Nhập từ khóa (ví dụ: gia đình, màu sắc, thức ăn...)"
                      value={customKeywords}
                      onChange={(e) => setCustomKeywords(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <Button
                    onClick={() => getAISuggestions('Tùy chỉnh', customKeywords)}
                    disabled={!customKeywords.trim() || suggestionLoading}
                    className="px-6"
                  >
                    {suggestionLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Đang tìm...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        AI Gợi ý
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  AI sẽ gợi ý 10 từ vựng phù hợp với từ khóa của bạn
                </p>
              </div>
            </CardContent>
          </Card>
        )}

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
                  variant={selectedTopic === null ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setSelectedTopic(null)}
                >
                  <Target className="mr-2 h-4 w-4" />
                  Tất cả ({vocabularies.length})
                </Button>
                {topics.map((topic) => (
                  <Button
                    key={topic._id}
                    variant={selectedTopic === topic.name ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => setSelectedTopic(topic.name)}
                  >
                    <div className={`w-3 h-3 rounded-full ${topic.color || 'bg-blue-500'} mr-2`} />
                    {topic.name}
                  </Button>
                ))}
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
                    <span>{currentWordIndex + 1}/{filteredVocabulary.length}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${filteredVocabulary.length > 0 ? ((currentWordIndex + 1) / filteredVocabulary.length) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Điểm số</span>
                    <span className="font-semibold">{score}</span>
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
                      {currentWord.topics.map((topic) => (
                        <Badge key={topic} variant="secondary">{topic}</Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-gray-500">
                        {currentWordIndex + 1} / {filteredVocabulary.length}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowReportDialog(true)}
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
                        onClick={handlePlayAudio}
                        disabled={isPlaying}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                      >
                        {isPlaying ? (
                          <Pause className="mr-2 h-4 w-4" />
                        ) : (
                          <Play className="mr-2 h-4 w-4" />
                        )}
                        {isPlaying ? 'Đang phát...' : 'Phát âm thanh'}
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

                        {currentWord.synonyms.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-700">Từ đồng nghĩa:</h4>
                            <div className="flex flex-wrap gap-2">
                              {currentWord.synonyms.map((synonym, index) => (
                                <Badge key={index} variant="secondary">{synonym}</Badge>
                              ))}
                            </div>
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
                          onClick={() => handleQuizAnswer(option)}
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
                    disabled={currentWordIndex === filteredVocabulary.length - 1}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                  >
                    Tiếp theo
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Error Dialog */}
      <ReportErrorDialog
        isOpen={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        itemType="vocabulary"
        itemId={currentWord?._id || ''}
        itemContent={currentWord?.word || ''}
      />
    </div>
  )
}
