import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group'
import { Label } from '../../components/ui/label'
import { Progress } from '../../components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'
import toast from 'react-hot-toast'
import { 
  Clock, 
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  Send,
  AlertTriangle,
  Trophy
} from 'lucide-react'

interface Question {
  question: string
  options: string[]
  correctAnswer: number | number[]
  questionType: string
}

interface Competition {
  id: string
  questions: Question[]
  totalTime: number
  endTime: string
}

export const UserCompetitionPlay = () => {
  const { id } = useParams()
  const { } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<any[]>([])
  const [startedAt, setStartedAt] = useState<Date | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [isAutoSubmit, setIsAutoSubmit] = useState(false)

  useEffect(() => {
    if (id) {
      startCompetition()
    }
  }, [id])

  useEffect(() => {
    if (competition && startedAt) {
      const timer = setInterval(() => {
        updateTimeLeft()
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [competition, startedAt])

  const startCompetition = async () => {
    try {
      const response = await api.post(`/user-competitions/${id}/start`)
      const competitionData = response.data.competition
      setCompetition(competitionData)
      setStartedAt(new Date())
      
      // Initialize answers array
      const initialAnswers = competitionData.questions.map(() => ({
        userAnswer: null,
        timeSpent: 0
      }))
      setAnswers(initialAnswers)
      
      // Show message for late joiners
      if (competitionData.isLateJoiner) {
        toast.success(`Bạn đã tham gia muộn! Thời gian còn lại: ${competitionData.remainingTime} phút`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể bắt đầu cuộc thi')
      navigate(`/user-competitions/${id}`)
    } finally {
      setLoading(false)
    }
  }

  const updateTimeLeft = () => {
    if (!competition || !startedAt) return

    const now = new Date()
    const endTime = new Date(competition.endTime)
    const totalTimeMs = competition.totalTime * 60 * 1000
    const elapsedMs = now.getTime() - startedAt.getTime()
    const remainingMs = Math.min(
      endTime.getTime() - now.getTime(),
      totalTimeMs - elapsedMs
    )

    if (remainingMs <= 0) {
      // Auto submit when time is up
      setIsAutoSubmit(true)
      handleSubmit()
    } else {
      setTimeLeft(Math.floor(remainingMs / 1000))
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnswerChange = (value: string) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = {
      userAnswer: parseInt(value),
      timeSpent: 0 // Will calculate on submit
    }
    setAnswers(newAnswers)
  }

  const handleNavigation = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    } else if (direction === 'next' && currentQuestion < competition!.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handleSubmit = async () => {
    if (submitting) return

    const unanswered = answers.filter(a => a.userAnswer === null).length
    
    // If auto-submit (time up), submit directly
    if (isAutoSubmit) {
      await submitAnswers()
      return
    }

    // If manual submit, show confirmation dialog
    if (unanswered > 0) {
      setShowSubmitDialog(true)
    } else {
      await submitAnswers()
    }
  }

  const submitAnswers = async () => {
    setSubmitting(true)
    try {
      await api.post(`/user-competitions/${id}/submit`, {
        answers,
        startedAt
      })
      toast.success('Nộp bài thành công!')
      navigate(`/user-competitions/${id}/results`)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmSubmit = async () => {
    setShowSubmitDialog(false)
    await submitAnswers()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!competition) {
    return null
  }

  const question = competition.questions[currentQuestion]
  const progress = ((currentQuestion + 1) / competition.questions.length) * 100
  const isLastQuestion = currentQuestion === competition.questions.length - 1

  return (
    <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header with Timer and Info */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl">
           <div className="flex items-center space-x-4">
              <div className="w-12 h-12 chinese-gradient rounded-2xl flex items-center justify-center shadow-lg">
                 <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                 <h2 className="text-xl font-black text-gray-900">Đấu trường Bạn hữu</h2>
                 <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Đang tranh tài...</p>
              </div>
           </div>

           <div className="flex-1 max-w-md mx-4">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                 <span>Tiến độ bài thi</span>
                 <span>{currentQuestion + 1} / {competition.questions.length}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                 <div 
                   className="h-full chinese-gradient rounded-full transition-all duration-500"
                   style={{ width: `${progress}%` }}
                 />
              </div>
           </div>

           <div className="flex items-center space-x-3 bg-primary/5 px-6 py-3 rounded-2xl border border-primary/10">
              <Clock className="w-5 h-5 text-primary animate-pulse" />
              <span className="text-xl font-black text-primary font-mono">{formatTime(timeLeft)}</span>
           </div>
        </div>

        {/* Question Area */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-gray-100 shadow-xl space-y-10 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
           
           <div className="relative z-10 space-y-8">
              <div className="space-y-4">
                 <Badge className="bg-primary/10 text-primary border-primary/20 rounded-lg px-3 py-1 font-bold text-xs uppercase tracking-widest">
                    Câu hỏi {currentQuestion + 1}
                 </Badge>
                 <h3 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">
                    {question.question}
                 </h3>
              </div>

              <div className="grid gap-4">
                 {question.options.map((option, index) => {
                    const isSelected = answers[currentQuestion]?.userAnswer === index
                    return (
                      <button
                        key={index}
                        onClick={() => handleAnswerChange(index.toString())}
                        className={`flex items-center p-6 rounded-2xl border-2 transition-all group text-left ${
                          isSelected 
                            ? 'border-primary bg-primary/5 shadow-md ring-4 ring-primary/5' 
                            : 'border-gray-100 hover:border-primary/30 hover:bg-gray-50'
                        }`}
                      >
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg mr-6 shrink-0 transition-colors ${
                           isSelected ? 'chinese-gradient text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary'
                         }`}>
                            {String.fromCharCode(65 + index)}
                         </div>
                         <span className={`text-lg font-bold ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>{option}</span>
                         {isSelected && <CheckCircle className="ml-auto w-6 h-6 text-primary" />}
                      </button>
                    )
                 })}
              </div>
           </div>

           {/* Navigation Controls */}
           <div className="relative z-10 pt-8 border-t border-gray-100 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => handleNavigation('prev')}
                disabled={currentQuestion === 0}
                className="rounded-xl font-bold text-gray-500 h-12"
              >
                 <ChevronLeft className="mr-2 h-4 w-4" /> Câu trước
              </Button>

              <div className="flex items-center space-x-3">
                 <div className="hidden md:flex items-center gap-1.5 mr-4">
                    {competition.questions.map((_, idx) => (
                      <div 
                        key={idx} 
                        className={`w-2 h-2 rounded-full transition-all ${
                          idx === currentQuestion ? 'bg-primary scale-125' : 
                          answers[idx]?.userAnswer !== null ? 'bg-green-400' : 'bg-gray-200'
                        }`} 
                      />
                    ))}
                 </div>

                 {isLastQuestion ? (
                   <Button
                     onClick={handleSubmit}
                     disabled={submitting}
                     className="chinese-gradient h-12 px-10 rounded-xl font-black text-white shadow-lg shadow-primary/20 transform hover:-translate-y-1 transition-all"
                   >
                      {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Nộp bài ngay'}
                   </Button>
                 ) : (
                   <Button 
                     onClick={() => handleNavigation('next')}
                     className="chinese-gradient h-12 px-8 rounded-xl font-black text-white shadow-lg"
                   >
                      Câu tiếp theo <ChevronRight className="ml-2 h-4 w-4" />
                   </Button>
                 )}
              </div>
           </div>
        </div>

        {/* Footer Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600 font-black text-xs">
                 {answers.filter(a => a.userAnswer !== null).length}
              </div>
              <span className="text-[10px] font-black uppercase text-gray-400">Đã trả lời</span>
           </div>
           <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 font-black text-xs">
                 {answers.filter(a => a.userAnswer === null).length}
              </div>
              <span className="text-[10px] font-black uppercase text-gray-400">Còn trống</span>
           </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog Redesign */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="rounded-[2.5rem] p-10 border-none shadow-2xl max-w-sm text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-amber-500">
             <AlertTriangle className="w-8 h-8" />
          </div>
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl font-black text-gray-900">Nộp bài thi?</DialogTitle>
            <DialogDescription className="text-sm font-medium text-gray-500">
               {answers.filter(a => a.userAnswer === null).length > 0 
                 ? `Bạn vẫn còn ${answers.filter(a => a.userAnswer === null).length} câu chưa hoàn thành. Bạn có chắc chắn muốn kết thúc bài thi?`
                 : "Bạn đã hoàn thành tất cả câu hỏi. Chúc bạn đạt kết quả cao!"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-8">
            <Button
              onClick={handleConfirmSubmit}
              disabled={submitting}
              className="h-12 rounded-xl font-black text-white shadow-lg bg-green-500 hover:bg-green-600"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xác nhận nộp bài'}
            </Button>
            <Button variant="ghost" onClick={() => setShowSubmitDialog(false)} className="h-12 rounded-xl font-bold text-gray-400">Tiếp tục làm bài</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}