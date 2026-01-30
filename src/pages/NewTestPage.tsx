import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Progress } from '../components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { 
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
  Flag,
  ChevronRight,
  Gem,
  FileText,
  X,
  AlertCircle
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
  const [lockedIndexes, setLockedIndexes] = useState<Set<number>>(new Set())
  const [answeredIndexes, setAnsweredIndexes] = useState<Set<number>>(new Set())
  const [checkingAnswer] = useState(false)
  const [submitting, setSubmitting] = useState(false)
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
  const [, setSessions] = useState<Array<any>>([])

  useEffect(() => {
    fetchUserLevel()
    try { const raw = localStorage.getItem('newtest.sessions'); if (raw) setSessions(JSON.parse(raw)) } catch {}
  }, [])

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
      const chosen = Math.min(Math.max(overrideCount ?? questionCount, 1), 20)
      const response = await api.get(`/questions/next?limit=${chosen}`)
      setQuestions(response.data.questions || [])
      setTestStarted(true)
      setCurrentIndex(0)
      setAnswers({})
      setLockedIndexes(new Set())
      setAnsweredIndexes(new Set())
      setShowResult(false)
      setLastCorrect(null)
      setTotalAnswered(0); setTotalCorrect(0); setTotalWrong(0); setEarnedXp(0); setEarnedCoins(0)
      
      const newSession = { id: `${Date.now()}`, startedAt: Date.now(), total: 0, correct: 0, wrong: 0, xp: 0, coins: 0, items: [] }
      setSessions(prev => { 
        const updated = [newSession, ...prev]; 
        localStorage.setItem('newtest.sessions', JSON.stringify(updated)); 
        return updated 
      })
      
      toast.success(`Bắt đầu bài test!`)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể bắt đầu test')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSelect = (answer: any) => {
    if (lockedIndexes.has(currentIndex)) return
    setAnswers({ ...answers, [currentIndex]: answer })
  }

  const handleMultipleChoiceSelect = (optionIndex: number) => {
    if (lockedIndexes.has(currentIndex)) return
    const currentAnswer = answers[currentIndex] || []
    const q = questions[currentIndex]
    const isMulti = Array.isArray(q?.correctAnswer)
    
    let newAnswer
    if (isMulti) {
      const arr = Array.isArray(currentAnswer) ? currentAnswer : (Number.isFinite(currentAnswer) ? [currentAnswer] : [])
      newAnswer = arr.includes(optionIndex) ? arr.filter((i: number) => i !== optionIndex) : [...arr, optionIndex]
    } else {
      newAnswer = optionIndex
    }
    
    setAnswers({ ...answers, [currentIndex]: newAnswer })
  }

  const handleReadingComprehensionSelect = (subQIdx: number, optionIndex: number) => {
    if (lockedIndexes.has(currentIndex)) return
    const currentAnswer = answers[currentIndex] || []
    const newAnswer = [...currentAnswer]
    const subQuestionsCount = questions[currentIndex]?.subQuestions?.length || 0
    while (newAnswer.length < subQuestionsCount) newAnswer.push(null)
    newAnswer[subQIdx] = optionIndex
    setAnswers({ ...answers, [currentIndex]: newAnswer })
  }

  const handleNextQuestion = () => {
    setShowResult(false)
    setLastCorrect(null)
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const checkCurrentAnswer = async () => {
    if (checkingAnswer || submitting) return
    if (answeredIndexes.has(currentIndex)) return
    const q = questions[currentIndex]
    const userAns = answers[currentIndex]
    if (!q || userAns === undefined) {
      toast.error('Vui lòng chọn đáp án')
      return
    }

    setSubmitting(true)
    try {
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
        isCorrect = String(userAns || '').trim().toLowerCase() === String(q.correctAnswer || '').trim().toLowerCase()
      } else if (q.questionType === 'sentence-order') {
        const a = Array.isArray(userAns) ? userAns : []
        const b = q.correctOrder || []
        isCorrect = a.length === b.length && a.every((v, i) => v === b[i])
      } else if (q.questionType === 'reading-comprehension') {
        if (q.subQuestions && Array.isArray(userAns)) {
          isCorrect = q.subQuestions.every((sq, idx) => sq.correctAnswer === userAns[idx])
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
    } finally {
      setSubmitting(false)
    }
  }

  const finishTest = async () => {
    try {
      setLoading(true)
      const questionIds = questions.map(q => q._id)
      const preparedAnswers = questions.map((q, idx) => answers[idx] ?? null)
      const resp = await api.post('/tests/submit', { answers: preparedAnswers, questionIds })
      setTestReport(resp.data.report)
      setTestCompleted(true)
      setTestStarted(false)
    } catch (e) {
      toast.error('Nộp bài thất bại')
    } finally {
      setLoading(false)
    }
  }

  const resetTest = () => {
    setQuestions([]); setCurrentIndex(0); setAnswers({}); setTestStarted(false); setTestCompleted(false); setTestReport(null);
  }

  const renderAnswerPretty = (value: any, options?: string[]) => {
    if (Array.isArray(value)) {
      if (options?.length) return value.map((idx: number) => `${String.fromCharCode(65 + idx)} (${options[idx] ?? ''})`).join(', ')
      return value.join(', ')
    }
    if (typeof value === 'number' && options?.length) return `${String.fromCharCode(65 + value)} (${options[value] ?? ''})`
    return String(value ?? 'N/A')
  }

  if (testCompleted && testReport) {
    return (
      <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-12 text-center">
           <div className="w-24 h-24 chinese-gradient rounded-[2rem] flex items-center justify-center mx-auto shadow-xl rotate-3 mb-8">
              <Trophy className="w-12 h-12 text-white" />
           </div>
           <h1 className="text-4xl font-black text-gray-900">Kết quả bài Test</h1>
           <div className="grid md:grid-cols-3 gap-6">
              <Card className="rounded-[2rem] p-8 border-none shadow-xl bg-white"><div className="text-4xl font-black text-primary">{testReport.score}%</div><p className="text-gray-400 font-bold uppercase text-[10px] mt-2">Điểm số</p></Card>
              <Card className="rounded-[2rem] p-8 border-none shadow-xl bg-white"><div className="text-4xl font-black text-green-600">{testReport.correctCount}</div><p className="text-gray-400 font-bold uppercase text-[10px] mt-2">Câu đúng</p></Card>
              <Card className="rounded-[2rem] p-8 border-none shadow-xl bg-white"><div className="text-4xl font-black text-amber-500">+{testReport.rewards.experience}</div><p className="text-gray-400 font-bold uppercase text-[10px] mt-2">XP tích lũy</p></Card>
           </div>
           <Button onClick={resetTest} className="chinese-gradient h-14 px-10 rounded-2xl font-black text-white text-lg shadow-xl">Làm bài test mới</Button>
        </div>
      </div>
    )
  }

  if (activeTab === 'test' && testStarted && questions.length > 0) {
    const currentQuestion = questions[currentIndex]
    const progress = ((currentIndex + 1) / questions.length) * 100

    return (
      <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-xl space-y-6">
             <div className="flex justify-between items-end">
                <div className="space-y-1">
                   <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tiến độ bài thi</p>
                   <p className="text-xl font-black text-gray-900">Câu {currentIndex + 1} / {questions.length}</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black uppercase text-gray-400">XP hiện tại</p>
                   <p className="text-sm font-black text-primary">+{earnedXp}</p>
                </div>
             </div>
             <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full chinese-gradient rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
             </div>
          </div>

          <div className="bg-white rounded-[3rem] p-8 md:p-16 border border-gray-100 shadow-2xl relative overflow-hidden space-y-10">
             <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
             <div className="relative z-10 space-y-8">
                <div className="flex items-center justify-between">
                   <Badge className="bg-primary/5 text-primary border-none rounded-lg px-2 py-0.5 text-[8px] font-black uppercase tracking-widest">{currentQuestion.questionType}</Badge>
                   <Button variant="ghost" size="sm" onClick={() => setShowReportDialog(true)} className="text-gray-400 hover:text-primary"><Flag className="w-4 h-4 mr-2" /> Báo lỗi</Button>
                </div>
                <h3 className="text-2xl md:text-4xl font-black text-gray-900 leading-tight">{currentQuestion.question}</h3>
                
                <div className="grid gap-4">
                   {currentQuestion.questionType === 'multiple-choice' && currentQuestion.options?.map((opt, i) => (
                     <button key={i} disabled={showResult} onClick={() => handleMultipleChoiceSelect(i)} className={`flex items-center p-6 rounded-[2rem] border-2 transition-all text-left ${answers[currentIndex] === i ? 'border-primary bg-primary/5' : 'border-gray-50 bg-gray-50/30'}`}>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl mr-6 ${answers[currentIndex] === i ? 'chinese-gradient text-white' : 'bg-white text-gray-400'}`}>{String.fromCharCode(65 + i)}</div>
                        <span className="text-lg font-bold text-gray-700">{opt}</span>
                     </button>
                   ))}
                   {currentQuestion.questionType === 'fill-blank' && (
                     <Input value={answers[currentIndex] || ''} onChange={(e) => handleAnswerSelect(e.target.value)} className="h-20 rounded-[2rem] text-2xl font-black px-10" placeholder="Nhập đáp án..." />
                   )}
                </div>

                {showResult && (
                  <div className={`p-8 rounded-[2rem] border-2 ${lastCorrect ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                     <div className="flex items-center space-x-4 mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${lastCorrect ? 'bg-green-500' : 'bg-red-500'}`}>{lastCorrect ? <CheckCircle /> : <XCircle />}</div>
                        <h4 className="text-xl font-black">{lastCorrect ? 'Chính xác!' : 'Chưa đúng rồi'}</h4>
                     </div>
                     <p className="text-sm font-medium text-gray-600">{currentQuestion.explanation}</p>
                  </div>
                )}

                <div className="pt-10 border-t border-gray-100 flex items-center justify-between">
                   <Button variant="ghost" onClick={() => setShowFinishConfirmation(true)} className="font-bold text-gray-400"><X className="mr-2 h-4 w-4" /> Kết thúc</Button>
                   <div className="flex gap-4">
                      {!showResult ? (
                        <Button onClick={checkCurrentAnswer} disabled={submitting} className="chinese-gradient h-14 px-10 rounded-2xl font-black text-white text-lg shadow-xl">Kiểm tra</Button>
                      ) : (
                        <Button onClick={handleNextQuestion} className="chinese-gradient h-14 px-10 rounded-2xl font-black text-white text-lg shadow-xl">{currentIndex === questions.length - 1 ? 'Xem kết quả' : 'Câu tiếp theo'} <ChevronRight className="ml-2 h-5 w-5" /></Button>
                      )}
                   </div>
                </div>
             </div>
          </div>
        </div>

        <Dialog open={showFinishConfirmation} onOpenChange={setShowFinishConfirmation}>
          <DialogContent className="rounded-[2.5rem] p-10 border-none shadow-2xl max-w-sm text-center">
             <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-amber-500"><AlertCircle className="w-8 h-8" /></div>
             <DialogHeader><DialogTitle className="text-2xl font-black">Kết thúc bài thi?</DialogTitle><DialogDescription>Hệ thống sẽ tổng kết kết quả ngay bây giờ.</DialogDescription></DialogHeader>
             <div className="flex flex-col gap-3 mt-8">
                <Button onClick={() => { setShowFinishConfirmation(false); finishTest(); }} className="h-12 rounded-xl font-black text-white bg-green-500 hover:bg-green-600">Nộp bài</Button>
                <Button variant="ghost" onClick={() => setShowFinishConfirmation(false)} className="h-12 rounded-xl font-bold text-gray-400">Tiếp tục</Button>
             </div>
          </DialogContent>
        </Dialog>

        <ReportErrorDialog isOpen={showReportDialog} onClose={() => setShowReportDialog(false)} itemType="question" itemId={currentQuestion._id} itemContent={currentQuestion.question} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
           <div className="w-20 h-20 chinese-gradient rounded-[2rem] flex items-center justify-center mx-auto shadow-xl rotate-3 mb-8">
              <Rocket className="w-10 h-10 text-white" />
           </div>
           <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight">Thử thách <span className="text-primary">Đột phá</span></h1>
           <p className="text-gray-500 font-medium">Khởi động bài test ngẫu nhiên được tùy chỉnh riêng cho cấp độ hiện tại của bạn.</p>
        </div>

        <Card className="bg-white rounded-[3rem] p-8 md:p-12 border border-gray-100 shadow-2xl overflow-hidden">
           <div className="space-y-8">
              <div className="space-y-4">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Số lượng câu hỏi (1 - 20)</Label>
                 <div className="flex gap-3">
                    {[10, 15, 20].map((n) => (
                      <button key={n} onClick={() => setQuestionCount(n)} className={`flex-1 h-14 rounded-2xl border-2 font-black transition-all ${questionCount === n ? 'border-primary bg-primary/5 text-primary' : 'border-gray-50 text-gray-400'}`}>{n}</button>
                    ))}
                 </div>
              </div>
              <Button onClick={() => startTest()} disabled={loading} className="w-full h-16 chinese-gradient rounded-2xl font-black text-white text-xl shadow-xl">{loading ? <Loader2 className="animate-spin" /> : 'Bắt đầu bài Test'}</Button>
           </div>
        </Card>
      </div>
    </div>
  )
}