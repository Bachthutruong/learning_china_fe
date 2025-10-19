import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Progress } from '../components/ui/progress'
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { 
  TestTube, 
  Star, 
  Loader2,
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
  Flame,
  Shield,
  Flag,
  ChevronRight
} from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { ReportErrorDialog } from '../components/ReportErrorDialog'

interface Question {
  _id: string
  level: number
  questionType: 'multiple-choice' | 'fill-blank' | 'reading-comprehension' | 'sentence-order'
  question: string
  options?: string[]
  correctAnswer?: any
  explanation?: string
  passage?: string
  sentences?: string[]
  correctOrder?: number[]
  blanks?: { position: number; correctAnswer: string }[]
  subQuestions?: Array<{
    question: string
    options: string[]
    correctAnswer: number
  }>
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
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [questionCount, setQuestionCount] = useState<number>(10)
  const [countDialogOpen, setCountDialogOpen] = useState(false)
  const [tempCount, setTempCount] = useState<string>('10')
  const [lockedIndexes, setLockedIndexes] = useState<Set<number>>(new Set())
  const [answeredIndexes, setAnsweredIndexes] = useState<Set<number>>(new Set())
  const [checkingAnswer] = useState(false)
  const [showFinishConfirmation, setShowFinishConfirmation] = useState(false)
  // Immediate mode states
  const [activeTab, _setActiveTab] = useState<'test' | 'history'>('test')
  const [showResult, setShowResult] = useState(false)
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null)
  const [totalAnswered, setTotalAnswered] = useState(0)
  const [totalCorrect, setTotalCorrect] = useState(0)
  const [totalWrong, setTotalWrong] = useState(0)
  const [earnedXp, setEarnedXp] = useState(0)
  const [earnedCoins, setEarnedCoins] = useState(0)
  const [, setSessions] = useState<Array<{ id: string; startedAt: number; total: number; correct: number; wrong: number; xp: number; coins: number; items: Array<{question: string; correct: boolean; explanation?: string}> }>>([])

  useEffect(() => {
    fetchUserLevel()
    try { const raw = localStorage.getItem('newtest.sessions'); if (raw) setSessions(JSON.parse(raw)) } catch {}
  }, [setSessions])

  const fetchUserLevel = async () => {
    try {
      const response = await api.get('/users/profile')
      setUserLevel(response.data.user.level || 1)
    } catch (error) {
      console.error('Error fetching user level:', error)
    }
  }

  const startTest = async (overrideCount?: number) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để làm test')
      return
    }

    try {
      setLoading(true)
      // Get next questions prioritizing unseen and then wrong ones
      const chosen = Math.min(Math.max(overrideCount ?? questionCount, 1), 20)
      const response = await api.get(`/questions/next?limit=${chosen}`)
      setQuestions(response.data.questions || [])
      setTestStarted(true)
      setCurrentIndex(0)
      setAnswers({})
      setLockedIndexes(new Set())
      setShowResult(false)
      setLastCorrect(null)
      setTotalAnswered(0); setTotalCorrect(0); setTotalWrong(0); setEarnedXp(0); setEarnedCoins(0)
      const newSession = { id: `${Date.now()}`, startedAt: Date.now(), total: 0, correct: 0, wrong: 0, xp: 0, coins: 0, items: [] as Array<{question: string; correct: boolean; explanation?: string}> }
      setSessions(prev => { const updated = [newSession, ...prev]; localStorage.setItem('newtest.sessions', JSON.stringify(updated)); return updated })
      
      toast.success(`Bắt đầu làm bài test! Có ${response.data.questions?.length || 0} câu hỏi.`)
    } catch (error: any) {
      console.error('Error starting test:', error)
      toast.error(error.response?.data?.message || 'Không thể bắt đầu test')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSelect = (answer: any) => {
    if (lockedIndexes.has(currentIndex)) return
    if (answeredIndexes.has(currentIndex)) return
    setAnswers({
      ...answers,
      [currentIndex]: answer
    })
  }

  const handleMultipleChoiceSelect = (optionIndex: number) => {
    // If navigating back to previous question, view-only
    if (lockedIndexes.has(currentIndex)) return
    if (answeredIndexes.has(currentIndex)) return
    const currentAnswer = answers[currentIndex] || []
    const isSelected = Array.isArray(currentAnswer) ? currentAnswer.includes(optionIndex) : currentAnswer === optionIndex
    
    let newAnswer
    const q = questions[currentIndex]
    const isMulti = Array.isArray(q?.correctAnswer)
    if (isMulti) {
      const arr = Array.isArray(currentAnswer) ? currentAnswer : (Number.isFinite(currentAnswer) ? [currentAnswer] : [])
      newAnswer = isSelected ? arr.filter((i: number) => i !== optionIndex) : [...arr, optionIndex]
    } else {
      newAnswer = optionIndex
    }
    
    setAnswers({
      ...answers,
      [currentIndex]: newAnswer
    })
  }

  const handleReadingComprehensionSelect = (subQIdx: number, optionIndex: number) => {
    if (lockedIndexes.has(currentIndex)) return
    if (answeredIndexes.has(currentIndex)) return
    const currentAnswer = answers[currentIndex]
    let newAnswer: any[]
    
    if (Array.isArray(currentAnswer)) {
      newAnswer = [...currentAnswer]
    } else {
      newAnswer = []
    }
    
    // Ensure the array is long enough for all sub-questions
    const currentQuestion = questions[currentIndex]
    const subQuestionsCount = currentQuestion?.subQuestions?.length || 0
    while (newAnswer.length < subQuestionsCount) {
      newAnswer.push(null)
    }
    
    newAnswer[subQIdx] = optionIndex
    
    
    setAnswers({
      ...answers,
      [currentIndex]: newAnswer
    })
  }

  const handleNextQuestion = () => {
    setShowResult(false)
    setLastCorrect(null)
    if (currentIndex < questions.length - 1) {
      // Lock the just-answered question when moving forward
      setLockedIndexes(prev => new Set(prev).add(currentIndex))
      setCurrentIndex(currentIndex + 1)
    } else {
      toast.success('Bạn đã ở câu cuối cùng, hãy bấm Kết thúc để nộp bài.')
    }
  }

  // Removed back navigation by requirement

  // Deprecated batch submit kept for compatibility; no longer used in immediate mode

  const checkCurrentAnswer = async () => {
    if (checkingAnswer) return
    if (answeredIndexes.has(currentIndex)) return
    const q = questions[currentIndex]
    const userAns = answers[currentIndex]
    if (!q) return
    // Determine correctness based on question type
    let isCorrect = false
    if (q.questionType === 'multiple-choice') {
      if (Array.isArray(q.correctAnswer)) {
        const a = Array.isArray(userAns) ? [...userAns].sort() : []
        const b = [...q.correctAnswer].sort()
        isCorrect = a.length === b.length && a.every((v, i) => v === b[i])
      } else {
        isCorrect = Number(userAns) === Number(q.correctAnswer)
      }
    } else if (q.questionType === 'fill-blank') {
      const ca = typeof q.correctAnswer === 'string' ? q.correctAnswer : ''
      isCorrect = String(userAns || '').trim().toLowerCase() === ca.trim().toLowerCase()
    } else if (q.questionType === 'sentence-order') {
      const a = Array.isArray(userAns) ? userAns : []
      const b = Array.isArray(q.correctOrder) ? q.correctOrder : []
      isCorrect = a.length === b.length && a.every((v, i) => v === b[i])
    } else if (q.questionType === 'reading-comprehension') {
      if (q.subQuestions && Array.isArray(userAns)) {
        // Check if all sub-questions are answered
        const allAnswered = q.subQuestions.every((_, idx) => userAns[idx] !== null && userAns[idx] !== undefined)
        if (!allAnswered) {
          toast.error('Vui lòng trả lời tất cả câu hỏi con')
          return
        }
        
        // Check correctness for each sub-question
        const subResults = q.subQuestions.map((subQ, idx) => {
          const subQUserAns = userAns[idx]
          const isSubCorrect = subQ.correctAnswer === subQUserAns
          return { subQ, idx, isSubCorrect, userAnswer: subQUserAns }
        })
        
        // All sub-questions must be correct for the main question to be correct
        isCorrect = subResults.every(result => result.isSubCorrect)
        
        // Show detailed results for each sub-question
        subResults.forEach((result, idx) => {
          if (result.isSubCorrect) {
            toast.success(`✅ Câu hỏi ${idx + 1}: Đúng!`)
          } else {
            toast.error(`❌ Câu hỏi ${idx + 1}: Sai! Đáp án đúng là ${String.fromCharCode(65 + result.subQ.correctAnswer)}`)
          }
        })
      } else {
        isCorrect = false
      }
    }
    setShowResult(true)
    setLastCorrect(isCorrect)
    setTotalAnswered(v => v + 1)
    setAnsweredIndexes(prev => new Set(prev).add(currentIndex))
    setLockedIndexes(prev => new Set(prev).add(currentIndex))
    
    if (isCorrect) {
      setTotalCorrect(v => v + 1)
      setEarnedXp(v => v + 10)
      setEarnedCoins(v => v + 10)
      toast.success('Chính xác! +10 XP, +10 xu')
    } else {
      setTotalWrong(v => v + 1)
      toast.error('Chưa chính xác')
    }
    
    setSessions(prev => {
      if (prev.length === 0) return prev
      const [head, ...tail] = prev
      head.total += 1
      head.correct += isCorrect ? 1 : 0
      head.wrong += isCorrect ? 0 : 1
      head.xp += isCorrect ? 10 : 0
      head.coins += isCorrect ? 10 : 0
      head.items.push({ question: q.question, correct: isCorrect, explanation: q.explanation })
      const updated = [head, ...tail]
      localStorage.setItem('newtest.sessions', JSON.stringify(updated))
      return updated
    })
  }

  const finishTest = async () => {
    if (!testStarted || questions.length === 0) return
    try {
      setLoading(true)
      const questionIds = questions.map(q => q._id)
      // Build answers aligned with questions order
      const preparedAnswers = questions.map((q, idx) => {
        const a = answers[idx]
        if (q.questionType === 'multiple-choice') {
          return Array.isArray(q.correctAnswer) ? (Array.isArray(a) ? a : Number.isFinite(a) ? [a] : []) : (Number.isFinite(a) ? a : null)
        }
        if (q.questionType === 'fill-blank') return typeof a === 'string' ? a : ''
        if (q.questionType === 'reading-comprehension') return Array.isArray(a) ? a : []
        if (q.questionType === 'sentence-order') return Array.isArray(a) ? a : []
        return a ?? null
      })
      const resp = await api.post('/tests/submit', { answers: preparedAnswers, questionIds })
      const report: TestReport = resp.data.report
      setTestReport(report)
      setEarnedCoins(report.rewards.coins)
      setEarnedXp(report.rewards.experience)
      setTestCompleted(true)
      setTestStarted(false)
    } catch (e) {
      console.error('Finish test error:', e)
      toast.error('Nộp bài thất bại')
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
                                ✅ Đáp án của bạn: {renderAnswerPretty(item.userAnswer, item.options)}
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
                                  ❌ Đáp án của bạn: {renderAnswerPretty(item.userAnswer, item.options)}
                                </div>
                              </div>
                              <div className="bg-green-100 p-3 rounded-lg">
                                <div className="text-sm text-green-700 font-semibold">
                                  ✅ Đáp án đúng: {renderAnswerPretty(item.correctAnswer, item.options)}
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

  if (activeTab === 'test' && testStarted && questions.length > 0) {
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
                    <div className="text-sm text-gray-600 mt-1">
                      📚 Tổng cộng có {questions.length} câu hỏi - Bạn có thể làm hết tất cả!
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
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div className="px-3 py-2 bg-white rounded">Đã làm: <span className="font-semibold">{totalAnswered}</span></div>
                    <div className="px-3 py-2 bg-green-50 text-green-700 rounded">Đúng: <span className="font-semibold">{totalCorrect}</span></div>
                    <div className="px-3 py-2 bg-red-50 text-red-700 rounded">Sai: <span className="font-semibold">{totalWrong}</span></div>
                    <div className="px-3 py-2 bg-yellow-50 text-yellow-700 rounded">XP: <span className="font-semibold">{earnedXp}</span> • Xu: <span className="font-semibold">{earnedCoins}</span></div>
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
                    <span>Câu hỏi {currentIndex + 1} / {questions.length}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <BookOpen className="h-4 w-4 text-purple-200" />
                      <span className="text-sm text-purple-100">Kiểm tra kiến thức - Cấp {userLevel}</span>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border-l-4 border-purple-400">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <Lightbulb className="h-6 w-6 text-yellow-500 mt-1 flex-shrink-0" />
                      <p className="text-lg font-medium text-gray-800 leading-relaxed">{currentQuestion.question}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowReportDialog(true)}
                      className="bg-white/50 border-purple-300 text-purple-700 hover:bg-white/70 hover:text-purple-800 flex-shrink-0"
                    >
                      <Flag className="h-4 w-4 mr-1" />
                      Báo lỗi
                    </Button>
                  </div>
                </div>
              
                {/* Enhanced Multiple Choice with per-option check icon when selected & showResult */}
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
                      const currentAnswer = answers[currentIndex]
                      const isSelected = Array.isArray(currentAnswer) ? currentAnswer.includes(index) : currentAnswer === index
                      
                      const isCorrect = Array.isArray(currentQuestion.correctAnswer)
                        ? currentQuestion.correctAnswer.includes(index)
                        : Number(currentQuestion.correctAnswer) === index
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
                            {showResult && (
                              isCorrect ? (
                                <CheckCircle className="h-5 w-5 ml-auto text-white" />
                              ) : isSelected ? (
                                <XCircle className="h-5 w-5 ml-auto text-white" />
                              ) : null
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
                {currentQuestion.questionType === 'reading-comprehension' && (
                  <div className="space-y-4">
                    {/* Passage */}
                    {currentQuestion.passage && (
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <BookOpen className="h-5 w-5 text-blue-600" />
                          <span className="font-semibold text-blue-700">Đoạn văn:</span>
                        </div>
                        <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                          {currentQuestion.passage}
                        </div>
                      </div>
                    )}

                    {/* Sub-questions */}
                    {(currentQuestion.subQuestions || []).map((subQ, subQIdx) => (
                      <div key={subQIdx} className="space-y-4 border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center gap-2">
                          <Target className="h-5 w-5 text-purple-500" />
                          <span className="font-semibold text-purple-700">
                            Câu hỏi {subQIdx + 1}: {subQ.question}
                          </span>
                        </div>
                        {subQ.options.map((option, index) => {
                          const currentAnswer = answers[currentIndex]
                          const subAnswer = Array.isArray(currentAnswer) ? currentAnswer[subQIdx] : null
                          const isSelected = subAnswer === index
                          

                          return (
                            <Button
                              key={index}
                              variant={isSelected ? 'default' : 'outline'}
                              className={`w-full justify-start h-auto py-6 text-left transition-all duration-200 transform hover:scale-[1.02] ${
                                isSelected
                                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                                  : 'hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 border-2 hover:border-purple-300'
                              }`}
                              onClick={() => handleReadingComprehensionSelect(subQIdx, index)}
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
                    ))}
                  </div>
                )}

                {/* Sentence Order */}
                {currentQuestion.questionType === 'sentence-order' && currentQuestion.sentences && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="h-5 w-5 text-purple-500" />
                      <span className="font-semibold text-purple-700">Sắp xếp các câu theo thứ tự đúng:</span>
                    </div>
                    {currentQuestion.sentences.map((sentence, index) => (
                      <div
                        key={index}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 transform hover:scale-[1.02] ${
                          answers[currentIndex]?.includes(index)
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-500 shadow-lg'
                            : 'hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 border-purple-300'
                        }`}
                        onClick={() => {
                          if (lockedIndexes.has(currentIndex) || answeredIndexes.has(currentIndex)) return
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
                          <span className="text-base">{sentence}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {showResult && (
                  <div className={`p-4 rounded border ${lastCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    {currentQuestion.questionType === 'reading-comprehension' ? (
                      <div className="space-y-3">
                        <div className="text-sm font-semibold">
                          {lastCorrect ? '🎉 Tất cả câu hỏi đúng! +10 XP, +10 xu' : '❌ Có câu hỏi sai. Hãy xem chi tiết bên dưới.'}
                        </div>
                        {currentQuestion.subQuestions && Array.isArray(answers[currentIndex]) && (
                          <div className="space-y-2">
                            {currentQuestion.subQuestions.map((subQ, idx) => {
                              const userAnswer = answers[currentIndex][idx]
                              const isSubCorrect = subQ.correctAnswer === userAnswer
                              return (
                                <div key={idx} className={`p-3 rounded-lg border-l-4 ${
                                  isSubCorrect ? 'bg-green-100 border-green-400' : 'bg-red-100 border-red-400'
                                }`}>
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="font-semibold text-sm">Câu hỏi {idx + 1}:</span>
                                    <span className={`text-sm ${isSubCorrect ? 'text-green-700' : 'text-red-700'}`}>
                                      {isSubCorrect ? '✅ Đúng' : '❌ Sai'}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-600 mb-1">
                                    <strong>Đáp án của bạn:</strong> {userAnswer !== null ? String.fromCharCode(65 + userAnswer) : 'Chưa chọn'} ({subQ.options[userAnswer] || 'N/A'})
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    <strong>Đáp án đúng:</strong> {String.fromCharCode(65 + subQ.correctAnswer)} ({subQ.options[subQ.correctAnswer]})
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="text-sm font-semibold">{lastCorrect ? 'Đúng! +100 XP, +10 xu' : 'Sai. Hãy thử câu tiếp theo.'}</div>
                        {currentQuestion.explanation && (
                          <div className="mt-1 text-sm text-gray-700"><strong>Giải thích:</strong> {currentQuestion.explanation}</div>
                        )}
                      </>
                    )}
                  </div>
                )}
                {/* Enhanced Navigation */}
                <div className="flex justify-end gap-4 pt-6 border-t-2 border-purple-200">
                    {!showResult ? (
                      <Button 
                        onClick={checkCurrentAnswer}
                        disabled={checkingAnswer || answeredIndexes.has(currentIndex)}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                      >
                        <Rocket className="mr-3 h-5 w-5" />
                        Kiểm tra
                        <Sparkles className="ml-3 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleNextQuestion}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                      >
                        <Zap className="mr-3 h-5 w-5" />
                        {currentIndex < questions.length - 1 ? 'Câu tiếp' : 'Hoàn thành'}
                        <ChevronRight className="ml-3 h-5 w-5" />
                      </Button>
                    )}
                    <Button 
                      onClick={() => setShowFinishConfirmation(true)}
                      disabled={loading}
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                    >
                      Kết thúc
                    </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      {/* Report dialog for current question */}
      <ReportErrorDialog
        isOpen={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        itemType="question"
        itemId={(questions[currentIndex] as any)?._id || ''}
        itemContent={(questions[currentIndex] as any)?.question || ''}
      />
      
      {/* Finish confirmation dialog */}
      <Dialog open={showFinishConfirmation} onOpenChange={setShowFinishConfirmation}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full">
                <Flag className="h-6 w-6 text-white" />
              </div>
              Xác nhận kết thúc bài test
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl border-l-4 border-blue-400">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-800 font-medium mb-2">Bạn có chắc chắn muốn kết thúc bài test?</p>
                  {/* <div className="text-sm text-gray-600 space-y-1">
                    <p>• Đã làm: <span className="font-semibold text-green-600">{totalAnswered}</span> câu</p>
                    <p>• Đúng: <span className="font-semibold text-green-600">{totalCorrect}</span> câu</p>
                    <p>• Sai: <span className="font-semibold text-red-600">{totalWrong}</span> câu</p>
                    <p>• Tổng câu: <span className="font-semibold text-blue-600">{questions.length}</span> câu</p>
                  </div> */}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowFinishConfirmation(false)}
                className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại làm bài
              </Button>
              <Button
                onClick={() => {
                  setShowFinishConfirmation(false)
                  finishTest()
                }}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Xác nhận kết thúc
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
                    <div className="p-2 bg-green-500 rounded-full">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-green-800 font-semibold">Ưu tiên câu chưa làm, tối đa 20 câu</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500 rounded-full">
                      <Award className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-purple-800 font-semibold">10 xu + 10 XP/câu đúng</span>
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

            {/* Question count will be chosen in a dialog when starting */}

            <div className="text-center">
              <Button
                onClick={() => { setTempCount(String(questionCount)); setCountDialogOpen(true) }}
                disabled={!user || loading}
                className={`text-2xl px-12 py-6 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 ${
                  !user
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
        {/* Select question count dialog */}
        <Dialog open={countDialogOpen} onOpenChange={setCountDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Chọn số câu hỏi</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Nhập số câu bạn muốn làm (1 - 20)</p>
              <Input
                type="number"
                min={1}
                max={20}
                value={tempCount}
                onChange={(e) => setTempCount(e.target.value)}
                className="h-12 text-base"
              />
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setCountDialogOpen(false)}>Hủy</Button>
                <Button
                  onClick={() => {
                    const parsed = parseInt(tempCount, 10)
                    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 20) {
                      toast.error('Vui lòng nhập số từ 1 đến 20')
                      return
                    }
                    setQuestionCount(parsed)
                    setCountDialogOpen(false)
                    startTest(parsed)
                  }}
                >Bắt đầu</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </div>
  )
}

function renderAnswerPretty(value: any, options?: string[]) {
  if (Array.isArray(value)) {
    if (options && options.length) {
      return value.map((idx: number) => `${String.fromCharCode(65 + idx)} (${options[idx] ?? ''})`).join(', ')
    }
    return value.join(', ')
  }
  if (typeof value === 'number') {
    if (options && options.length) {
      return `${String.fromCharCode(65 + value)} (${options[value] ?? ''})`
    }
    return String(value)
  }
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}