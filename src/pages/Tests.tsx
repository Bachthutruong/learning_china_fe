import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { 
  TestTube, 
  Clock, 
  Star, 
  Target, 
  XCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Gem,
  Loader2,
  AlertCircle,
  Flag
} from 'lucide-react'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { ReportErrorDialog } from '../components/ReportErrorDialog'
import toast from 'react-hot-toast'

interface Test {
  _id: string
  title: string
  description: string
  level: number
  questions: Question[]
  timeLimit: number
  requiredCoins: number
  rewardExperience: number
  rewardCoins: number
}

interface Question {
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

interface TestResult {
  score: number
  correctAnswers: number
  totalQuestions: number
  timeSpent: number
  passed: boolean
  detailedResults: any[]
  rewards?: {
    experience: number
    coins: number
  }
}

export const Tests = () => {
  const { user } = useAuth()
  const [tests, setTests] = useState<Test[]>([])
  const [selectedTest, setSelectedTest] = useState<Test | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(0)
  const [isTestActive, setIsTestActive] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [testStats, setTestStats] = useState<any>(null)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [accessibleLevel, setAccessibleLevel] = useState(1)
  const [userLevel, setUserLevel] = useState(1)

  const currentQuestion = selectedTest?.questions[currentQuestionIndex]

  useEffect(() => {
    fetchTests()
    fetchTestStats()
  }, [])

  const fetchTests = async () => {
    try {
      setLoading(true)
      const response = await api.get('/tests')
      setTests(response.data.tests || [])
      setAccessibleLevel(response.data.accessibleLevel || 1)
      setUserLevel(response.data.userLevel || 1)
    } catch (error) {
      console.error('Failed to fetch tests:', error)
      toast.error('Không thể tải danh sách bài test')
    } finally {
      setLoading(false)
    }
  }

  const fetchTestStats = async () => {
    try {
      const response = await api.get('/tests/stats')
      setTestStats(response.data)
    } catch (error) {
      console.error('Failed to fetch test stats:', error)
    }
  }

  const startTest = async (test: Test) => {
    // Check if user has enough coins
    if (user && user.coins < test.requiredCoins) {
      toast.error(`Bạn cần ít nhất ${test.requiredCoins} xu để làm bài test này`)
      return
    }

    setSelectedTest(test)
    setCurrentQuestionIndex(0)
    setAnswers({});
    setTimeLeft(test.timeLimit * 60) // Convert to seconds
    setIsTestActive(true)
    setTestResult(null)

    // Start timer
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          finishTest()
          return 0
        }
        return prev - 1
      });
    }, 1000)
  }

  const finishTest = async () => {
    if (!selectedTest) return

    try {
      const timeSpent = (selectedTest.timeLimit * 60) - timeLeft
      const answersArray = Object.values(answers)
      
      const response = await api.post('/tests/submit', {
        testId: selectedTest._id,
        answers: answersArray,
        timeSpent
      });

      setTestResult(response.data.result)
      setIsTestActive(false)
      
      if (response.data.result.passed) {
        toast.success('Chúc mừng! Bạn đã vượt qua bài test!')
      } else {
        toast.error('Bạn cần cải thiện thêm. Hãy thử lại!')
      }
    } catch (error: any) {
      console.error('Failed to submit test:', error)
      toast.error(error.response?.data?.message || 'Không thể nộp bài test')
    }
  }

  const handleAnswerSelect = (answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answerIndex
    }))
  }

  const handleNext = () => {
    if (currentQuestionIndex < (selectedTest?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      finishTest()
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Đang tải bài test...</p>
        </div>
      </div>
    )
  }

  if (testResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                testResult.passed 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                  : 'bg-gradient-to-r from-red-500 to-pink-500'
              }`}>
                {testResult.passed ? (
                  <Trophy className="h-8 w-8 text-white" />
                ) : (
                  <XCircle className="h-8 w-8 text-white" />
                )}
              </div>
              <CardTitle className="text-3xl">
                {testResult.passed ? 'Chúc mừng!' : 'Cần cải thiện!'}
              </CardTitle>
              <CardDescription>
                Bạn đã hoàn thành bài test cấp {selectedTest?.level}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className={`text-6xl font-bold ${testResult.passed ? 'text-green-600' : 'text-red-600'}`}>
                {testResult.correctAnswers}/{testResult.totalQuestions}
              </div>
              <p className="text-xl text-gray-600">
                {Math.round(testResult.score)}% chính xác
              </p>
              
              {testResult.passed && testResult.rewards && (
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
                    setSelectedTest(null)
                  }}
                  variant="outline"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Làm lại
                </Button>
                <Button
                  onClick={() => {
                    setTestResult(null)
                    setSelectedTest(null)
                  }}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                >
                  Chọn bài test khác
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (isTestActive && selectedTest && currentQuestion) {
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
                    Câu {currentQuestionIndex + 1} / {selectedTest.questions.length}
                  </span>
                </div>
              </div>
              <Progress 
                value={((currentQuestionIndex + 1) / selectedTest.questions.length) * 100} 
                className="mt-2 h-2"
              />
            </CardContent>
          </Card>

          {/* Question */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Câu hỏi {currentQuestionIndex + 1}</CardTitle>
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
                  {currentQuestionIndex === selectedTest.questions.length - 1 ? 'Kết thúc' : 'Tiếp theo'}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bài test</h1>
          <p className="text-gray-600">Chọn bài test phù hợp với trình độ của bạn</p>
        </div>

        {/* Level Progression */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-blue-600" />
              Tiến độ cấp độ
            </CardTitle>
            <CardDescription>
              Bạn có thể truy cập các bài test từ cấp 1 đến cấp {accessibleLevel}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Cấp độ hiện tại: {userLevel}</span>
                <span className="text-sm text-gray-600">Có thể truy cập: Cấp 1 - {accessibleLevel}</span>
              </div>
              
              {accessibleLevel < 6 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Mở khóa cấp độ cao hơn</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    {accessibleLevel === 1 
                      ? "Hoàn thành tất cả bài test cấp 1 hoặc vượt qua test năng lực để mở khóa cấp độ cao hơn"
                      : `Hoàn thành tất cả bài test cấp ${accessibleLevel} hoặc vượt qua test năng lực để mở khóa cấp độ ${accessibleLevel + 1}`
                    }
                  </p>
                </div>
              )}
              
              {/* Level indicators */}
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5, 6].map((level) => (
                  <div
                    key={level}
                    className={`flex-1 h-2 rounded-full ${
                      level <= accessibleLevel 
                        ? 'bg-green-500' 
                        : level === accessibleLevel + 1 
                        ? 'bg-yellow-500' 
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Cấp 1</span>
                <span>Cấp 6</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Stats */}
        {testStats && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Thống kê của bạn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{testStats.levelProgress.current}</div>
                  <p className="text-sm text-gray-600">Cấp độ hiện tại</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{testStats.levelProgress.experience}</div>
                  <p className="text-sm text-gray-600">Điểm kinh nghiệm</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{user?.coins || 0}</div>
                  <p className="text-sm text-gray-600">Xu hiện có</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{testStats.totalTests}</div>
                  <p className="text-sm text-gray-600">Bài test đã làm</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tests Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => {
            const isLocked = test.level > accessibleLevel
            return (
              <Card key={test._id} className={`group transition-all duration-300 ${
                isLocked 
                  ? 'opacity-60 cursor-not-allowed' 
                  : 'hover:shadow-xl transform hover:-translate-y-1'
              }`}>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={isLocked ? "secondary" : "outline"}>
                      Cấp {test.level}
                      {isLocked && " (Khóa)"}
                    </Badge>
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="h-4 w-4" />
                      <span className="text-sm font-medium">{test.level}.0</span>
                    </div>
                  </div>
                  <CardTitle className="text-xl">{test.title}</CardTitle>
                  <CardDescription>{test.description}</CardDescription>
                </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <TestTube className="h-4 w-4 text-blue-500" />
                    <span>{test.questions.length} câu</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-500" />
                    <span>{test.timeLimit} phút</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Gem className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Chi phí: {test.requiredCoins} xu</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Thưởng: +{test.rewardExperience} XP, +{test.rewardCoins} xu
                  </div>
                </div>

                {isLocked ? (
                  <Button
                    disabled
                    className="w-full bg-gray-400 text-white cursor-not-allowed"
                  >
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Cần mở khóa cấp độ
                  </Button>
                ) : user && user.coins < test.requiredCoins ? (
                  <Button
                    disabled
                    className="w-full bg-gray-400 text-white cursor-not-allowed"
                  >
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Không đủ xu
                  </Button>
                ) : (
                  <Button
                    onClick={() => startTest(test)}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                  >
                    Bắt đầu test
                  </Button>
                )}
              </CardContent>
            </Card>
            )
          })}
        </div>

        {/* Coming Soon */}
        <Card className="mt-8 border-dashed">
          <CardContent className="text-center py-8">
            <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-500 mb-2">Nhiều bài test hơn đang được phát triển!</h3>
            <p className="text-gray-400">Chúng tôi sẽ thêm các bài test mới thường xuyên.</p>
          </CardContent>
        </Card>
      </div>

      {/* Report Error Dialog */}
      <ReportErrorDialog
        isOpen={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        itemType="test"
        itemId={currentQuestion?.question || ''}
        itemContent={currentQuestion?.question || ''}
      />
    </div>
  )
}
