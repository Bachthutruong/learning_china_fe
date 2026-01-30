import { useState, useEffect } from 'react'
import { Card, CardContent} from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader as UIDialogHeader, DialogTitle as UIDialogTitle } from '../components/ui/dialog'
import { 
  RotateCcw,
  ChevronRight,
  Loader2,
  Flag,
  Brain,
  Zap,
  Star,
  TrendingUp,
  Lightbulb,
  CheckCircle,
  XCircle,
  Sparkles,
  Rocket,
  Gamepad2,
  Target as TargetIcon,
} from 'lucide-react'
import { api } from '../services/api'
import { ReportErrorDialog } from '../components/ReportErrorDialog'
import toast from 'react-hot-toast'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'

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
    try {
      const raw = localStorage.getItem('tests.sessions')
      if (raw) setSessions(JSON.parse(raw))
    } catch {}
  }, [])

  const fetchUserLevel = async () => {
    try {
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

  useEffect(() => {
    const q = currentQuestion
    if (!q || q.questionType !== 'multiple-choice' || !q.options || q.options.length === 0) {
      setDisplayOptions([])
      return
    }
    const totalOptions = q.options
    const correctIdx = typeof q.correctAnswer === 'number' ? q.correctAnswer : 0

    const otherIndexes = totalOptions.map((_, i) => i).filter(i => i !== correctIdx)
    for (let i = otherIndexes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[otherIndexes[i], otherIndexes[j]] = [otherIndexes[j], otherIndexes[i]]
    }
    const picked = [correctIdx, ...otherIndexes.slice(0, Math.max(0, 3))]
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
      setStatuses(prev => {
        const copy = [...prev]
        copy[currentIndex] = correct ? 'correct' : 'wrong'
        return copy
      })
      setTotalAnswered(v => v + 1)
      if (correct) {
        setTotalCorrect(v => v + 1)
        setEarnedXp(v => v + 5)
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
    toast.success('Bạn đã trả lời đúng tất cả! Đang tải câu hỏi tiếp theo...')
    fetchNextQuestions()
  }

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
        </div>
      </div>
    )
  }
  if (activeTab === 'practice' && currentQuestion) {
    return (
      <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl">
            <div className="flex items-center space-x-4">
               <div className="w-12 h-12 chinese-gradient rounded-2xl flex items-center justify-center shadow-lg">
                  <Gamepad2 className="w-6 h-6 text-white" />
               </div>
               <div>
                  <h2 className="text-xl font-black text-gray-900">Luyện tập thông minh</h2>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cấp độ {userLevel}</p>
               </div>
            </div>

            <div className="flex-1 max-w-md mx-4">
               <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                  <span>Tiến độ đợt học</span>
                  <span>{currentIndex + 1} / {questions.length}</span>
               </div>
               <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full chinese-gradient rounded-full transition-all duration-500"
                    style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                  />
               </div>
            </div>

            <div className="flex items-center space-x-4">
               <div className="text-center px-4 border-r border-gray-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Đúng</p>
                  <p className="text-lg font-black text-green-600">{totalCorrect}</p>
               </div>
               <div className="text-center px-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">XP Nhận</p>
                  <p className="text-lg font-black text-primary flex items-center">
                     <Zap className="w-4 h-4 mr-1 fill-current" /> {earnedXp}
                  </p>
               </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-gray-100 shadow-xl space-y-10 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
             
             <div className="relative z-10 space-y-8">
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <Badge className="bg-primary/10 text-primary border-primary/20 rounded-lg px-3 py-1 font-bold text-xs uppercase tracking-widest">
                         Câu hỏi {currentIndex + 1} • {currentQuestion.questionType.replace('-', ' ')}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowReportDialog(true)}
                        className="text-gray-400 hover:text-primary rounded-xl"
                      >
                         <Flag className="w-4 h-4 mr-2" />
                         <span className="text-xs font-bold uppercase">Báo lỗi</span>
                      </Button>
                   </div>
                   
                   <div className="space-y-6">
                      {currentQuestion.passage && (
                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-gray-700 leading-relaxed font-medium">
                           {currentQuestion.passage}
                        </div>
                      )}
                      <h3 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">
                         {currentQuestion.question}
                      </h3>
                   </div>
                </div>

                <div className="grid gap-4">
                   {currentQuestion.questionType === 'multiple-choice' && displayOptions.map((option, index) => {
                      const isSelected = selectedOption === option.originalIndex
                      const isAnswered = lastResult !== null
                      const isCorrect = isAnswered && option.originalIndex === (currentQuestion.correctAnswer as number)
                      const isWrong = isAnswered && isSelected && !lastResult.correct

                      return (
                        <button
                          key={index}
                          disabled={isAnswered}
                          onClick={() => setSelectedOption(option.originalIndex)}
                          className={`flex items-center p-6 rounded-2xl border-2 transition-all group text-left ${
                            isCorrect ? 'border-green-500 bg-green-50 shadow-md ring-4 ring-green-50' :
                            isWrong ? 'border-red-500 bg-red-50' :
                            isSelected ? 'border-primary bg-primary/5 shadow-md ring-4 ring-primary/5' :
                            'border-gray-100 hover:border-primary/30 hover:bg-gray-50'
                          }`}
                        >
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg mr-6 shrink-0 transition-colors ${
                             isCorrect ? 'bg-green-500 text-white' :
                             isWrong ? 'bg-red-500 text-white' :
                             isSelected ? 'chinese-gradient text-white' : 
                             'bg-gray-100 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary'
                           }`}>
                              {String.fromCharCode(65 + index)}
                           </div>
                           <span className={`text-lg font-bold ${isSelected || isCorrect || isWrong ? 'text-gray-900' : 'text-gray-600'}`}>{option.text}</span>
                           {isCorrect && <CheckCircle className="ml-auto w-6 h-6 text-green-500" />}
                           {isWrong && <XCircle className="ml-auto w-6 h-6 text-red-500" />}
                        </button>
                      )
                   })}

                   {currentQuestion.questionType === 'fill-blank' && (
                     <div className="pt-4 space-y-4">
                        <Input
                          type="text"
                          disabled={lastResult !== null}
                          value={typeof selectedOption === 'string' ? selectedOption : ''}
                          onChange={(e) => setSelectedOption(e.target.value)}
                          placeholder="Nhập đáp án của bạn..."
                          className="h-16 rounded-2xl border-2 border-gray-100 bg-gray-50/50 focus:bg-white focus:border-primary transition-all text-xl font-bold px-8 shadow-inner"
                        />
                        {lastResult && (
                           <div className={`p-4 rounded-xl font-bold ${lastResult.correct ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                              Đáp án đúng: {currentQuestion.correctAnswer}
                           </div>
                        )}
                     </div>
                   )}
                </div>

                {lastResult && lastResult.explanation && (
                  <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex items-start space-x-4">
                     <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                        <Lightbulb className="w-5 h-5 text-amber-600" />
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Giải thích chi tiết</p>
                        <p className="text-sm text-amber-900 font-medium leading-relaxed">{lastResult.explanation}</p>
                     </div>
                  </div>
                )}
             </div>

             <div className="relative z-10 pt-8 border-t border-gray-100 flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={nextQuestion}
                  className="rounded-xl font-bold text-gray-500 h-12"
                >
                   <RotateCcw className="mr-2 h-4 w-4" /> Bỏ qua câu này
                </Button>

                <div className="flex items-center space-x-3">
                   {lastResult ? (
                     <Button
                       onClick={nextQuestion}
                       className="chinese-gradient h-12 px-8 rounded-xl font-black text-white shadow-lg shadow-primary/20 transform hover:-translate-y-1 transition-all"
                     >
                        Câu tiếp theo <ChevronRight className="ml-2 h-4 w-4" />
                     </Button>
                   ) : (
                     <Button
                       onClick={submitCurrent}
                       disabled={selectedOption === null || submitting}
                       className="chinese-gradient h-12 px-10 rounded-xl font-black text-white shadow-lg shadow-primary/20 transform hover:-translate-y-1 transition-all"
                     >
                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Nộp đáp án'}
                     </Button>
                   )}
                </div>
             </div>
          </div>
        </div>
      </div>
    )
  }

  if (activeTab === 'history') {
    return (
      <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8">
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
    <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-4">
           <div className="w-16 h-16 chinese-gradient rounded-2xl flex items-center justify-center mx-auto shadow-lg rotate-3 mb-6">
              <TargetIcon className="w-8 h-8 text-white" />
           </div>
           <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">Luyện tập <span className="text-primary">Thông minh</span></h1>
           <p className="text-gray-500 font-medium max-w-2xl mx-auto">
              Hệ thống tự động ưu tiên các kiến thức bạn chưa vững, giúp tối ưu hóa thời gian và hiệu quả học tập.
           </p>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-gray-100 shadow-xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />
           
           <div className="relative z-10 flex flex-col items-center text-center space-y-8">
              <div className="space-y-2">
                 <div className="flex items-center justify-center space-x-2 text-amber-500 mb-2">
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                 </div>
                 <h3 className="text-2xl font-black text-gray-900">Sẵn sàng nâng cao trình độ?</h3>
                 <p className="text-gray-500 font-medium">Hiện tại bạn đang ở <span className="text-primary font-black uppercase tracking-widest">Cấp độ {userLevel}</span></p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                 <Button 
                   onClick={fetchNextQuestions} 
                   className="flex-1 h-14 chinese-gradient rounded-2xl font-black text-white text-lg shadow-xl shadow-primary/20 hover:shadow-primary/30 transform hover:-translate-y-1 transition-all"
                 >
                    <Rocket className="mr-3 h-6 w-6" /> Bắt đầu luyện tập
                 </Button>
                 <Button 
                   onClick={() => setActiveTab('history')}
                   variant="outline"
                   className="flex-1 h-14 rounded-2xl font-black text-lg border-2 border-gray-200 hover:border-primary hover:text-primary transition-all"
                 >
                    Lịch sử học
                 </Button>
              </div>

              <div className="grid grid-cols-3 gap-8 w-full pt-8 border-t border-gray-100">
                 <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Ưu tiên</p>
                    <p className="text-sm font-bold text-gray-700">Câu chưa làm</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tự động</p>
                    <p className="text-sm font-bold text-gray-700">Điều chỉnh cấp độ</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Phần thưởng</p>
                    <p className="text-sm font-bold text-gray-700">+5 XP / Câu đúng</p>
                 </div>
              </div>
           </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
           {[
             { title: 'Tập trung', desc: 'Hệ thống lọc bỏ các câu hỏi bạn đã thành thạo.', icon: Brain, color: 'text-purple-600' },
             { title: 'Thử thách', desc: 'Đưa ra các câu hỏi khó dần theo trình độ thực tế.', icon: Zap, color: 'text-blue-600' },
             { title: 'Tiến bộ', desc: 'Tích lũy XP để mở khóa các cấp độ cao hơn.', icon: TrendingUp, color: 'text-green-600' }
           ].map((item, i) => (
             <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-3">
                <div className={`w-10 h-10 rounded-xl ${item.color} bg-current/10 flex items-center justify-center`}>
                   <item.icon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-gray-900">{item.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed font-medium">{item.desc}</p>
             </div>
           ))}
        </div>
      </div>

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