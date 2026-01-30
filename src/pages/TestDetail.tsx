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
  ArrowLeft,
  ArrowRight
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
    <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/tests')}
            className="rounded-xl font-bold text-gray-500 hover:text-primary hover:bg-primary/5"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
          </Button>
          
          {testStarted && (
            <div className="flex items-center space-x-3 bg-primary/5 px-6 py-3 rounded-2xl border border-primary/10">
               <Clock className="w-5 h-5 text-primary animate-pulse" />
               <span className="text-xl font-black text-primary font-mono">{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>

        {!testStarted ? (
          <div className="space-y-8">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-gray-100 shadow-xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 chinese-gradient opacity-5 rounded-bl-[4rem]" />
               
               <div className="relative z-10 grid md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                     <Badge className="bg-primary/10 text-primary border-primary/20 rounded-lg px-3 py-1 font-bold text-xs uppercase tracking-widest">
                        Cấp độ {test.level}
                     </Badge>
                     <h1 className="text-4xl font-black text-gray-900 tracking-tight">{test.title}</h1>
                     <p className="text-gray-500 font-medium leading-relaxed">{test.description}</p>
                     
                     <div className="space-y-4 pt-4">
                        {[
                          { icon: Clock, label: 'Thời gian:', value: `${test.timeLimit} Phút`, color: 'text-blue-500' },
                          { icon: TestTube, label: 'Số câu hỏi:', value: `${test.questions.length} Câu`, color: 'text-red-500' },
                          { icon: Coins, label: 'Lệ phí:', value: `${test.requiredCoins} Xu`, color: 'text-amber-500' },
                          { icon: Star, label: 'Thưởng đạt:', value: `${test.rewardExperience} XP`, color: 'text-green-500' }
                        ].map((item, i) => (
                          <div key={i} className="flex items-center space-x-3">
                             <div className={`w-8 h-8 rounded-lg ${item.color} bg-current/10 flex items-center justify-center`}>
                                <item.icon className="w-4 h-4" />
                             </div>
                             <span className="text-sm font-bold text-gray-500">{item.label}</span>
                             <span className="text-sm font-black text-gray-900">{item.value}</span>
                          </div>
                        ))}
                     </div>
                  </div>

                  <div className="bg-gray-50 rounded-3xl p-8 flex flex-col justify-between space-y-8">
                     <div className="space-y-4">
                        <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Yêu cầu tham gia</h3>
                        <div className="p-4 bg-white rounded-2xl border border-gray-100 flex items-center justify-between">
                           <span className="text-sm font-bold text-gray-500">Số dư hiện tại:</span>
                           <span className="text-lg font-black text-amber-500">{user?.coins.toLocaleString()} Xu</span>
                        </div>
                        {user && user.coins < test.requiredCoins && (
                          <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                             <p className="text-xs font-bold text-red-600 flex items-center italic">
                                <AlertCircle className="w-4 h-4 mr-2" /> Không đủ số dư để bắt đầu.
                             </p>
                          </div>
                        )}
                     </div>

                     <Button
                       onClick={handleStartTest}
                       disabled={!user || user.coins < test.requiredCoins}
                       className="w-full h-16 chinese-gradient rounded-2xl font-black text-white text-lg shadow-xl shadow-primary/20 hover:shadow-primary/30 transform hover:-translate-y-1 transition-all"
                     >
                        Bắt đầu làm bài
                     </Button>
                  </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Progress Bar */}
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-lg">
               <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                  <span>Tiến độ bài làm</span>
                  <span>Câu {currentQuestion + 1} / {test.questions.length}</span>
               </div>
               <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full chinese-gradient transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
               </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-gray-100 shadow-xl space-y-10 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
               
               <div className="relative z-10 space-y-8">
                  <div className="space-y-4">
                     <Badge className="bg-primary/10 text-primary border-primary/20 rounded-lg px-3 py-1 font-bold text-xs uppercase tracking-widest">
                        Câu hỏi {currentQuestion + 1}
                     </Badge>
                     <h3 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">
                        {currentQ.question}
                     </h3>
                  </div>

                  <div className="grid gap-4">
                     {currentQ.questionType === 'multiple-choice' && currentQ.options?.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => handleAnswerSelect(index)}
                          className={`flex items-center p-6 rounded-2xl border-2 transition-all group text-left ${
                            answers[currentQuestion] === index 
                              ? 'border-primary bg-primary/5 shadow-md ring-4 ring-primary/5' 
                              : 'border-gray-100 hover:border-primary/30 hover:bg-gray-50'
                          }`}
                        >
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg mr-6 shrink-0 transition-colors ${
                             answers[currentQuestion] === index ? 'chinese-gradient text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary'
                           }`}>
                              {String.fromCharCode(65 + index)}
                           </div>
                           <span className={`text-lg font-bold ${answers[currentQuestion] === index ? 'text-gray-900' : 'text-gray-600'}`}>{option}</span>
                           {answers[currentQuestion] === index && <CheckCircle className="ml-auto w-6 h-6 text-primary" />}
                        </button>
                     ))}

                     {currentQ.questionType === 'true-false' && (
                        <div className="grid grid-cols-2 gap-6">
                           {[
                             { val: true, label: 'Chính xác', color: 'bg-green-500', border: 'border-green-500', icon: CheckCircle },
                             { val: false, label: 'Sai lệch', color: 'bg-red-500', border: 'border-red-500', icon: AlertCircle }
                           ].map((item) => (
                             <button
                               key={String(item.val)}
                               onClick={() => handleAnswerSelect(item.val)}
                               className={`flex flex-col items-center justify-center p-8 rounded-[2rem] border-2 transition-all space-y-4 ${
                                 answers[currentQuestion] === item.val
                                   ? `${item.border} bg-gray-50 ring-4 ring-gray-100`
                                   : 'border-gray-100 hover:border-gray-200'
                               }`}
                             >
                                <div className={`w-12 h-12 rounded-2xl ${answers[currentQuestion] === item.val ? item.color : 'bg-gray-100 text-gray-400'} flex items-center justify-center text-white transition-all`}>
                                   <item.icon className="w-6 h-6" />
                                </div>
                                <span className={`text-lg font-black ${answers[currentQuestion] === item.val ? 'text-gray-900' : 'text-gray-400'}`}>{item.label}</span>
                             </button>
                           ))}
                        </div>
                     )}
                  </div>
               </div>

               {/* Navigation Controls */}
               <div className="relative z-10 pt-8 border-t border-gray-100 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    onClick={handlePrevQuestion}
                    disabled={currentQuestion === 0}
                    className="rounded-xl font-bold text-gray-500 h-12"
                  >
                     <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
                  </Button>

                  <div className="flex items-center space-x-3">
                     {!reviewMode && (
                       <Button
                         variant="outline"
                         onClick={handleSkipQuestion}
                         className="rounded-xl font-bold text-orange-600 border-2 border-orange-100 hover:bg-orange-50 h-12"
                       >
                          Bỏ qua câu này
                       </Button>
                     )}
                     
                     {currentQuestion === test.questions.length - 1 ? (
                       <Button
                         onClick={handleSubmitTest}
                         disabled={submitting}
                         className="chinese-gradient h-12 px-10 rounded-xl font-black text-white shadow-lg shadow-primary/20 transform hover:-translate-y-1 transition-all"
                       >
                          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Kết thúc & Nộp bài'}
                       </Button>
                     ) : (
                       <Button 
                         onClick={handleNextQuestion}
                         className="chinese-gradient h-12 px-8 rounded-xl font-black text-white shadow-lg"
                       >
                          Câu tiếp theo <ArrowRight className="ml-2 h-4 w-4" />
                       </Button>
                     )}
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>

      <ReportErrorDialog
        isOpen={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        itemType="question"
        itemId={currentQ?._id || ''}
        itemContent={currentQ?.question || ''}
      />
    </div>
  )
}
