import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { ReportErrorDialog } from '../components/ReportErrorDialog'
import { 
  Brain,
  Target,
  Trophy,
  Clock,
  CheckCircle,
  ArrowLeft,
  Loader2,
  Star,
  Award,
  Crown,
  Sparkles,
  Rocket,
  Zap,
  Shield,
  BookOpen,
  Lightbulb,
  Diamond,
  Flame,
  Flag
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
  proficiencyLevel?: number
}

interface ProficiencyResult {
  level: number
  correctCount: number
  totalQuestions: number
  score: number
  rewards?: {
    experience: number
    coins: number
  }
}

interface ProficiencyConfig {
  id: string
  name: string
  description: string
  cost: number
  initialQuestions: {
    level: number
    count: number
  }[]
  branches: {
    name: string
    condition: {
      correctRange: [number, number]
      fromPhase: 'initial' | 'followup'
    }
    nextQuestions: {
      level: number
      count: number
    }[]
    resultLevel?: number
    nextPhase?: 'followup' | 'final'
  }[]
}

export const ProficiencyTest = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, any>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [isTestActive, setIsTestActive] = useState(false)
  const [testResult, setTestResult] = useState<ProficiencyResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [testPhase, setTestPhase] = useState<'initial' | 'followup' | 'final' | 'completed'>('initial')
  const [config, setConfig] = useState<ProficiencyConfig | null>(null)
  const [configId, setConfigId] = useState<string | null>(null)
  const [branchName, setBranchName] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'test' | 'reports'>('test')
  
  // Report error states
  const [showReportDialog, setShowReportDialog] = useState(false)

  const currentQuestion = questions[currentQuestionIndex]

  useEffect(() => {
    fetchConfig()
  }, [])

  useEffect(() => {
    let interval: any
    if (isTestActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitTest()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTestActive, timeLeft])

  const fetchConfig = async () => {
    try {
      const response = await api.get('/proficiency/config')
      setConfig(response.data.config)
    } catch (error) {
      console.error('Error fetching proficiency config:', error)
      toast.error('Không thể tải cấu hình test năng lực')
    }
  }

  const startProficiencyTest = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để làm test năng lực')
      return
    }

    if (!config) {
      toast.error('Không có cấu hình test năng lực')
      return
    }

    if (user.coins < config.cost) {
      toast.error(`Không đủ xu! Cần ${config.cost.toLocaleString()} xu nhưng chỉ có ${user.coins.toLocaleString()} xu`)
      return
    }

    try {
      setLoading(true)
      const response = await api.post('/proficiency/start')
      setQuestions(response.data.questions)
      setTimeLeft((response.data.timeLimit || 30) * 60)
      setIsTestActive(true)
      setTestPhase('initial')
      setCurrentQuestionIndex(0)
      setAnswers({})
      setConfigId(response.data.configId)
      
      toast.success('Bắt đầu test năng lực!')
    } catch (error: any) {
      console.error('Failed to start proficiency test:', error)
      if (error.response?.data?.insufficientCoins) {
        toast.error('Không đủ xu để làm test năng lực!')
      } else {
        toast.error(error.response?.data?.message || 'Không thể bắt đầu test năng lực')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSelect = (answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answer
    }))
  }

  const handleMultipleChoiceSelect = (optionIndex: number) => {
    const currentAnswer = answers[currentQuestionIndex] || []
    const isSelected = Array.isArray(currentAnswer) ? currentAnswer.includes(optionIndex) : currentAnswer === optionIndex
    
    let newAnswer
    if (Array.isArray(currentAnswer)) {
      newAnswer = isSelected 
        ? currentAnswer.filter((i: number) => i !== optionIndex)
        : [...currentAnswer, optionIndex]
    } else {
      newAnswer = isSelected 
        ? currentAnswer.filter((i: number) => i !== optionIndex)
        : [optionIndex]
    }
    
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: newAnswer
    }))
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      handleSubmitTest()
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleSubmitTest = async () => {
    try {
      setLoading(true)
      
      const questionIds = questions.map(q => q._id)
      const answerArray = questions.map((_, index) => answers[index] || null)
      
      const payload = {
        answers: answerArray,
        questionIds,
        phase: testPhase,
        configId
      }
      
      const response = await api.post('/proficiency/submit', payload)

      // If server tells us to proceed to next phase with questions
      if (response.data?.nextPhase) {
        const qp = response.data
        setQuestions(qp.questions || [])
        setTimeLeft((qp.timeLimit || 20) * 60)
        setTestPhase(qp.phase)
        setCurrentQuestionIndex(0)
        setAnswers({})
        setBranchName(qp.branchName || '')
        return
      }

      // Otherwise it's final result
      setTestResult(response.data.result)
      setIsTestActive(false)
      setTestPhase('completed')
      
      toast.success(`Hoàn thành test năng lực! Cấp độ: ${response.data.result.level}`)
    } catch (error) {
      console.error('Failed to submit test:', error)
      toast.error('Không thể gửi kết quả test')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }


  const getProficiencyBadgeColor = (level: number) => {
    if (level <= 2) return 'bg-green-100 text-green-800'
    if (level <= 4) return 'bg-blue-100 text-blue-800'
    if (level <= 6) return 'bg-purple-100 text-purple-800'
    return 'bg-red-100 text-red-800'
  }


  if (testResult) {
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
                    🎉 Kết quả Test Năng lực
                  </h1>
                  <div className="absolute -top-2 -right-2">
                    <Sparkles className="h-8 w-8 text-yellow-400 animate-bounce" />
                  </div>
                  <div className="absolute -bottom-2 -left-2">
                    <Trophy className="h-6 w-6 text-orange-400 animate-pulse" />
                  </div>
                </div>
                <p className="text-xl text-gray-700 font-medium">Kết quả đánh giá năng lực của bạn</p>
              </div>
            </div>

            {/* Enhanced Result Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <Card className="border-0 shadow-2xl bg-gradient-to-br from-yellow-50 to-orange-100">
                <CardContent className="p-8 text-center">
                  <div className="relative inline-block mb-4">
                    <div className="p-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl">
                      <Crown className="h-12 w-12 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2">
                      <Star className="h-6 w-6 text-yellow-400 animate-bounce" />
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-gray-900 mb-2">Cấp {testResult.level}</div>
                  <div className="text-lg font-semibold text-gray-600">Năng lực</div>
                  <div className="flex justify-center mt-3">
                    <Badge className={`text-lg px-4 py-2 ${getProficiencyBadgeColor(testResult.level)}`}>
                      Cấp độ {testResult.level}
                    </Badge>
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
                  <div className="text-4xl font-bold text-green-600 mb-2">{testResult.correctCount}</div>
                  <div className="text-lg font-semibold text-gray-600">Câu đúng</div>
                  <div className="flex justify-center mt-3">
                    <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
                      {testResult.totalQuestions} câu tổng
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-50 to-cyan-100">
                <CardContent className="p-8 text-center">
                  <div className="relative inline-block mb-4">
                    <div className="p-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl">
                      <Target className="h-12 w-12 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2">
                      <Trophy className="h-6 w-6 text-blue-400 animate-ping" />
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-blue-600 mb-2">{testResult.score}%</div>
                  <div className="text-lg font-semibold text-gray-600">Điểm số</div>
                  <div className="flex justify-center mt-3">
                    <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold">
                      Xuất sắc!
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Rewards */}
            {testResult.rewards && (
              <Card className="border-0 shadow-xl bg-gradient-to-r from-green-50 to-emerald-100 mb-8">
                <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-white/20 rounded-full">
                      <Award className="h-6 w-6" />
                    </div>
                    <div>
                      <span>Phần thưởng</span>
                      <div className="flex items-center gap-1 mt-1">
                        <Sparkles className="h-4 w-4 text-yellow-300" />
                        <span className="text-sm text-green-100">Chúc mừng!</span>
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl">
                        <Star className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-700">+{testResult.rewards.experience} XP</div>
                        <div className="text-sm text-green-600">Kinh nghiệm</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl">
                        <Diamond className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-700">+{testResult.rewards.coins} xu</div>
                        <div className="text-sm text-yellow-600">Tiền tệ</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="text-center">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => {
                    setTestResult(null)
                    setTestPhase('initial')
                    setQuestions([])
                    setAnswers({})
                    setCurrentQuestionIndex(0)
                    setIsTestActive(false)
                  }}
                  className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 text-white text-lg px-8 py-4 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <Rocket className="mr-3 h-6 w-6" />
                  🚀 Làm lại test
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

  if (isTestActive && questions.length > 0) {
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100

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
                      🧠 Test Năng lực
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                      <Crown className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-gray-600">Đánh giá năng lực</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-blue-100 to-cyan-100 px-4 py-2 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-500" />
                      <span className="font-semibold text-blue-700">{formatTime(timeLeft)}</span>
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
                        Câu {currentQuestionIndex + 1}/{questions.length}
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

              {/* Phase Info */}
              {branchName && (
                <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-pink-50 mt-4">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
                        <Zap className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-purple-800">{branchName}</div>
                        <div className="text-sm text-purple-600">Giai đoạn: {testPhase}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Enhanced Question Card */}
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-purple-50">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="p-2 bg-white/20 rounded-full">
                      <Brain className="h-6 w-6" />
                    </div>
                    <div>
                      <span>Câu hỏi {currentQuestionIndex + 1}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <BookOpen className="h-4 w-4 text-purple-200" />
                        <span className="text-sm text-purple-100">Cấp {currentQuestion.proficiencyLevel || currentQuestion.level}</span>
                      </div>
                    </div>
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-white border-white/30 hover:bg-white/20 hover:border-white/50"
                    onClick={() => setShowReportDialog(true)}
                  >
                    <Flag className="h-4 w-4 mr-1" />
                    Báo lỗi
                  </Button>
                </div>
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
                      const currentAnswer = answers[currentQuestionIndex] || []
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
                      value={answers[currentQuestionIndex] || ''}
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
                      const currentAnswer = answers[currentQuestionIndex] || []
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
                          answers[currentQuestionIndex]?.includes(index)
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-500 shadow-lg'
                            : 'hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 border-purple-300'
                        }`}
                        onClick={() => {
                          const currentAnswer = answers[currentQuestionIndex] || []
                          const newAnswer = currentAnswer.includes(index)
                            ? currentAnswer.filter((i: number) => i !== index)
                            : [...currentAnswer, index]
                          handleAnswerSelect(newAnswer)
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            answers[currentQuestionIndex]?.includes(index)
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
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                    className="flex-1 py-6 text-lg font-semibold border-2 border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400 transition-all duration-200"
                  >
                    <ArrowLeft className="mr-3 h-5 w-5" />
                    Câu trước
                  </Button>
                  
                  <div className="flex gap-4">
                    <Button
                      onClick={handleSubmitTest}
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
                    
                    {currentQuestionIndex < questions.length - 1 && (
                      <Button 
                        onClick={handleNext}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                      >
                        <Zap className="mr-3 h-5 w-5" />
                        Câu tiếp
                        <Target className="ml-3 h-5 w-5" />
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
                  🧠 Test Năng lực
                </h1>
                <div className="absolute -top-2 -right-2">
                  <Sparkles className="h-8 w-8 text-yellow-400 animate-bounce" />
                </div>
                <div className="absolute -bottom-2 -left-2">
                  <Brain className="h-6 w-6 text-purple-400 animate-pulse" />
                </div>
              </div>
              <p className="text-xl text-gray-700 font-medium">Đánh giá năng lực tiếng Trung của bạn</p>
            </div>
            
            {/* Tabs */}
            <div className="flex space-x-1 mt-6 bg-gray-100 p-1 rounded-lg w-fit mx-auto">
              <button
                onClick={() => setActiveTab('test')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'test'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Làm test
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'reports'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Báo cáo
              </button>
            </div>
          </div>

          {/* Test Tab Content */}
          {activeTab === 'test' && (
            <>
              {/* Enhanced Test Info Card */}
              <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-blue-50 mb-8">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-white/20 rounded-full">
                  <Brain className="h-8 w-8" />
                </div>
                <div>
                  <span>Thông tin Test Năng lực</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Crown className="h-4 w-4 text-yellow-300" />
                    <span className="text-sm text-blue-100">Đánh giá toàn diện</span>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {config && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-100 p-6 rounded-xl border-l-4 border-blue-400">
                  <h3 className="font-bold text-blue-900 mb-4 text-lg">📋 Thông tin cấu hình:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500 rounded-full">
                        <Diamond className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-blue-800 font-semibold">Chi phí: {config.cost.toLocaleString()} xu</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500 rounded-full">
                        <Target className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-green-800 font-semibold">{config.initialQuestions.reduce((sum, q) => sum + q.count, 0)} câu ban đầu</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500 rounded-full">
                        <Award className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-purple-800 font-semibold">{config.branches.length} nhánh logic</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-500 rounded-full">
                        <Trophy className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-orange-800 font-semibold">Đánh giá năng lực</span>
                    </div>
                  </div>
                  {config.description && (
                    <p className="text-blue-700 mt-4 text-sm">{config.description}</p>
                  )}
                </div>
              )}
              
              {user && (
                <div className="flex flex-wrap justify-center gap-6">
                  <div className="bg-gradient-to-r from-blue-100 to-cyan-100 px-6 py-4 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Diamond className="h-6 w-6 text-blue-500" />
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
                        <span className="font-bold text-green-800 text-lg">Cấp: {user.level}</span>
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

            {user && config && user.coins < config.cost && (
              <div className="bg-gradient-to-r from-red-50 to-pink-100 p-6 rounded-xl border-l-4 border-red-400">
                <div className="flex items-start gap-3">
                  <Shield className="h-6 w-6 text-red-500 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-red-800 text-lg mb-2">⚠️ Không đủ xu!</div>
                    <p className="text-red-700">
                      Bạn cần {config.cost.toLocaleString()} xu nhưng chỉ có {user.coins.toLocaleString()} xu. 
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
                onClick={startProficiencyTest}
                disabled={!user || !config || (config && user.coins < config.cost) || loading}
                className={`text-2xl px-12 py-6 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 ${
                  !user || !config || (config && user.coins < config.cost)
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
                  ) : !config ? (
                    <>
                      <Target className="h-8 w-8" />
                      <span>Không có cấu hình</span>
                    </>
                  ) : user.coins < config.cost ? (
                    <>
                      <Target className="h-8 w-8" />
                      <span>Không đủ xu (cần {config.cost.toLocaleString()})</span>
                    </>
                  ) : (
                    <>
                      <Rocket className="h-8 w-8 mr-2" />
                      <span>🚀 Bắt đầu test năng lực</span>
                      <Sparkles className="h-6 w-6" />
                    </>
                  )}
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
            </>
          )}

          {/* Reports Tab Content */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-purple-600" />
                        Báo cáo test năng lực
                      </CardTitle>
                      <p className="text-gray-600">Theo dõi tiến độ và kết quả test năng lực</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      onClick={() => setShowReportDialog(true)}
                    >
                      <Flag className="h-4 w-4 mr-1" />
                      Báo lỗi
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Tests Taken */}
                    <div className="bg-purple-50 p-6 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-600">Tổng số test</p>
                          <p className="text-2xl font-bold text-purple-900">0</p>
                        </div>
                        <Brain className="h-8 w-8 text-purple-600" />
                      </div>
                    </div>

                    {/* Current Level */}
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-600">Cấp độ hiện tại</p>
                          <p className="text-2xl font-bold text-blue-900">Chưa có</p>
                        </div>
                        <Trophy className="h-8 w-8 text-blue-600" />
                      </div>
                    </div>

                    {/* Best Score */}
                    <div className="bg-green-50 p-6 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-600">Điểm cao nhất</p>
                          <p className="text-2xl font-bold text-green-900">0%</p>
                        </div>
                        <Award className="h-8 w-8 text-green-600" />
                      </div>
                    </div>

                    {/* Average Score */}
                    <div className="bg-orange-50 p-6 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-orange-600">Điểm trung bình</p>
                          <p className="text-2xl font-bold text-orange-900">0%</p>
                        </div>
                        <Target className="h-8 w-8 text-orange-600" />
                      </div>
                    </div>
                  </div>

                  {/* Test History */}
                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-4">Lịch sử test</h3>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <Brain className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                        <p>Chưa có lịch sử test</p>
                        <p className="text-sm">Làm test năng lực để xem báo cáo</p>
                      </div>
                    </div>
                  </div>

                  {/* Level Progress */}
                  <div className="bg-white p-6 rounded-lg border mt-6">
                    <h3 className="text-lg font-semibold mb-4">Tiến độ cấp độ</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">1</span>
                          </div>
                          <div>
                            <h4 className="font-medium">Cấp độ 1 - Cơ bản</h4>
                            <p className="text-sm text-gray-600">Chưa đạt</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">0%</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">2</span>
                          </div>
                          <div>
                            <h4 className="font-medium">Cấp độ 2 - Trung cấp</h4>
                            <p className="text-sm text-gray-600">Chưa đạt</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">0%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Report Error Dialog */}
          <ReportErrorDialog
            isOpen={showReportDialog}
            onClose={() => setShowReportDialog(false)}
            itemType="question"
            itemId={currentQuestion?._id || ''}
            itemContent={currentQuestion?.question || ''}
          />
        </div>
      </div>
    </div>
  )
}