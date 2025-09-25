import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { 
  Brain, 
  Clock, 
  Star, 
  Target, 
  CheckCircle, 
  XCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Gem,
  Sparkles,
  Loader2,
  AlertCircle,
  Flag
} from 'lucide-react'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { ReportErrorDialog } from '../components/ReportErrorDialog'
import toast from 'react-hot-toast'

interface Question {
  id: string
  level: 'A' | 'B' | 'C'
  question: string
  options: string[]
  correctAnswer: number
}

interface ProficiencyResult {
  score: number
  proficiencyLevel: string
  rewards?: {
    experience: number
    coins: number
  }
}

export const ProficiencyTest = () => {
  const { user } = useAuth()
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [isTestActive, setIsTestActive] = useState(false)
  const [testResult, setTestResult] = useState<ProficiencyResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [testPhase, setTestPhase] = useState<'initial' | 'additional' | 'completed'>('initial')
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)

  const currentQuestion = questions[currentQuestionIndex]

  const startProficiencyTest = async () => {
    try {
      setLoading(true)
      const response = await api.get('/proficiency/initial')
      setQuestions(response.data.questions)
      setTotalQuestions(response.data.questions.length)
      setTimeLeft(response.data.timeLimit * 60) // Convert minutes to seconds
      setIsTestActive(true)
      setTestPhase('initial')
      setCurrentQuestionIndex(0)
      setAnswers({})
      setCorrectAnswers(0)
    } catch (error) {
      console.error('Failed to start proficiency test:', error)
      toast.error('Không thể bắt đầu test năng lực')
    } finally {
      setLoading(false)
    }
  }

  const submitTest = async () => {
    try {
      setLoading(true)
      
      // Calculate correct answers
      const correct = questions.reduce((count, question, index) => {
        return count + (answers[index] === question.correctAnswer ? 1 : 0)
      }, 0)
      
      setCorrectAnswers(correct)
      
      // Determine next phase based on initial results
      if (testPhase === 'initial') {
        const initialCorrect = correct
        
        if (initialCorrect >= 1 && initialCorrect <= 4) {
          // Show 8 more Level A questions
          await loadAdditionalQuestions('A', 8)
        } else if (initialCorrect >= 5 && initialCorrect <= 6) {
          // Show 8 more Level B questions
          await loadAdditionalQuestions('B', 8)
        } else if (initialCorrect >= 7 && initialCorrect <= 8) {
          // Show 14 more Level C questions
          await loadAdditionalQuestions('C', 14)
        } else {
          // Complete test
          await completeTest(correct)
        }
      } else if (testPhase === 'additional') {
        await completeTest(correct)
      }
    } catch (error) {
      console.error('Failed to submit test:', error)
      toast.error('Không thể gửi kết quả test')
    } finally {
      setLoading(false)
    }
  }

  const loadAdditionalQuestions = async (level: 'A' | 'B' | 'C', count: number) => {
    try {
      const response = await api.get(`/proficiency/additional?level=${level}&count=${count}`)
      setQuestions(response.data.questions)
      setTotalQuestions(response.data.questions.length)
      setTimeLeft(response.data.timeLimit * 60)
      setTestPhase('additional')
      setCurrentQuestionIndex(0)
      setAnswers({})
    } catch (error) {
      console.error('Failed to load additional questions:', error)
      toast.error('Không thể tải câu hỏi bổ sung')
    }
  }

  const completeTest = async (totalCorrect: number) => {
    try {
      const response = await api.post('/proficiency/submit', {
        answers: Object.values(answers),
        timeSpent: (totalQuestions * 60) - timeLeft // Approximate time spent
      })
      
      setTestResult(response.data)
      setIsTestActive(false)
      setTestPhase('completed')
    } catch (error) {
      console.error('Failed to complete test:', error)
      toast.error('Không thể hoàn thành test')
    }
  }

  const handleAnswerSelect = (answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answerIndex
    }))
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      submitTest()
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getProficiencyColor = (level: string) => {
    switch (level) {
      case 'A1': return 'text-green-600'
      case 'A2': return 'text-blue-600'
      case 'B1': return 'text-purple-600'
      case 'B2': return 'text-orange-600'
      case 'C1': return 'text-red-600'
      case 'C2': return 'text-pink-600'
      default: return 'text-gray-600'
    }
  }

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTestActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && isTestActive) {
      submitTest()
    }
    return () => clearInterval(interval)
  }, [isTestActive, timeLeft])

  if (testResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <Card className="text-center">
            <CardHeader>
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                testResult.score >= 70 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                  : 'bg-gradient-to-r from-red-500 to-pink-500'
              }`}>
                {testResult.score >= 70 ? (
                  <Trophy className="h-8 w-8 text-white" />
                ) : (
                  <XCircle className="h-8 w-8 text-white" />
                )}
              </div>
              <CardTitle className="text-3xl">
                {testResult.score >= 70 ? 'Chúc mừng!' : 'Cần cải thiện!'}
              </CardTitle>
              <CardDescription>
                Kết quả test năng lực ngôn ngữ của bạn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className={`text-6xl font-bold ${getProficiencyColor(testResult.proficiencyLevel)}`}>
                {testResult.proficiencyLevel}
              </div>
              <p className="text-xl text-gray-600">
                Trình độ: {testResult.proficiencyLevel}
              </p>
              
              {testResult.rewards && (
                <div className="flex justify-center gap-8">
                  <div className="text-center">
                    <div className="flex items-center gap-2 text-green-600">
                      <Star className="h-5 w-5" />
                      <span className="text-2xl font-bold">+{testResult.rewards.experience}</span>
                    </div>
                    <p className="text-sm text-gray-600">Điểm kinh nghiệm</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-2 text-blue-600">
                      <Gem className="h-5 w-5" />
                      <span className="text-2xl font-bold">+{testResult.rewards.coins}</span>
                    </div>
                    <p className="text-sm text-gray-600">Xu</p>
                  </div>
                </div>
              )}

              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => {
                    setTestResult(null)
                    setTestPhase('initial')
                    setCorrectAnswers(0)
                    setTotalQuestions(0)
                  }}
                  variant="outline"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Làm lại
                </Button>
                <Button
                  onClick={() => {
                    setTestResult(null)
                    setTestPhase('initial')
                    setCorrectAnswers(0)
                    setTotalQuestions(0)
                  }}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                >
                  Về trang chủ
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (isTestActive && currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Timer */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-red-500" />
                  <span className="font-semibold">Thời gian còn lại: {formatTime(timeLeft)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  <span className="font-semibold">
                    Câu {currentQuestionIndex + 1} / {questions.length}
                  </span>
                </div>
              </div>
              <Progress 
                value={((currentQuestionIndex + 1) / questions.length) * 100} 
                className="mt-2 h-2"
              />
            </CardContent>
          </Card>

          {/* Question */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Câu hỏi {currentQuestionIndex + 1}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Level {currentQuestion.level}</Badge>
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
            <CardContent className="space-y-6">
              <p className="text-lg font-medium">{currentQuestion.question}</p>
              
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <Button
                    key={index}
                    variant={answers[currentQuestionIndex] === index ? 'default' : 'outline'}
                    className={`w-full justify-start h-auto py-4 text-left ${
                      answers[currentQuestionIndex] === index 
                        ? 'bg-blue-500 text-white' 
                        : 'hover:bg-blue-50'
                    }`}
                    onClick={() => handleAnswerSelect(index)}
                  >
                    <span className="font-semibold mr-3">{String.fromCharCode(65 + index)}.</span>
                    {option}
                  </Button>
                ))}
              </div>

              <div className="flex justify-between">
                <Button
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  variant="outline"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Trước
                </Button>
                
                <Button
                  onClick={handleNext}
                  disabled={answers[currentQuestionIndex] === undefined}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                >
                  {currentQuestionIndex === questions.length - 1 ? 'Kết thúc' : 'Tiếp theo'}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Error Dialog */}
        <ReportErrorDialog
          isOpen={showReportDialog}
          onClose={() => setShowReportDialog(false)}
          itemType="test"
          itemId={currentQuestion?.id || ''}
          itemContent={currentQuestion?.question || ''}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Test năng lực ngôn ngữ</h1>
          <p className="text-gray-600">Đánh giá trình độ tiếng Trung của bạn từ A1 đến C2</p>
        </div>

        {/* Test Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Thông tin test
            </CardTitle>
            <CardDescription>
              Test năng lực ngôn ngữ sẽ đánh giá trình độ tiếng Trung của bạn
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold">Thời gian</h3>
                <p className="text-sm text-gray-600">30-45 phút</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold">Câu hỏi</h3>
                <p className="text-sm text-gray-600">8-22 câu hỏi</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Trophy className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold">Kết quả</h3>
                <p className="text-sm text-gray-600">A1-C2</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-800 mb-1">Lưu ý quan trọng</h4>
                  <p className="text-sm text-yellow-700">
                    Test này sẽ điều chỉnh độ khó dựa trên câu trả lời của bạn. 
                    Hãy trả lời chính xác để có kết quả đánh giá tốt nhất.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={startProficiencyTest}
                disabled={loading}
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Đang tải...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-5 w-5" />
                    Bắt đầu test
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}