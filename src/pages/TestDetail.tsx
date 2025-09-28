import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { 
  TestTube, 
  Clock, 
  Coins, 
  Star, 
  // Zap, 
  Loader2,
  AlertCircle,
  CheckCircle,
  Flag,
  ArrowLeft
} from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import { ReportErrorDialog } from '../components/ReportErrorDialog'

interface Question {
  _id: string
  question: string
  questionType: string
  options?: string[]
  correctAnswer?: any
  explanation?: string
  passage?: string
  sentences?: string[]
  blanks?: Array<{position: number, correctAnswer: string}>
  leftItems?: string[]
  rightItems?: string[]
  correctMatches?: Array<{left: number, right: number}>
  isTrue?: boolean
}

interface Test {
  _id: string
  title: string
  description: string
  level: number
  timeLimit: number
  requiredCoins: number
  rewardExperience: number
  rewardCoins: number
  questions: Question[]
}

export const TestDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [test, setTest] = useState<Test | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<{[key: number]: any}>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [testStarted, setTestStarted] = useState(false)
  const [skippedQuestions, setSkippedQuestions] = useState<number[]>([])
  const [wrongQuestions, setWrongQuestions] = useState<number[]>([])
  // const [testCompleted, setTestCompleted] = useState(false)
  const [reviewMode, setReviewMode] = useState(false)

  useEffect(() => {
    if (id) {
      fetchTest()
    }
  }, [id])

  useEffect(() => {
    if (testStarted && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (testStarted && timeLeft === 0) {
      handleSubmitTest()
    }
  }, [timeLeft, testStarted])

  const fetchTest = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/tests/${id}`)
      setTest(response.data.test)
      setTimeLeft(response.data.test.timeLimit * 60) // Convert minutes to seconds
    } catch (error: any) {
      console.error('Error fetching test:', error)
      toast.error(error.response?.data?.message || 'Không thể tải test')
      navigate('/tests')
    } finally {
      setLoading(false)
    }
  }

  const handleStartTest = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để làm test')
      return
    }

    if (user.coins < test!.requiredCoins) {
      toast.error(`Bạn cần ${test!.requiredCoins} xu để làm test này. Hiện tại bạn có ${user.coins} xu.`)
      return
    }

    try {
      await api.post('/tests/start', { testId: id })
      setTestStarted(true)
      toast.success('Bắt đầu test!')
    } catch (error: any) {
      console.error('Error starting test:', error)
      toast.error(error.response?.data?.message || 'Không thể bắt đầu test')
    }
  }

  const handleAnswerSelect = (answer: any) => {
    setAnswers({
      ...answers,
      [currentQuestion]: answer
    })
  }

  const handleNextQuestion = () => {
    if (currentQuestion < test!.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handleSkipQuestion = () => {
    // Đánh dấu câu hỏi hiện tại là bỏ qua
    setSkippedQuestions([...skippedQuestions, currentQuestion])
    handleNextQuestion()
  }

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleSubmitTest = async () => {
    try {
      setSubmitting(true)
      const response = await api.post('/tests/submit', {
        testId: id,
        answers: Object.values(answers),
        timeSpent: test!.timeLimit * 60 - timeLeft
      })

      // Kiểm tra kết quả
      const { passed, skippedQuestions: skipped, wrongQuestions: wrong } = response.data
      
      if (passed) {
        toast.success('Chúc mừng! Bạn đã hoàn thành test và lên cấp!')
        navigate('/tests', { 
          state: { 
            result: response.data,
            testTitle: test!.title 
          }
        })
      } else {
        // Có câu hỏi bỏ qua hoặc sai, chuyển sang chế độ review
        setSkippedQuestions(skipped || [])
        setWrongQuestions(wrong || [])
        // setTestCompleted(true)
        setReviewMode(true)
        setCurrentQuestion(0)
        toast('Có câu hỏi cần làm lại. Hãy xem lại những câu bỏ qua và làm sai!', {
          icon: 'ℹ️',
          duration: 4000,
        })
      }
    } catch (error: any) {
      console.error('Error submitting test:', error)
      toast.error(error.response?.data?.message || 'Không thể nộp test')
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!test) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Test không tồn tại</h1>
          <Button onClick={() => navigate('/tests')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại danh sách test
          </Button>
        </div>
      </div>
    )
  }

  const currentQ = test.questions[currentQuestion]
  const progress = ((currentQuestion + 1) / test.questions.length) * 100

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/tests')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{test.title}</h1>
              <p className="text-gray-600">{test.description}</p>
            </div>
            <Badge className="bg-blue-100 text-blue-800">
              Cấp {test.level}
            </Badge>
          </div>

          {/* Test Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>{test.timeLimit} phút</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TestTube className="h-4 w-4 text-gray-500" />
              <span>{test.questions.length} câu hỏi</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Coins className="h-4 w-4 text-yellow-500" />
              <span>Cần {test.requiredCoins} xu</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 text-blue-500" />
              <span>Thưởng {test.rewardExperience} XP</span>
            </div>
          </div>

          {/* Time and Progress */}
          {testStarted && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Tiến độ</span>
                <span className="text-sm font-medium">
                  Câu {currentQuestion + 1}/{test.questions.length}
                </span>
              </div>
              <Progress value={progress} className="mb-2" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {reviewMode ? 'Chế độ xem lại' : `Thời gian còn lại: ${formatTime(timeLeft)}`}
                </span>
                <div className="flex items-center gap-2">
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
              
              {/* Review Mode Info */}
              {reviewMode && (
                <div className="mt-4 bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-900 mb-2">Chế độ xem lại</h3>
                  <p className="text-sm text-yellow-800">
                    Bạn cần làm lại những câu hỏi bỏ qua và làm sai để hoàn thành test.
                  </p>
                  <div className="mt-2 flex gap-4 text-sm">
                    <span className="text-orange-600">
                      Bỏ qua: {skippedQuestions.length} câu
                    </span>
                    <span className="text-red-600">
                      Làm sai: {wrongQuestions.length} câu
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Test Content */}
        {!testStarted ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-6 w-6 text-blue-600" />
                Sẵn sàng bắt đầu?
              </CardTitle>
              <CardDescription>
                Test này sẽ kiểm tra kiến thức của bạn ở cấp độ {test.level}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Thông tin test:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Thời gian: {test.timeLimit} phút</li>
                  <li>• Số câu hỏi: {test.questions.length}</li>
                  <li>• Cần xu: {test.requiredCoins}</li>
                  <li>• Thưởng: {test.rewardExperience} XP + {test.rewardCoins} xu</li>
                </ul>
              </div>
              
              {user && user.coins < test.requiredCoins && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-semibold">Không đủ xu!</span>
                  </div>
                  <p className="text-sm text-red-700 mt-1">
                    Bạn cần {test.requiredCoins} xu nhưng chỉ có {user.coins} xu
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleStartTest}
                  disabled={!user || user.coins < test.requiredCoins}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  {!user ? 'Đăng nhập để làm test' : 
                   user.coins < test.requiredCoins ? 'Không đủ xu' : 
                   'Bắt đầu test'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                Câu hỏi {currentQuestion + 1}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg font-medium">{currentQ.question}</p>
              
              {/* Multiple Choice */}
              {currentQ.questionType === 'multiple-choice' && currentQ.options && (
                <div className="space-y-3">
                  {currentQ.options.map((option, index) => (
                    <Button
                      key={index}
                      variant={answers[currentQuestion] === index ? 'default' : 'outline'}
                      className={`w-full justify-start h-auto py-4 text-left ${
                        answers[currentQuestion] === index 
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
              )}

              {/* True/False */}
              {currentQ.questionType === 'true-false' && (
                <div className="space-y-3">
                  <Button
                    variant={answers[currentQuestion] === true ? 'default' : 'outline'}
                    className={`w-full h-auto py-4 ${
                      answers[currentQuestion] === true 
                        ? 'bg-green-500 text-white' 
                        : 'hover:bg-green-50'
                    }`}
                    onClick={() => handleAnswerSelect(true)}
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Đúng
                  </Button>
                  <Button
                    variant={answers[currentQuestion] === false ? 'default' : 'outline'}
                    className={`w-full h-auto py-4 ${
                      answers[currentQuestion] === false 
                        ? 'bg-red-500 text-white' 
                        : 'hover:bg-red-50'
                    }`}
                    onClick={() => handleAnswerSelect(false)}
                  >
                    <AlertCircle className="h-5 w-5 mr-2" />
                    Sai
                  </Button>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handlePrevQuestion}
                  disabled={currentQuestion === 0}
                >
                  Câu trước
                </Button>
                
                <div className="flex gap-2">
                  {!reviewMode && (
                    <Button
                      variant="outline"
                      onClick={handleSkipQuestion}
                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    >
                      Bỏ qua
                    </Button>
                  )}
                  
                  {currentQuestion === test.questions.length - 1 ? (
                    <Button
                      onClick={handleSubmitTest}
                      disabled={submitting}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Đang nộp...
                        </>
                      ) : (
                        'Nộp bài'
                      )}
                    </Button>
                  ) : (
                    <Button onClick={handleNextQuestion}>
                      Câu tiếp
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Report Error Dialog */}
        <ReportErrorDialog
          isOpen={showReportDialog}
          onClose={() => setShowReportDialog(false)}
          itemType="question"
          itemId={currentQ?._id || ''}
          itemContent={currentQ?.question || ''}
        />
      </div>
    </div>
  )
}
