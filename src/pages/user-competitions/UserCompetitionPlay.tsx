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
  AlertTriangle
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Đang làm bài thi
              </h1>
              <p className="text-gray-600 mt-1">Hãy tập trung và làm bài cẩn thận!</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-gray-200 shadow-lg">
                <Badge className="text-lg px-3 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white">
                  <Clock className="w-5 h-5 mr-2" />
                  {formatTime(timeLeft)}
                </Badge>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-gray-200 shadow-lg">
                <Badge className="text-lg px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                  Câu {currentQuestion + 1}/{competition.questions.length}
                </Badge>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-lg">
            <Progress value={progress} className="h-3 bg-gray-200 rounded-full" />
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>Tiến độ: {Math.round(progress)}%</span>
              <span>{currentQuestion + 1}/{competition.questions.length} câu</span>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <Card className="mb-8 shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-xl">
            <CardTitle className="text-2xl font-bold text-gray-800">
              Câu {currentQuestion + 1}: {question.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <RadioGroup
              value={answers[currentQuestion]?.userAnswer?.toString() || ''}
              onValueChange={handleAnswerChange}
            >
              <div className="space-y-4">
                {question.options.map((option, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center space-x-4 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                      answers[currentQuestion]?.userAnswer?.toString() === index.toString()
                        ? 'border-purple-500 bg-purple-50 shadow-md'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25'
                    }`}
                  >
                    <RadioGroupItem 
                      value={index.toString()} 
                      id={`option-${index}`}
                      className="w-5 h-5"
                    />
                    <Label 
                      htmlFor={`option-${index}`} 
                      className="flex-1 cursor-pointer text-lg font-medium text-gray-700"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center mb-8">
          <Button
            variant="outline"
            onClick={() => handleNavigation('prev')}
            disabled={currentQuestion === 0}
            className="px-6 py-3 rounded-xl border-2 hover:bg-purple-50 hover:border-purple-300"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Câu trước
          </Button>

          {/* Question indicators */}
          <div className="flex gap-2 flex-wrap justify-center max-w-md">
            {competition.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`w-10 h-10 rounded-full text-sm font-bold transition-all duration-200 ${
                  index === currentQuestion
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg scale-110'
                    : answers[index]?.userAnswer !== null
                    ? 'bg-green-500 text-white shadow-md hover:scale-105'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300 hover:scale-105'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {isLastQuestion ? (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Đang nộp...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Nộp bài
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => handleNavigation('next')}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Câu tiếp
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </div>

        {/* Summary */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Đã trả lời</p>
                  <p className="text-xl font-bold text-green-600">{answers.filter(a => a.userAnswer !== null).length}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl border border-orange-200">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Chưa trả lời</p>
                  <p className="text-xl font-bold text-orange-600">{answers.filter(a => a.userAnswer === null).length}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Xác nhận nộp bài
            </DialogTitle>
            <DialogDescription>
              {(() => {
                const unanswered = answers.filter(a => a.userAnswer === null).length
                if (unanswered > 0) {
                  return (
                    <>
                      Bạn còn <strong>{unanswered} câu chưa trả lời</strong>. 
                      Bạn có chắc chắn muốn nộp bài không?
                    </>
                  )
                } else {
                  return (
                    <>
                      Bạn đã trả lời hết tất cả câu hỏi. 
                      Bạn có chắc chắn muốn nộp bài không?
                    </>
                  )
                }
              })()}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleConfirmSubmit}
              disabled={submitting}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Đang nộp...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Nộp bài
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
