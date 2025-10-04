import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Progress } from '../components/ui/progress'
import { Dialog, DialogContent, DialogFooter, DialogHeader as UIDialogHeader, DialogTitle as UIDialogTitle } from '../components/ui/dialog'
import { 
  Target, 
  RotateCcw,
  ChevronRight,
  Loader2,
  Flag,
  Brain,
  Zap,
  Star,
  Award,
  TrendingUp,
  BookOpen,
  Lightbulb,
  CheckCircle,
  XCircle,
  Trophy,
  Sparkles,
  Rocket,
  Gamepad2,
  Target as TargetIcon,
  Flame,
  Crown,
  Diamond
} from 'lucide-react'
import { api } from '../services/api'
// import { useAuth } from '../contexts/AuthContext'
import { ReportErrorDialog } from '../components/ReportErrorDialog'
import toast from 'react-hot-toast'

type QuestionType = 'multiple-choice' | 'fill-blank' | 'reading-comprehension' | 'sentence-order'

interface QuestionItem {
  _id: string
  level: number
  questionType: QuestionType
  question: string
  options?: string[]
  explanation?: string
  passage?: string
  sentences?: string[]
  correctAnswer?: number | string | number[]
}

export const Tests = () => {
  // const { user } = useAuth()
  const [questions, setQuestions] = useState<QuestionItem[]>([])
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [selectedOption, setSelectedOption] = useState<number | string | number[] | null>(null)
  const [displayOptions, setDisplayOptions] = useState<Array<{ text: string; originalIndex: number }>>([])
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [loading, setLoading] = useState(true)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [userLevel, setUserLevel] = useState(1)
  const [lastResult, setLastResult] = useState<{correct: boolean, explanation?: string} | null>(null)
  const [statuses, setStatuses] = useState<Array<'unanswered' | 'correct' | 'wrong'>>([])
  const [totalAnswered, setTotalAnswered] = useState(0)
  const [totalCorrect, setTotalCorrect] = useState(0)
  const [totalWrong, setTotalWrong] = useState(0)
  const [earnedXp, setEarnedXp] = useState(0)
  const [earnedCoins, setEarnedCoins] = useState(0)
  const [activeTab, setActiveTab] = useState<'practice' | 'history'>('practice')
  const [sessions, setSessions] = useState<Array<{ id: string; startedAt: number; endedAt?: number; total: number; correct: number; wrong: number; xp: number; coins: number; items: Array<{question: string; correct: boolean; explanation?: string}> }>>([])
  const [showSessionDetail, setShowSessionDetail] = useState<{open: boolean; sessionId?: string}>({ open: false })

  const currentQuestion = questions[currentIndex]

  useEffect(() => {
    fetchUserLevel()
    fetchNextQuestions()
    // restore history from localStorage
    try {
      const raw = localStorage.getItem('tests.sessions')
      if (raw) setSessions(JSON.parse(raw))
    } catch {}
  }, [])

  const fetchUserLevel = async () => {
    try {
      // reuse users/me if exists; fallback: get questions progress returns level
      const res = await api.get('/questions/progress')
      setUserLevel(res.data.level || 1)
    } catch (error) {
      // ignore
    }
  }

  const fetchNextQuestions = async () => {
    try {
      setLoading(true)
      const res = await api.get('/questions/next', { params: { limit: 10 } })
      const qs = res.data.questions || []
      setQuestions(qs)
      setUserLevel(res.data.level || userLevel)
      setCurrentIndex(0)
      setSelectedOption(null)
      setLastResult(null)
      setStatuses(new Array((qs as any[]).length).fill('unanswered'))
      // start new local session
      const newSession = {
        id: `${Date.now()}`,
        startedAt: Date.now(),
        total: 0,
        correct: 0,
        wrong: 0,
        xp: 0,
        coins: 0,
        items: [] as Array<{question: string; correct: boolean; explanation?: string}>
      }
      setTotalAnswered(0); setTotalCorrect(0); setTotalWrong(0); setEarnedXp(0); setEarnedCoins(0)
      setSessions(prev => {
        const updated = [newSession, ...prev]
        localStorage.setItem('tests.sessions', JSON.stringify(updated))
        return updated
      })
    } catch (e) {
      toast.error('Không thể tải câu hỏi')
    } finally {
      setLoading(false)
    }
  }

  // Build up to 4 display options and keep mapping to original indexes
  useEffect(() => {
    const q = currentQuestion
    if (!q || q.questionType !== 'multiple-choice' || !q.options || q.options.length === 0) {
      setDisplayOptions([])
      return
    }
    const totalOptions = q.options
    const correctIdx = typeof q.correctAnswer === 'number' ? q.correctAnswer : 0

    const otherIndexes = totalOptions.map((_, i) => i).filter(i => i !== correctIdx)
    // pick up to 3 other indexes
    for (let i = otherIndexes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[otherIndexes[i], otherIndexes[j]] = [otherIndexes[j], otherIndexes[i]]
    }
    const picked = [correctIdx, ...otherIndexes.slice(0, Math.max(0, 3))]
    // shuffle picked for display
    for (let i = picked.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[picked[i], picked[j]] = [picked[j], picked[i]]
    }
    const built = picked.map(idx => ({ text: totalOptions[idx], originalIndex: idx }))
    setDisplayOptions(built)
    setSelectedOption(null)
  }, [currentQuestion])

  const submitCurrent = async () => {
    if (!currentQuestion) return
    
    // Check if answer is provided based on question type
    if (currentQuestion.questionType === 'multiple-choice' && selectedOption === null) return
    if (currentQuestion.questionType === 'fill-blank' && (!selectedOption || (typeof selectedOption === 'string' && selectedOption.trim() === ''))) return
    if (currentQuestion.questionType === 'reading-comprehension' && selectedOption === null) return
    if (currentQuestion.questionType === 'sentence-order' && (!selectedOption || !Array.isArray(selectedOption) || selectedOption.length === 0)) return
    try {
      setSubmitting(true)
      const res = await api.post('/questions/submit', {
        questionId: (currentQuestion as any)._id,
        answer: selectedOption
      })
      const correct = !!res.data.correct
      setLastResult({ correct, explanation: res.data.explanation || undefined })
      // Update status for current question
      setStatuses(prev => {
        const copy = [...prev]
        copy[currentIndex] = correct ? 'correct' : 'wrong'
        return copy
      })
      // Update practice stats and session
      setTotalAnswered(v => v + 1)
      if (correct) {
        setTotalCorrect(v => v + 1)
        setEarnedXp(v => v + 5)
        // optional coins: +0 here; keep coins for correct as 0 to avoid confusion, or +0
      } else {
        setTotalWrong(v => v + 1)
      }
      setSessions(prev => {
        if (prev.length === 0) return prev
        const [head, ...tail] = prev
        head.total += 1
        head.correct += correct ? 1 : 0
        head.wrong += correct ? 0 : 1
        head.xp += correct ? 5 : 0
        head.coins += 0
        head.items.push({ question: currentQuestion.question, correct, explanation: res.data.explanation || undefined })
        const updated = [head, ...tail]
        localStorage.setItem('tests.sessions', JSON.stringify(updated))
        return updated
      })
      if (correct) toast.success('Chính xác! +5 XP')
      else toast.error('Chưa chính xác')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Không gửi được câu trả lời')
    } finally {
      setSubmitting(false)
    }
  }

  const nextQuestion = () => {
    if (questions.length === 0) return
    // Find next not-correct question after current index
    const total = questions.length
    for (let step = 1; step <= total; step++) {
      const idx = (currentIndex + step) % total
      if (statuses[idx] !== 'correct') {
        setCurrentIndex(idx)
        setSelectedOption(null)
        setLastResult(null)
        return
      }
    }
    // All questions are correct → fetch new batch (likely higher cấp ở backend)
    toast.success('Bạn đã trả lời đúng tất cả! Đang tải câu hỏi tiếp theo...')
    fetchNextQuestions()
  }

  // no timer needed for bank-mode

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <Brain className="h-16 w-16 text-purple-500 mx-auto mb-4 animate-pulse" />
            <Sparkles className="h-6 w-6 text-yellow-400 absolute -top-2 -right-2 animate-bounce" />
            <Zap className="h-4 w-4 text-orange-400 absolute top-2 -left-2 animate-ping" />
          </div>
          <p className="text-gray-700 font-medium text-lg">Đang tải câu hỏi thông minh...</p>
          <div className="flex justify-center mt-4 space-x-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    )
  }
  if (activeTab === 'practice' && currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Enhanced Progress Card */}
          <Card className="mb-6 border-0 shadow-xl bg-gradient-to-r from-purple-100 to-pink-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
                    <Crown className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <span className="font-bold text-lg text-purple-800">Cấp {userLevel}</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full">
                    <TargetIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-lg text-blue-800">
                      Câu {currentIndex + 1} / {questions.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span className="text-sm text-orange-600">Đang luyện tập</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <Progress 
                  value={((currentIndex + 1) / Math.max(questions.length, 1)) * 100} 
                  className="h-3 bg-white/50 rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-purple-700">
                    {Math.round(((currentIndex + 1) / Math.max(questions.length, 1)) * 100)}%
                  </span>
                </div>
              </div>
              {/* Stats summary */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div className="px-3 py-2 bg-white/60 rounded">Đã làm: <span className="font-semibold">{totalAnswered}</span></div>
                <div className="px-3 py-2 bg-green-50 rounded text-green-700">Đúng: <span className="font-semibold">{totalCorrect}</span></div>
                <div className="px-3 py-2 bg-red-50 rounded text-red-700">Sai: <span className="font-semibold">{totalWrong}</span></div>
                <div className="px-3 py-2 bg-yellow-50 rounded text-yellow-700">XP: <span className="font-semibold">{earnedXp}</span> • Xu: <span className="font-semibold">{earnedCoins}</span></div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Question Card */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-full">
                    <Brain className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white">Câu hỏi {currentIndex + 1}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <BookOpen className="h-4 w-4 text-blue-200" />
                      <span className="text-sm text-blue-100">Luyện tập thông minh</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReportDialog(true)}
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30 hover:text-white"
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
              
              {currentQuestion.questionType === 'multiple-choice' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="h-5 w-5 text-purple-500" />
                    <span className="font-semibold text-purple-700">Chọn đáp án đúng:</span>
                  </div>
                  {displayOptions.map((option, index) => (
                    <Button
                      key={index}
                      variant={selectedOption === option.originalIndex ? 'default' : 'outline'}
                      className={`w-full justify-start h-auto py-6 text-left transition-all duration-200 transform hover:scale-[1.02] ${
                        selectedOption === option.originalIndex 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                          : 'hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 border-2 hover:border-purple-300'
                      }`}
                      onClick={() => setSelectedOption(option.originalIndex)}
                    >
                      <div className="flex items-center w-full">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 font-bold ${
                          selectedOption === option.originalIndex 
                            ? 'bg-white/20 text-white' 
                            : 'bg-purple-100 text-purple-600'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className="text-base">{option.text}</span>
                        {selectedOption === option.originalIndex && (
                          <CheckCircle className="h-5 w-5 ml-auto text-white" />
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              )}

              {/* Fill Blank Question */}
              {currentQuestion.questionType === 'fill-blank' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="h-5 w-5 text-purple-500" />
                    <span className="font-semibold text-purple-700">Điền từ vào chỗ trống:</span>
                  </div>
                  <input
                    type="text"
                    value={typeof selectedOption === 'string' ? selectedOption : ''}
                    onChange={(e) => setSelectedOption(e.target.value)}
                    placeholder="Nhập đáp án của bạn..."
                    className="w-full p-4 border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg"
                  />
                </div>
              )}

              {/* Reading Comprehension Question */}
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
                  
                  {/* Question and Options */}
                  {currentQuestion.options && currentQuestion.options.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Target className="h-5 w-5 text-purple-500" />
                        <span className="font-semibold text-purple-700">Chọn đáp án đúng:</span>
                      </div>
                      {displayOptions.map((option, index) => (
                        <Button
                          key={index}
                          variant={selectedOption === option.originalIndex ? 'default' : 'outline'}
                          className={`w-full justify-start h-auto py-6 text-left transition-all duration-200 transform hover:scale-[1.02] ${
                            selectedOption === option.originalIndex 
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                              : 'hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 border-2 hover:border-purple-300'
                          }`}
                          onClick={() => setSelectedOption(option.originalIndex)}
                        >
                          <div className="flex items-center w-full">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 font-bold ${
                              selectedOption === option.originalIndex 
                                ? 'bg-white/20 text-white' 
                                : 'bg-purple-100 text-purple-600'
                            }`}>
                              {String.fromCharCode(65 + index)}
                            </div>
                            <span className="text-base">{option.text}</span>
                            {selectedOption === option.originalIndex && (
                              <CheckCircle className="h-5 w-5 ml-auto text-white" />
                            )}
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Sentence Order Question */}
              {currentQuestion.questionType === 'sentence-order' && currentQuestion.options && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="h-5 w-5 text-purple-500" />
                    <span className="font-semibold text-purple-700">Sắp xếp các câu theo thứ tự đúng:</span>
                  </div>
                  {displayOptions.map((option, index) => (
                    <div
                      key={index}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 transform hover:scale-[1.02] ${
                        Array.isArray(selectedOption) && selectedOption.includes(option.originalIndex)
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-500 shadow-lg'
                          : 'hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 border-purple-300'
                      }`}
                      onClick={() => {
                        const currentAnswer = Array.isArray(selectedOption) ? selectedOption : []
                        const newAnswer = currentAnswer.includes(option.originalIndex)
                          ? currentAnswer.filter((i: number) => i !== option.originalIndex)
                          : [...currentAnswer, option.originalIndex]
                        setSelectedOption(newAnswer)
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          Array.isArray(selectedOption) && selectedOption.includes(option.originalIndex)
                            ? 'bg-white/20 text-white'
                            : 'bg-purple-100 text-purple-600'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="text-base">{option.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {lastResult && (
                <div className={`p-6 rounded-xl border-2 ${
                  lastResult.correct 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                    : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    {lastResult.correct ? (
                      <div className="p-2 bg-green-500 rounded-full">
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                    ) : (
                      <div className="p-2 bg-red-500 rounded-full">
                        <XCircle className="h-6 w-6 text-white" />
                      </div>
                    )}
                    <span className={`text-lg font-bold ${
                      lastResult.correct ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {lastResult.correct ? '🎉 Chính xác! +5 XP' : '❌ Chưa chính xác'}
                    </span>
                  </div>
                  {lastResult.explanation && (
                    <div className="bg-white/50 p-4 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-semibold text-gray-700">Giải thích:</span>
                          <p className="text-gray-600 mt-1">{lastResult.explanation}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between gap-4">
                <Button 
                  variant="outline" 
                  onClick={nextQuestion}
                  className="flex-1 py-6 text-lg font-semibold border-2 border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400 transition-all duration-200"
                >
                  <RotateCcw className="mr-3 h-5 w-5" /> 
                  Bỏ qua
                </Button>

                {lastResult ? (
                  <Button 
                    onClick={nextQuestion} 
                    className="flex-1 py-6 text-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    <Rocket className="mr-3 h-5 w-5" />
                    Câu tiếp theo 
                    <ChevronRight className="ml-3 h-5 w-5" />
                  </Button>
                ) : (
                  <Button 
                    onClick={submitCurrent} 
                    disabled={selectedOption === null || submitting} 
                    className="flex-1 py-6 text-lg font-semibold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                        Đang nộp...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-3 h-5 w-5" />
                        Nộp đáp án
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // History tab
  if (activeTab === 'history') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Lịch sử luyện tập</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setActiveTab('practice')}>Quay lại luyện tập</Button>
            </div>
          </div>
          <Card>
            <CardContent className="p-4">
              {sessions.length === 0 ? (
                <div className="text-center text-gray-600 py-8">Chưa có lịch sử</div>
              ) : (
                <div className="space-y-2">
                  {sessions.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-white rounded border">
                      <div className="text-sm">
                        <div className="font-semibold">{new Date(s.startedAt).toLocaleString()}</div>
                        <div className="text-gray-600">Đã làm {s.total} • Đúng {s.correct} • Sai {s.wrong} • XP {s.xp} • Xu {s.coins}</div>
                      </div>
                      <Button size="sm" onClick={() => setShowSessionDetail({ open: true, sessionId: s.id })}>Xem chi tiết</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          {/* Session detail dialog */}
          <Dialog open={showSessionDetail.open} onOpenChange={(open) => { if (!open) setShowSessionDetail({ open: false }) }}>
            <DialogContent className="max-w-3xl">
              <UIDialogHeader><UIDialogTitle>Chi tiết phiên</UIDialogTitle></UIDialogHeader>
              <div className="space-y-2 max-h-[70vh] overflow-auto">
                {(sessions.find(s => s.id === showSessionDetail.sessionId)?.items || []).map((it, idx) => (
                  <div key={idx} className={`p-3 rounded border ${it.correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="text-sm"><span className="font-semibold">Câu {idx + 1}:</span> {it.question}</div>
                    <div className="text-xs text-gray-600">{it.correct ? 'Đúng' : 'Sai'}</div>
                    {it.explanation && (
                      <div className="mt-1 text-sm text-gray-700"><span className="font-semibold">Giải thích:</span> {it.explanation}</div>
                    )}
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSessionDetail({ open: false })}>Đóng</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="mb-8 text-center">
          <div className="relative inline-block">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-4">
              🧠 Luyện tập thông minh
            </h1>
            <div className="absolute -top-2 -right-2">
              <Sparkles className="h-8 w-8 text-yellow-400 animate-bounce" />
            </div>
            <div className="absolute -bottom-2 -left-2">
              <Brain className="h-6 w-6 text-purple-400 animate-pulse" />
            </div>
          </div>
          <p className="text-xl text-gray-700 font-medium">
            Ưu tiên câu hỏi bạn chưa làm hoặc làm sai trước ở cấp độ hiện tại
          </p>
          <div className="flex justify-center mt-4">
            <div className="flex items-center gap-2 bg-white/50 px-4 py-2 rounded-full">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-sm font-semibold text-green-700">Học tập thông minh</span>
            </div>
          </div>
        </div>

        {/* Enhanced Summary Card */}
        <Card className="mb-8 border-0 shadow-2xl bg-gradient-to-r from-purple-100 via-pink-100 to-blue-100">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 bg-white/20 rounded-full">
                <Crown className="h-8 w-8" />
              </div>
              <div>
                <span>Cấp hiện tại: {userLevel}</span>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="h-4 w-4 text-yellow-300 fill-current" />
                  <Star className="h-4 w-4 text-yellow-300 fill-current" />
                  <Star className="h-4 w-4 text-yellow-300 fill-current" />
                  <Star className="h-4 w-4 text-yellow-300 fill-current" />
                  <Star className="h-4 w-4 text-yellow-300 fill-current" />
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="text-center">
              <div className="mb-6">
                <div className="inline-flex items-center gap-3 bg-white/50 px-6 py-3 rounded-full mb-4">
                  <Gamepad2 className="h-6 w-6 text-purple-500" />
                  <span className="font-semibold text-purple-700">Sẵn sàng luyện tập?</span>
                </div>
                <p className="text-gray-600 mb-6">
                  Hệ thống sẽ tự động chọn những câu hỏi phù hợp nhất với trình độ của bạn
                </p>
              </div>
              <div className="flex justify-center gap-3">
                <Button 
                  onClick={fetchNextQuestions} 
                className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 text-white text-lg px-8 py-4 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <Rocket className="mr-3 h-6 w-6" />
                  🚀 Bắt đầu luyện tập
                  <Sparkles className="ml-3 h-5 w-5" />
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('history')}>Lịch sử</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Empty State */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-purple-50">
          <CardContent className="text-center py-16">
            <div className="relative inline-block mb-6">
              <div className="p-6 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full">
                <BookOpen className="h-16 w-16 text-purple-500" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Diamond className="h-8 w-8 text-yellow-400 animate-bounce" />
              </div>
              <div className="absolute -bottom-2 -left-2">
                <Trophy className="h-6 w-6 text-orange-400 animate-pulse" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              🎯 Sẵn sàng cho thử thách?
            </h3>
            <p className="text-lg text-gray-600 mb-6">
              Nhấn "Bắt đầu luyện tập" để khởi động hành trình học tập thông minh của bạn!
            </p>
            <div className="flex justify-center gap-4">
              <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">Tự động điều chỉnh</span>
              </div>
              <div className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full">
                <Brain className="h-5 w-5" />
                <span className="font-semibold">Học tập thông minh</span>
              </div>
              <div className="flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full">
                <Award className="h-5 w-5" />
                <span className="font-semibold">Tiến bộ liên tục</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Error Dialog */}
      <ReportErrorDialog
        isOpen={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        itemType="question"
        itemId={(currentQuestion as any)?._id || ''}
        itemContent={(currentQuestion as any)?.question || ''}
      />
    </div>
  )
}
