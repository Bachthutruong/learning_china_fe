import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Progress } from '../components/ui/progress'
import { 
  TestTube, 
  Coins, 
  Star, 
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Trophy,
  Brain,
  Zap,
  Crown,
  Sparkles,
  Rocket,
  Target,
  Award,
  BookOpen,
  Lightbulb,
  Diamond,
  Flame,
  Shield,
  ChevronRight
} from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

interface Question {
  _id: string
  level: number
  questionType: 'multiple-choice' | 'fill-blank' | 'reading-comprehension' | 'sentence-order'
  question: string
  options?: string[]
  correctAnswer?: any
  explanation?: string
}

interface TestReport {
  totalQuestions: number
  correctCount: number
  wrongCount: number
  correctQuestions: any[]
  wrongQuestions: any[]
  score: number
  rewards: {
    coins: number
    experience: number
  }
}

export const NewTestPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<{[key: number]: any}>({})
  const [loading, setLoading] = useState(false)
  const [testStarted, setTestStarted] = useState(false)
  const [testCompleted, setTestCompleted] = useState(false)
  const [testReport, setTestReport] = useState<TestReport | null>(null)
  const [userLevel, setUserLevel] = useState(1)

  useEffect(() => {
    fetchUserLevel()
  }, [])

  const fetchUserLevel = async () => {
    try {
      const response = await api.get('/users/profile')
      setUserLevel(response.data.user.level || 1)
    } catch (error) {
      console.error('Error fetching user level:', error)
    }
  }

  const startTest = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để làm test')
      return
    }

    try {
      setLoading(true)
      
      // Start test session (deduct 10,000 coins)
      await api.post('/tests/start')
      
      // Get all questions for user's level
      const response = await api.get(`/tests/questions/random?level=${userLevel}`)
      setQuestions(response.data.questions)
      setTestStarted(true)
      setCurrentIndex(0)
      setAnswers({})
      
      toast.success('Bắt đầu làm bài test!')
    } catch (error: any) {
      console.error('Error starting test:', error)
      if (error.response?.data?.insufficientCoins) {
        toast.error('Không đủ xu! Hãy học thêm từ vựng để nhận xu miễn phí!')
      } else {
        toast.error(error.response?.data?.message || 'Không thể bắt đầu test')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSelect = (answer: any) => {
    setAnswers({
      ...answers,
      [currentIndex]: answer
    })
  }

  const handleMultipleChoiceSelect = (optionIndex: number) => {
    const currentAnswer = answers[currentIndex] || []
    const isSelected = Array.isArray(currentAnswer) ? currentAnswer.includes(optionIndex) : currentAnswer === optionIndex
    
    let newAnswer
    if (Array.isArray(currentAnswer)) {
      // Already an array, toggle the option
      newAnswer = isSelected 
        ? currentAnswer.filter((i: number) => i !== optionIndex)
        : [...currentAnswer, optionIndex]
    } else {
      // Single selection, convert to array
      newAnswer = isSelected 
        ? currentAnswer.filter((i: number) => i !== optionIndex)
        : [optionIndex]
    }
    
    setAnswers({
      ...answers,
      [currentIndex]: newAnswer
    })
  }

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlePrevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const submitTest = async () => {
    try {
      setLoading(true)
      
      const questionIds = questions.map(q => q._id)
      const answerArray = questions.map((_, index) => answers[index] || null)
      
      const response = await api.post('/tests/submit', {
        answers: answerArray,
        questionIds
      })
      
      setTestReport(response.data.report)
      setTestCompleted(true)
      
      toast.success(`Hoàn thành test! Điểm: ${response.data.report.score}%`)
    } catch (error: any) {
      console.error('Error submitting test:', error)
      toast.error(error.response?.data?.message || 'Không thể nộp test')
    } finally {
      setLoading(false)
    }
  }

  const resetTest = () => {
    setQuestions([])
    setCurrentIndex(0)
    setAnswers({})
    setTestStarted(false)
    setTestCompleted(false)
    setTestReport(null)
  }

  if (testCompleted && testReport) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Enhanced Header */}
            <div className="mb-8">
              <Button 
                variant="outline" 
                onClick={() => navigate('/tests')}
                className="mb-6 bg-white/50 hover:bg-white/70 border-2 border-purple-200"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Quay lại
              </Button>
              
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                    🎉 Báo cáo chi tiết
                  </h1>
                  <div className="absolute -top-2 -right-2">
                    <Sparkles className="h-8 w-8 text-yellow-400 animate-bounce" />
                  </div>
                  <div className="absolute -bottom-2 -left-2">
                    <Trophy className="h-6 w-6 text-orange-400 animate-pulse" />
                  </div>
                </div>
                <p className="text-xl text-gray-700 font-medium">Kết quả bài test của bạn</p>
              </div>
            </div>

            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <Card className="border-0 shadow-2xl bg-gradient-to-br from-yellow-50 to-orange-100">
                <CardContent className="p-8 text-center">
                  <div className="relative inline-block mb-4">
                    <div className="p-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl">
                      <Trophy className="h-12 w-12 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2">
                      <Crown className="h-6 w-6 text-yellow-400 animate-bounce" />
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-gray-900 mb-2">{testReport.score}%</div>
                  <div className="text-lg font-semibold text-gray-600">Điểm số</div>
                  <div className="flex justify-center mt-3">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-2xl bg-gradient-to-br from-green-50 to-emerald-100">
                <CardContent className="p-8 text-center">
                  <div className="relative inline-block mb-4">
                    <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl">
                      <CheckCircle className="h-12 w-12 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2">
                      <Award className="h-6 w-6 text-green-400 animate-pulse" />
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-green-600 mb-2">{testReport.correctCount}</div>
                  <div className="text-lg font-semibold text-gray-600">Câu đúng</div>
                  <div className="flex justify-center mt-3">
                    <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
                      +{testReport.rewards.experience} XP
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-2xl bg-gradient-to-br from-red-50 to-pink-100">
                <CardContent className="p-8 text-center">
                  <div className="relative inline-block mb-4">
                    <div className="p-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl">
                      <XCircle className="h-12 w-12 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2">
                      <Target className="h-6 w-6 text-red-400 animate-ping" />
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-red-600 mb-2">{testReport.wrongCount}</div>
                  <div className="text-lg font-semibold text-gray-600">Câu sai</div>
                  <div className="flex justify-center mt-3">
                    <div className="bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-semibold">
                      Cần cải thiện
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Question Reports */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {/* Correct Questions */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-100">
                <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-white/20 rounded-full">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <span>Câu trả lời đúng ({testReport.correctCount})</span>
                      <div className="flex items-center gap-1 mt-1">
                        <Award className="h-4 w-4 text-yellow-300" />
                        <span className="text-sm text-green-100">Xuất sắc!</span>
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {testReport.correctQuestions.map((item, index) => (
                      <div key={index} className="p-4 bg-white/50 rounded-xl border-l-4 border-green-400">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-green-500 rounded-full flex-shrink-0">
                            <CheckCircle className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-green-900 mb-2">
                              Câu {index + 1}
                            </div>
                            <div className="text-sm text-green-800 mb-3">
                              {item.question}
                            </div>
                            <div className="bg-green-100 p-3 rounded-lg">
                              <div className="text-sm text-green-700 font-semibold mb-1">
                                ✅ Đáp án của bạn: {JSON.stringify(item.userAnswer)}
                              </div>
                              {item.explanation && (
                                <div className="text-sm text-green-600 mt-2">
                                  <div className="flex items-start gap-2">
                                    <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <strong>Giải thích:</strong> {item.explanation}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Wrong Questions */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-red-50 to-pink-100">
                <CardHeader className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-white/20 rounded-full">
                      <XCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <span>Câu trả lời sai ({testReport.wrongCount})</span>
                      <div className="flex items-center gap-1 mt-1">
                        <Target className="h-4 w-4 text-orange-300" />
                        <span className="text-sm text-red-100">Cần cải thiện</span>
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {testReport.wrongQuestions.map((item, index) => (
                      <div key={index} className="p-4 bg-white/50 rounded-xl border-l-4 border-red-400">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-red-500 rounded-full flex-shrink-0">
                            <XCircle className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-red-900 mb-2">
                              Câu {index + 1}
                            </div>
                            <div className="text-sm text-red-800 mb-3">
                              {item.question}
                            </div>
                            <div className="space-y-2">
                              <div className="bg-red-100 p-3 rounded-lg">
                                <div className="text-sm text-red-700 font-semibold">
                                  ❌ Đáp án của bạn: {JSON.stringify(item.userAnswer)}
                                </div>
                              </div>
                              <div className="bg-green-100 p-3 rounded-lg">
                                <div className="text-sm text-green-700 font-semibold">
                                  ✅ Đáp án đúng: {JSON.stringify(item.correctAnswer)}
                                </div>
                              </div>
                              {item.explanation && (
                                <div className="bg-blue-100 p-3 rounded-lg">
                                  <div className="text-sm text-blue-700">
                                    <div className="flex items-start gap-2">
                                      <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                      <div>
                                        <strong>Giải thích:</strong> {item.explanation}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="text-center">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={resetTest}
                  className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 text-white text-lg px-8 py-4 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <Rocket className="mr-3 h-6 w-6" />
                  🚀 Làm test mới
                  <Sparkles className="ml-3 h-5 w-5" />
                </Button>
                
                <Button 
                  onClick={() => navigate('/tests')}
                  variant="outline"
                  className="border-2 border-purple-300 text-purple-600 hover:bg-purple-50 text-lg px-8 py-4"
                >
                  <BookOpen className="mr-3 h-6 w-6" />
                  📚 Về trang test
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (testStarted && questions.length > 0) {
    const currentQuestion = questions[currentIndex]
    const progress = ((currentIndex + 1) / questions.length) * 100

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Enhanced Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl">
                    <Brain className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      🧪 Bài Test
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                      <Crown className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-gray-600">Cấp độ {userLevel}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-blue-100 to-cyan-100 px-4 py-2 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Coins className="h-5 w-5 text-blue-500" />
                      <span className="font-semibold text-blue-700">{user?.coins || 0} xu</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-green-100 to-emerald-100 px-4 py-2 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-green-500" />
                      <span className="font-semibold text-green-700">{user?.experience || 0} XP</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Progress */}
              <Card className="border-0 shadow-xl bg-gradient-to-r from-white to-blue-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full">
                        <Target className="h-5 w-5 text-white" />
                      </div>
                      <span className="font-semibold text-lg">Tiến độ</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-blue-700">
                        Câu {currentIndex + 1}/{questions.length}
                      </span>
                      <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                        {Math.round(progress)}%
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <Progress value={progress} className="h-4 bg-blue-100 rounded-full" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex items-center gap-1">
                        <Flame className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-bold text-blue-700">Đang làm bài</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Question Card */}
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-purple-50">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-2 bg-white/20 rounded-full">
                    <Brain className="h-6 w-6" />
                  </div>
                  <div>
                    <span>Câu hỏi {currentIndex + 1}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <BookOpen className="h-4 w-4 text-purple-200" />
                      <span className="text-sm text-purple-100">Kiểm tra kiến thức</span>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border-l-4 border-purple-400">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-6 w-6 text-yellow-500 mt-1 flex-shrink-0" />
                    <p className="text-lg font-medium text-gray-800 leading-relaxed">{currentQuestion.question}</p>
                  </div>
                </div>
              
                {/* Enhanced Multiple Choice */}
                {currentQuestion.questionType === 'multiple-choice' && currentQuestion.options && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="h-5 w-5 text-purple-500" />
                      <span className="font-semibold text-purple-700">
                        {Array.isArray(currentQuestion.correctAnswer) && currentQuestion.correctAnswer.length > 1 
                          ? 'Chọn tất cả đáp án đúng (có thể chọn nhiều):'
                          : 'Chọn đáp án đúng:'
                        }
                      </span>
                    </div>
                    {currentQuestion.options.map((option, index) => {
                      const currentAnswer = answers[currentIndex] || []
                      const isSelected = Array.isArray(currentAnswer) ? currentAnswer.includes(index) : currentAnswer === index
                      
                      return (
                        <Button
                          key={index}
                          variant={isSelected ? 'default' : 'outline'}
                          className={`w-full justify-start h-auto py-6 text-left transition-all duration-200 transform hover:scale-[1.02] ${
                            isSelected 
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                              : 'hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 border-2 hover:border-purple-300'
                          }`}
                          onClick={() => handleMultipleChoiceSelect(index)}
                        >
                          <div className="flex items-center w-full">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 font-bold ${
                              isSelected 
                                ? 'bg-white/20 text-white' 
                                : 'bg-purple-100 text-purple-600'
                            }`}>
                              {String.fromCharCode(65 + index)}
                            </div>
                            <span className="text-base">{option}</span>
                            {isSelected && (
                              <CheckCircle className="h-5 w-5 ml-auto text-white" />
                            )}
                          </div>
                        </Button>
                      )
                    })}
                  </div>
                )}

                {/* Fill Blank */}
                {currentQuestion.questionType === 'fill-blank' && (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={answers[currentIndex] || ''}
                      onChange={(e) => handleAnswerSelect(e.target.value)}
                      placeholder="Nhập đáp án của bạn..."
                      className="w-full p-4 border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg"
                    />
                  </div>
                )}

                {/* Reading Comprehension */}
                {currentQuestion.questionType === 'reading-comprehension' && currentQuestion.options && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="h-5 w-5 text-purple-500" />
                      <span className="font-semibold text-purple-700">
                        {Array.isArray(currentQuestion.correctAnswer) && currentQuestion.correctAnswer.length > 1 
                          ? 'Chọn tất cả đáp án đúng (có thể chọn nhiều):'
                          : 'Chọn đáp án đúng:'
                        }
                      </span>
                    </div>
                    {currentQuestion.options.map((option, index) => {
                      const currentAnswer = answers[currentIndex] || []
                      const isSelected = Array.isArray(currentAnswer) ? currentAnswer.includes(index) : currentAnswer === index
                      
                      return (
                        <Button
                          key={index}
                          variant={isSelected ? 'default' : 'outline'}
                          className={`w-full justify-start h-auto py-6 text-left transition-all duration-200 transform hover:scale-[1.02] ${
                            isSelected 
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                              : 'hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 border-2 hover:border-purple-300'
                          }`}
                          onClick={() => handleMultipleChoiceSelect(index)}
                        >
                          <div className="flex items-center w-full">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 font-bold ${
                              isSelected 
                                ? 'bg-white/20 text-white' 
                                : 'bg-purple-100 text-purple-600'
                            }`}>
                              {String.fromCharCode(65 + index)}
                            </div>
                            <span className="text-base">{option}</span>
                            {isSelected && (
                              <CheckCircle className="h-5 w-5 ml-auto text-white" />
                            )}
                          </div>
                        </Button>
                      )
                    })}
                  </div>
                )}

                {/* Sentence Order */}
                {currentQuestion.questionType === 'sentence-order' && currentQuestion.options && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="h-5 w-5 text-purple-500" />
                      <span className="font-semibold text-purple-700">Sắp xếp các câu theo thứ tự đúng:</span>
                    </div>
                    {currentQuestion.options.map((option, index) => (
                      <div
                        key={index}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 transform hover:scale-[1.02] ${
                          answers[currentIndex]?.includes(index)
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-500 shadow-lg'
                            : 'hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 border-purple-300'
                        }`}
                        onClick={() => {
                          const currentAnswer = answers[currentIndex] || []
                          const newAnswer = currentAnswer.includes(index)
                            ? currentAnswer.filter((i: number) => i !== index)
                            : [...currentAnswer, index]
                          handleAnswerSelect(newAnswer)
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            answers[currentIndex]?.includes(index)
                              ? 'bg-white/20 text-white'
                              : 'bg-purple-100 text-purple-600'
                          }`}>
                            {index + 1}
                          </div>
                          <span className="text-base">{option}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Enhanced Navigation */}
                <div className="flex justify-between gap-4 pt-6 border-t-2 border-purple-200">
                  <Button
                    variant="outline"
                    onClick={handlePrevQuestion}
                    disabled={currentIndex === 0}
                    className="flex-1 py-6 text-lg font-semibold border-2 border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400 transition-all duration-200"
                  >
                    <ArrowLeft className="mr-3 h-5 w-5" />
                    Câu trước
                  </Button>
                  
                  <div className="flex gap-4">
                    <Button
                      onClick={submitTest}
                      disabled={loading}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                          Đang nộp...
                        </>
                      ) : (
                        <>
                          <Rocket className="mr-3 h-5 w-5" />
                          🚀 Nộp bài
                          <Sparkles className="ml-3 h-4 w-4" />
                        </>
                      )}
                    </Button>
                    
                    {currentIndex < questions.length - 1 && (
                      <Button 
                        onClick={handleNextQuestion}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                      >
                        <Zap className="mr-3 h-5 w-5" />
                        Câu tiếp
                        <ChevronRight className="ml-3 h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Button 
              variant="outline" 
              onClick={() => navigate('/tests')}
              className="mb-6 bg-white/50 hover:bg-white/70 border-2 border-purple-200"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Quay lại
            </Button>
            
            <div className="text-center">
              <div className="relative inline-block mb-4">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                  🧪 Bài Test Mới
                </h1>
                <div className="absolute -top-2 -right-2">
                  <Sparkles className="h-8 w-8 text-yellow-400 animate-bounce" />
                </div>
                <div className="absolute -bottom-2 -left-2">
                  <Brain className="h-6 w-6 text-purple-400 animate-pulse" />
                </div>
              </div>
              <p className="text-xl text-gray-700 font-medium">Làm bài test ngẫu nhiên theo cấp độ của bạn</p>
            </div>
          </div>

          {/* Enhanced Test Info Card */}
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-blue-50 mb-8">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-white/20 rounded-full">
                  <TestTube className="h-8 w-8" />
                </div>
                <div>
                  <span>Thông tin bài test</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Crown className="h-4 w-4 text-yellow-300" />
                    <span className="text-sm text-blue-100">Cấp độ {userLevel}</span>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-100 p-6 rounded-xl border-l-4 border-blue-400">
                <h3 className="font-bold text-blue-900 mb-4 text-lg">📋 Quy tắc mới:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 rounded-full">
                      <Coins className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-blue-800 font-semibold">Chi phí: 10,000 xu</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500 rounded-full">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-green-800 font-semibold">Tất cả câu hỏi cấp {userLevel}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500 rounded-full">
                      <Award className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-purple-800 font-semibold">100 xu + 100 XP/câu đúng</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500 rounded-full">
                      <Trophy className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-orange-800 font-semibold">Báo cáo chi tiết</span>
                  </div>
                </div>
              </div>
              
              {user && (
                <div className="flex flex-wrap justify-center gap-6">
                  <div className="bg-gradient-to-r from-blue-100 to-cyan-100 px-6 py-4 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Coins className="h-6 w-6 text-blue-500" />
                      <div>
                        <span className="font-bold text-blue-800 text-lg">Xu: {user.coins.toLocaleString()}</span>
                        <div className="flex items-center gap-1 mt-1">
                          <Diamond className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-blue-600">Tiền tệ</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-100 to-emerald-100 px-6 py-4 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Star className="h-6 w-6 text-green-500" />
                      <div>
                        <span className="font-bold text-green-800 text-lg">Cấp: {userLevel}</span>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            {user && user.coins < 10000 && (
              <div className="bg-gradient-to-r from-red-50 to-pink-100 p-6 rounded-xl border-l-4 border-red-400">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-6 w-6 text-red-500 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-red-800 text-lg mb-2">⚠️ Không đủ xu!</div>
                    <p className="text-red-700">
                      Bạn cần 10,000 xu nhưng chỉ có {user.coins.toLocaleString()} xu. 
                      Hãy học thêm từ vựng để nhận xu miễn phí!
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <BookOpen className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-600 font-semibold">Gợi ý: Học từ vựng để kiếm xu</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center">
              <Button
                onClick={startTest}
                disabled={!user || user.coins < 10000 || loading}
                className={`text-2xl px-12 py-6 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 ${
                  !user || user.coins < 10000
                    ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 text-white'
                }`}
              >
                <div className="flex items-center gap-4">
                  {loading ? (
                    <>
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <span>Đang tải...</span>
                    </>
                  ) : !user ? (
                    <>
                      <Shield className="h-8 w-8" />
                      <span>Đăng nhập để làm test</span>
                    </>
                  ) : user.coins < 10000 ? (
                    <>
                      <Target className="h-8 w-8" />
                      <span>Không đủ xu (cần 10,000)</span>
                    </>
                  ) : (
                    <>
                      <Rocket className="h-8 w-8 mr-2" />
                      <span>🚀 Bắt đầu test</span>
                      <Sparkles className="h-6 w-6" />
                    </>
                  )}
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  )
}