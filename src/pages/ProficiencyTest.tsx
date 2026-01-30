import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { ReportErrorDialog } from '../components/ReportErrorDialog'
import {
  Brain,
  Target,
  Trophy,
  Clock,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Zap,
  Shield,
  Lightbulb,
  Gem,
  Flag
} from 'lucide-react'
import { Input } from '../components/ui/input'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

interface Question {
  _id: string
  level: number
  questionType: 'multiple-choice' | 'fill-blank' | 'reading-comprehension' | 'sentence-order'
  question: string
  options?: string[]
  correctAnswer?: any
  explanation?: string
  proficiencyLevel?: number
}

interface ProficiencyResult {
  level: number
  correctCount: number
  totalQuestions: number
  score: number
  rewards?: {
    experience: number
    coins: number
  }
}

interface ProficiencyConfig {
  id: string
  name: string
  description: string
  cost: number
  initialQuestions: {
    level: number
    count: number
  }[]
  branches: {
    name: string
    condition: {
      correctRange: [number, number]
      fromPhase: 'initial' | 'followup'
    }
    nextQuestions: {
      level: number
      count: number
    }[]
    resultLevel?: number
    nextPhase?: 'followup' | 'final'
  }[]
}

export const ProficiencyTest = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, any>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [isTestActive, setIsTestActive] = useState(false)
  const [testResult, setTestResult] = useState<ProficiencyResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [testPhase, setTestPhase] = useState<'initial' | 'followup' | 'final' | 'completed'>('initial')
  const [config, setConfig] = useState<ProficiencyConfig | null>(null)
  const [configId, setConfigId] = useState<string | null>(null)
  const [branchName, setBranchName] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'test' | 'reports'>('test')

  // Report error states
  const [showReportDialog, setShowReportDialog] = useState(false)

  const currentQuestion = questions[currentQuestionIndex]

  useEffect(() => {
    fetchConfig()
  }, [])

  useEffect(() => {
    let interval: any
    if (isTestActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitTest()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTestActive, timeLeft])

  const fetchConfig = async () => {
    try {
      const response = await api.get('/proficiency/config')
      setConfig(response.data.config)
    } catch (error) {
      console.error('Error fetching proficiency config:', error)
      toast.error('Không thể tải cấu hình test năng lực')
    }
  }

  const startProficiencyTest = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để làm test năng lực')
      return
    }

    if (!config) {
      toast.error('Không có cấu hình test năng lực')
      return
    }

    if (user.coins < config.cost) {
      toast.error(`Không đủ xu! Cần ${config.cost.toLocaleString()} xu nhưng chỉ có ${user.coins.toLocaleString()} xu`)
      return
    }

    try {
      setLoading(true)
      const response = await api.post('/proficiency/start')
      setQuestions(response.data.questions)
      setTimeLeft((response.data.timeLimit || 30) * 60)
      setIsTestActive(true)
      setTestPhase('initial')
      setCurrentQuestionIndex(0)
      setAnswers({})
      setConfigId(response.data.configId)
      
      toast.success('Bắt đầu test năng lực!')
    } catch (error: any) {
      console.error('Failed to start proficiency test:', error)
      if (error.response?.data?.insufficientCoins) {
        toast.error('Không đủ xu để làm test năng lực!')
      } else {
        toast.error(error.response?.data?.message || 'Không thể bắt đầu test năng lực')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSelect = (answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answer
    }))
  }

  const handleMultipleChoiceSelect = (optionIndex: number) => {
    const currentAnswer = answers[currentQuestionIndex] || []
    const isSelected = Array.isArray(currentAnswer) ? currentAnswer.includes(optionIndex) : currentAnswer === optionIndex
    
    let newAnswer
    if (Array.isArray(currentAnswer)) {
      newAnswer = isSelected 
        ? currentAnswer.filter((i: number) => i !== optionIndex)
        : [...currentAnswer, optionIndex]
    } else {
      newAnswer = isSelected 
        ? currentAnswer.filter((i: number) => i !== optionIndex)
        : [optionIndex]
    }
    
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: newAnswer
    }))
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      handleSubmitTest()
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleSubmitTest = async () => {
    try {
      setLoading(true)
      
      const questionIds = questions.map(q => q._id)
      const answerArray = questions.map((_, index) => answers[index] || null)
      
      const payload = {
        answers: answerArray,
        questionIds,
        phase: testPhase,
        configId
      }
      
      const response = await api.post('/proficiency/submit', payload)

      // If server tells us to proceed to next phase with questions
      if (response.data?.nextPhase) {
        const qp = response.data
        setQuestions(qp.questions || [])
        setTimeLeft((qp.timeLimit || 20) * 60)
        setTestPhase(qp.phase)
        setCurrentQuestionIndex(0)
        setAnswers({})
        setBranchName(qp.branchName || '')
        return
      }

      // Otherwise it's final result
      setTestResult(response.data.result)
      setIsTestActive(false)
      setTestPhase('completed')
      
      toast.success(`Hoàn thành test năng lực! Cấp độ: ${response.data.result.level}`)
    } catch (error) {
      console.error('Failed to submit test:', error)
      toast.error('Không thể gửi kết quả test')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }


  const getProficiencyBadgeColor = (level: number) => {
    if (level <= 2) return 'bg-green-100 text-green-800'
    if (level <= 4) return 'bg-blue-100 text-blue-800'
    if (level <= 6) return 'bg-purple-100 text-purple-800'
    return 'bg-red-100 text-red-800'
  }


  if (testResult) {
    return (
      <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Enhanced Header */}
          <div className="text-center space-y-4">
             <div className="w-20 h-20 chinese-gradient rounded-[2rem] flex items-center justify-center mx-auto shadow-xl rotate-3 mb-6">
                <Trophy className="w-10 h-10 text-white" />
             </div>
             <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">Kết quả đánh giá</h1>
             <p className="text-gray-500 font-medium">Jiudi Learning đã xác định được trình độ hiện tại của bạn.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
             <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl text-center space-y-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 chinese-gradient opacity-5 rounded-bl-[4rem]" />
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Trình độ xác định</p>
                <div className="text-6xl font-black text-primary">Cấp {testResult.level}</div>
                <Badge className={`rounded-xl px-4 py-1.5 font-bold ${getProficiencyBadgeColor(testResult.level)}`}>
                   Tương đương HSK {testResult.level}
                </Badge>
             </div>

             <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl text-center space-y-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-green-500 opacity-5 rounded-bl-[4rem]" />
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Độ chính xác</p>
                <div className="text-6xl font-black text-green-600">{testResult.score}%</div>
                <p className="text-xs font-bold text-gray-500 italic">{testResult.correctCount}/{testResult.totalQuestions} Câu trả lời đúng</p>
             </div>

             <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl text-center space-y-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500 opacity-5 rounded-bl-[4rem]" />
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Phần thưởng</p>
                <div className="space-y-2">
                   <div className="flex items-center justify-center space-x-2 text-2xl font-black text-amber-500">
                      <Zap className="w-6 h-6 fill-current" />
                      <span>+{testResult.rewards?.experience || 0} XP</span>
                   </div>
                   <div className="flex items-center justify-center space-x-2 text-2xl font-black text-amber-500">
                      <Gem className="w-6 h-6 fill-current" />
                      <span>+{testResult.rewards?.coins || 0} Xu</span>
                   </div>
                </div>
             </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
             <Button 
               onClick={() => {
                 setTestResult(null)
                 setTestPhase('initial')
                 setQuestions([])
                 setAnswers({})
                 setCurrentQuestionIndex(0)
                 setIsTestActive(false)
               }}
               className="chinese-gradient h-14 px-10 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:shadow-primary/30 transform hover:-translate-y-1 transition-all"
             >
                Làm lại bài test
             </Button>
             <Button 
               onClick={() => navigate('/tests')}
               variant="outline"
               className="h-14 px-10 rounded-2xl font-black text-lg border-2 border-gray-200 hover:border-primary hover:text-primary transition-all"
             >
                Về danh sách bài học
             </Button>
          </div>
        </div>
      </div>
    )
  }

  if (isTestActive && questions.length > 0) {
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100

    return (
      <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header với Timer và Progress */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl">
            <div className="flex items-center space-x-4">
               <div className="w-12 h-12 chinese-gradient rounded-2xl flex items-center justify-center shadow-lg">
                  <Brain className="w-6 h-6 text-white" />
               </div>
               <div>
                  <h2 className="text-xl font-black text-gray-900">Test Năng Lực</h2>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Giai đoạn: {testPhase}</p>
               </div>
            </div>

            <div className="flex-1 max-w-md mx-4">
               <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                  <span>Tiến độ bài làm</span>
                  <span>{currentQuestionIndex + 1} / {questions.length}</span>
               </div>
               <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full chinese-gradient rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
               </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="bg-primary/5 px-6 py-3 rounded-2xl border border-primary/10 flex items-center space-x-3">
                 <Clock className="w-5 h-5 text-primary animate-pulse" />
                 <span className="text-xl font-black text-primary font-mono">{formatTime(timeLeft)}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl font-bold text-orange-600 border-orange-200 hover:bg-orange-50"
                onClick={() => setShowReportDialog(true)}
              >
                <Flag className="h-4 w-4 mr-1" />
                Báo lỗi
              </Button>
            </div>
          </div>

          {/* Branch Info */}
          {branchName && (
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-lg flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-black text-gray-900">{branchName}</div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Giai đoạn: {testPhase}</div>
              </div>
            </div>
          )}

          {/* Question Display */}
          <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-gray-100 shadow-xl space-y-10 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
             
             <div className="relative z-10 space-y-8">
                <div className="space-y-4">
                   <Badge className="bg-primary/10 text-primary border-primary/20 rounded-lg px-3 py-1 font-bold text-xs uppercase tracking-widest">
                      Câu hỏi {currentQuestionIndex + 1} • Cấp {currentQuestion.proficiencyLevel || currentQuestion.level}
                   </Badge>
                   <h3 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">
                      {currentQuestion.question}
                   </h3>
                </div>

                <div className="grid gap-4">
                   {currentQuestion.questionType === 'multiple-choice' && currentQuestion.options?.map((option, index) => {
                      const currentAnswer = answers[currentQuestionIndex] || []
                      const isSelected = Array.isArray(currentAnswer) ? currentAnswer.includes(index) : currentAnswer === index
                      
                      return (
                        <button
                          key={index}
                          onClick={() => handleMultipleChoiceSelect(index)}
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

                   {currentQuestion.questionType === 'fill-blank' && (
                     <div className="pt-4">
                        <Input
                          type="text"
                          value={answers[currentQuestionIndex] || ''}
                          onChange={(e) => handleAnswerSelect(e.target.value)}
                          placeholder="Nhập đáp án của bạn vào đây..."
                          className="h-16 rounded-2xl border-2 border-gray-100 bg-gray-50/50 focus:bg-white focus:border-primary transition-all text-xl font-bold px-8 shadow-inner"
                        />
                     </div>
                   )}

                   {/* Reading Comprehension */}
                   {currentQuestion.questionType === 'reading-comprehension' && currentQuestion.options?.map((option, index) => {
                      const currentAnswer = answers[currentQuestionIndex] || []
                      const isSelected = Array.isArray(currentAnswer) ? currentAnswer.includes(index) : currentAnswer === index

                      return (
                        <button
                          key={index}
                          onClick={() => handleMultipleChoiceSelect(index)}
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

                   {/* Sentence Order */}
                   {currentQuestion.questionType === 'sentence-order' && currentQuestion.options?.map((option, index) => {
                      const currentAnswer = answers[currentQuestionIndex] || []
                      const isSelected = Array.isArray(currentAnswer) ? currentAnswer.includes(index) : false

                      return (
                        <button
                          key={index}
                          onClick={() => {
                            const current = answers[currentQuestionIndex] || []
                            const newAnswer = current.includes(index)
                              ? current.filter((i: number) => i !== index)
                              : [...current, index]
                            handleAnswerSelect(newAnswer)
                          }}
                          className={`flex items-center p-6 rounded-2xl border-2 transition-all group text-left ${
                            isSelected
                              ? 'border-primary bg-primary/5 shadow-md ring-4 ring-primary/5'
                              : 'border-gray-100 hover:border-primary/30 hover:bg-gray-50'
                          }`}
                        >
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg mr-6 shrink-0 transition-colors ${
                             isSelected ? 'chinese-gradient text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary'
                           }`}>
                              {index + 1}
                           </div>
                           <span className={`text-lg font-bold ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>{option}</span>
                           {isSelected && <CheckCircle className="ml-auto w-6 h-6 text-primary" />}
                        </button>
                      )
                   })}
                </div>
             </div>

             {/* Navigation Buttons */}
             <div className="relative z-10 pt-8 border-t border-gray-100 flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  className="rounded-xl font-bold text-gray-500 h-12"
                >
                   <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
                </Button>

                <div className="flex items-center space-x-3">
                   <Button
                     onClick={handleSubmitTest}
                     disabled={loading}
                     variant="outline"
                     className="rounded-xl font-bold text-gray-900 border-2 h-12 px-6"
                   >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Kết thúc & Nộp bài'}
                   </Button>
                   {currentQuestionIndex < questions.length - 1 && (
                     <Button
                       onClick={handleNext}
                       className="chinese-gradient h-12 px-8 rounded-xl font-black text-white shadow-lg"
                     >
                        Câu tiếp theo <ArrowRight className="ml-2 h-4 w-4" />
                     </Button>
                   )}
                </div>
             </div>
          </div>

          {/* Report Error Dialog */}
          <ReportErrorDialog
            isOpen={showReportDialog}
            onClose={() => setShowReportDialog(false)}
            itemType="question"
            itemId={currentQuestion?._id || ''}
            itemContent={currentQuestion?.question || ''}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
           <div className="w-16 h-16 chinese-gradient rounded-2xl flex items-center justify-center mx-auto shadow-lg rotate-3 mb-6">
              <Brain className="w-8 h-8 text-white" />
           </div>
           <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">Xác định năng lực</h1>
           <p className="text-gray-500 font-medium">Jiudi Learning sẽ phân tích kỹ năng của bạn để đề xuất lộ trình phù hợp.</p>

           {/* Tabs */}
           <div className="flex space-x-1 mt-6 bg-gray-100 p-1 rounded-lg w-fit mx-auto">
              <button
                onClick={() => setActiveTab('test')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'test'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Làm test
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'reports'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Báo cáo
              </button>
           </div>
        </div>

        {/* Test Tab Content */}
        {activeTab === 'test' && (<>
        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-gray-100 shadow-xl space-y-8 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />
           
           <div className="relative z-10 grid md:grid-cols-2 gap-12">
              <div className="space-y-6">
                 <h3 className="text-2xl font-black text-gray-900">Thông tin bài test</h3>
                 <div className="space-y-4">
                    {[
                      { icon: Clock, label: 'Thời gian:', value: '60 phút (2 giai đoạn)', color: 'text-blue-500' },
                      { icon: Target, label: 'Số lượng:', value: 'Tối thiểu 20 câu hỏi', color: 'text-red-500' },
                      { icon: Gem, label: 'Phí tham gia:', value: `${config?.cost || 500} Xu`, color: 'text-amber-500' },
                      { icon: Shield, label: 'Đánh giá:', value: 'Đa chiều theo HSK mới', color: 'text-green-500' }
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

              <div className="bg-gray-50 rounded-3xl p-8 space-y-6">
                 <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tài khoản của bạn</p>
                    <div className="flex items-center justify-between">
                       <span className="text-sm font-bold text-gray-600">Số dư xu:</span>
                       <span className="text-xl font-black text-amber-500">{user?.coins || 0} Xu</span>
                    </div>
                 </div>
                 
                 {user && config && user.coins < config.cost ? (
                   <div className="p-4 bg-red-50 rounded-2xl border border-red-100 space-y-2">
                      <p className="text-xs font-bold text-red-600">⚠️ Không đủ xu!</p>
                      <p className="text-[10px] text-red-500 leading-relaxed font-medium">Bạn cần nạp thêm hoặc học từ vựng để tích lũy xu trước khi làm bài test này.</p>
                   </div>
                 ) : (
                   <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                      <p className="text-[10px] text-green-600 font-bold">✨ Tài khoản của bạn đủ điều kiện tham gia!</p>
                   </div>
                 )}

                 <Button
                   onClick={startProficiencyTest}
                   disabled={!user || !config || (config && user.coins < config.cost) || loading}
                   className="w-full h-14 chinese-gradient rounded-2xl font-black text-white text-lg shadow-xl shadow-primary/20 hover:shadow-primary/30 transform hover:-translate-y-1 transition-all"
                 >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Bắt đầu đánh giá'}
                 </Button>
              </div>
           </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
           <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-lg space-y-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                 <Lightbulb className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="text-lg font-bold text-gray-900">Tại sao nên test?</h4>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">Hệ thống AI của Jiudi sẽ phân tích các lỗi sai để đưa ra các bài học từ vựng và bài tập ngữ pháp phù hợp nhất với lỗ hổng kiến thức của bạn.</p>
           </div>
           <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-lg space-y-4">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                 <Trophy className="w-5 h-5 text-purple-600" />
              </div>
              <h4 className="text-lg font-bold text-gray-900">Chứng nhận năng lực</h4>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">Sau khi hoàn thành, bạn sẽ nhận được huy hiệu năng lực hiển thị trên hồ sơ cá nhân và được mở khóa các bài học ở cấp độ tương ứng.</p>
           </div>
        </div>
        </>)}

        {/* Reports Tab Content */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-gray-100 shadow-xl space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <Brain className="h-6 w-6 text-primary" />
                    Báo cáo test năng lực
                  </h3>
                  <p className="text-gray-500 font-medium text-sm mt-1">Theo dõi tiến độ và kết quả test năng lực</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl font-bold text-orange-600 border-orange-200 hover:bg-orange-50"
                  onClick={() => setShowReportDialog(true)}
                >
                  <Flag className="h-4 w-4 mr-1" />
                  Báo lỗi
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-purple-50 p-6 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-purple-400">Tổng số test</p>
                      <p className="text-3xl font-black text-purple-900 mt-1">0</p>
                    </div>
                    <Brain className="h-8 w-8 text-purple-400" />
                  </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Cấp độ hiện tại</p>
                      <p className="text-3xl font-black text-blue-900 mt-1">Chưa có</p>
                    </div>
                    <Trophy className="h-8 w-8 text-blue-400" />
                  </div>
                </div>

                <div className="bg-green-50 p-6 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-green-400">Điểm cao nhất</p>
                      <p className="text-3xl font-black text-green-900 mt-1">0%</p>
                    </div>
                    <Target className="h-8 w-8 text-green-400" />
                  </div>
                </div>

                <div className="bg-orange-50 p-6 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-orange-400">Điểm trung bình</p>
                      <p className="text-3xl font-black text-orange-900 mt-1">0%</p>
                    </div>
                    <Target className="h-8 w-8 text-orange-400" />
                  </div>
                </div>
              </div>

              {/* Test History */}
              <div className="bg-gray-50 p-8 rounded-3xl">
                <h4 className="text-lg font-black text-gray-900 mb-4">Lịch sử test</h4>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Brain className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-bold text-gray-400">Chưa có lịch sử test</p>
                    <p className="text-sm text-gray-400 mt-1">Làm test năng lực để xem báo cáo</p>
                  </div>
                </div>
              </div>

              {/* Level Progress */}
              <div className="bg-gray-50 p-8 rounded-3xl">
                <h4 className="text-lg font-black text-gray-900 mb-4">Tiến độ cấp độ</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-black text-gray-500">1</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">Cấp độ 1 - Cơ bản</h4>
                        <p className="text-xs text-gray-500 font-medium">Chưa đạt</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gray-400">0%</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-black text-gray-500">2</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">Cấp độ 2 - Trung cấp</h4>
                        <p className="text-xs text-gray-500 font-medium">Chưa đạt</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gray-400">0%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Report Error Dialog */}
        <ReportErrorDialog
          isOpen={showReportDialog}
          onClose={() => setShowReportDialog(false)}
          itemType="question"
          itemId={currentQuestion?._id || ''}
          itemContent={currentQuestion?.question || ''}
        />
      </div>
    </div>
  )
}