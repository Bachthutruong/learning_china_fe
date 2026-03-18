import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { 
  ArrowLeft, 
  ArrowRight, 
  XCircle,
  RotateCcw,
  Trophy,
  Brain,
  Loader2,
  CheckCircle,
  Lightbulb
} from 'lucide-react'
import { Badge } from './ui/badge'
import { api } from '../services/api'
import toast from 'react-hot-toast'

interface Vocabulary {
  _id: string
  word: string
  pinyin: string
  zhuyin?: string
  meaning: string
  partOfSpeech: string
  level: number
  topics: string[]
  examples: string[]
  synonyms: string[]
  antonyms: string[]
  imageUrl?: string
  audio?: string
  audioUrl?: string
  questions?: QuizQuestion[]
}

interface QuizQuestion {
  question: string
  options: string[]
  // Hỗ trợ cả câu 1 đáp án và nhiều đáp án
  correctAnswer: number | number[]
  explanation?: string
}

interface TopicQuizProps {
  topicId: string
  topicName: string
  isOpen: boolean
  onClose: () => void
}

export const TopicQuiz = ({ topicId, topicName, isOpen, onClose }: TopicQuizProps) => {
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  // answers[i] là danh sách index đáp án đã chọn cho từ vựng i
  const [answers, setAnswers] = useState<number[][]>([])
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  // remove auto-move; use manual Next button

  useEffect(() => {
    if (isOpen) {
      fetchLearnedVocabularies()
    }
  }, [isOpen, topicId])

  // no auto-move cleanup needed

  const fetchLearnedVocabularies = async () => {
    try {
      setLoading(true)
      const response = await api.get('/vocabulary-learning/vocabulary/learned-for-quiz', {
        params: {
          personalTopicId: topicId
        }
      })
      
      const learnedVocabularies = response.data.vocabularies || []
      
      if (learnedVocabularies.length === 0) {
        toast.error('Chưa có từ vựng nào đã học trong chủ đề này')
        onClose()
        return
      }

      // Lấy 1 câu hỏi ngẫu nhiên từ mỗi từ vựng (đảm bảo chỉ 1 câu)
      const quizVocabularies = learnedVocabularies
        .map((vocab: Vocabulary) => {
          const qs = (vocab.questions || [])
          if (qs.length === 0) return null
          const q = qs[Math.floor(Math.random() * qs.length)]
          return { ...vocab, questions: [q] }
        })
        .filter(Boolean) as Vocabulary[]

      setVocabularies(quizVocabularies)
      setCurrentIndex(0)
      setAnswers([])
      setQuizCompleted(false)
      setScore(0)
    } catch (error) {
      console.error('Error fetching learned vocabularies:', error)
      toast.error('Không thể tải từ vựng đã học')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (answerIndex: number) => {
    if (showAnswer) return
    const currentVocabulary = vocabularies[currentIndex]
    const question = currentVocabulary?.questions?.[0]
    if (!question) return

    const isMulti = Array.isArray(question.correctAnswer)

    const newAnswers = [...answers]
    const currentSelected = newAnswers[currentIndex]
      ? [...newAnswers[currentIndex]]
      : []

    if (isMulti) {
      // Toggle nhiều đáp án
      if (currentSelected.includes(answerIndex)) {
        newAnswers[currentIndex] = currentSelected.filter((i) => i !== answerIndex)
      } else {
        newAnswers[currentIndex] = [...currentSelected, answerIndex]
      }
    } else {
      // Câu 1 đáp án: chỉ giữ 1 lựa chọn
      newAnswers[currentIndex] = [answerIndex]
    }

    setAnswers(newAnswers)
  }

  const isUserAnswerCorrect = (question: QuizQuestion, selectedIndices: number[]) => {
    if (!selectedIndices || selectedIndices.length === 0) return false

    const correctRaw = question.correctAnswer
    const correctIndices = Array.isArray(correctRaw) ? correctRaw : [correctRaw]

    if (selectedIndices.length !== correctIndices.length) return false

    const sortedSelected = [...selectedIndices].sort()
    const sortedCorrect = [...correctIndices].sort()

    return sortedSelected.every((v, i) => v === sortedCorrect[i])
  }

  const handleCheck = () => {
    if (!answers[currentIndex] || answers[currentIndex].length === 0) return
    setShowAnswer(true)
  }

  const handleNext = () => {
    
    if (currentIndex < vocabularies.length - 1) {
      setShowAnswer(false)
      setCurrentIndex(currentIndex + 1)
    } else {
      // Calculate final score
      const correctAnswers = vocabularies.filter((vocab, index) => {
        const q = vocab.questions![0]
        const selected = answers[index] || []
        return isUserAnswerCorrect(q, selected)
      }).length
      const finalScore = Math.round((correctAnswers / vocabularies.length) * 100)
      setScore(finalScore)
      setQuizCompleted(true)
    }
  }

  const handlePrevious = () => {
    setShowAnswer(false)
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleRestart = () => {
    setCurrentIndex(0)
    setAnswers([])
    setQuizCompleted(false)
    setScore(0)
    setShowAnswer(false)
  }

  const persistResults = async () => {
    try {
      // Save per-word status: correct -> learned, wrong -> studying
      const updates = vocabularies.map((vocab, index) => {
        const isCorrect = isUserAnswerCorrect(vocab.questions![0], answers[index] || [])
        const status = isCorrect ? 'learned' : 'studying'
        return api.post('/vocabulary-learning/user/vocabularies', {
          vocabularyId: vocab._id,
          status,
          personalTopicId: topicId
        })
      })
      await Promise.allSettled(updates)
      toast.success('Đã cập nhật trạng thái từ vựng sau khảo bài')
    } catch (e) {
      console.error('Failed to persist quiz results', e)
      toast.error('Không thể lưu kết quả khảo bài')
    }
  }

  const currentVocabulary = vocabularies[currentIndex]
  const currentQuestion = currentVocabulary?.questions?.[0]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 p-4 overflow-y-auto flex items-start justify-center animate-in fade-in duration-300">
      <Card className="w-full max-w-2xl rounded-[3rem] border-none shadow-2xl relative my-8 max-h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 chinese-gradient opacity-5 rounded-bl-[8rem]" />
        
        <CardHeader className="border-b border-gray-100 p-8 md:p-10 bg-white/80 relative z-10">
          <CardTitle className="flex items-center justify-between text-2xl font-black text-gray-900 tracking-tight">
            <div className="flex items-center">
               <div className="w-10 h-10 chinese-gradient rounded-xl flex items-center justify-center text-white mr-4 shadow-lg">
                  <Brain className="w-6 h-6" />
               </div>
               <span>Khảo bài: {topicName}</span>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
              <XCircle className="w-6 h-6" />
            </button>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-8 md:p-12 bg-white relative z-10 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Đang chuẩn bị câu hỏi...</p>
            </div>
          ) : quizCompleted ? (
            <div className="text-center space-y-10 py-6 animate-in zoom-in duration-500">
              <div className="relative inline-block">
                 <div className="text-8xl">🎉</div>
                 <div className="absolute -top-2 -right-2 w-8 h-8 chinese-gradient rounded-full flex items-center justify-center text-white text-xs font-black shadow-lg">TOCFL</div>
              </div>
              
              <div className="space-y-2">
                 <p className="text-6xl font-black text-primary tracking-tighter">{score}%</p>
                 <h3 className="text-2xl font-black text-gray-900">
                    {score >= 80 ? 'Tuyệt đỉnh công phu!' : score >= 60 ? 'Hành trình đang tốt!' : 'Cần tu luyện thêm!'}
                 </h3>
                 <p className="text-gray-500 font-medium italic">"Bạn đã trả lời đúng {score}% câu hỏi trong đợt khảo bài này."</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={handleRestart} variant="outline" className="h-14 px-8 rounded-2xl font-black border-2 border-gray-100 hover:border-primary hover:text-primary transition-all">
                  <RotateCcw className="w-5 h-5 mr-2" /> Thử lại đợt này
                </Button>
                <Button
                  onClick={async () => {
                    await persistResults()
                    onClose()
                  }}
                  className="h-14 px-10 chinese-gradient text-white rounded-2xl font-black shadow-xl shadow-primary/20 transform hover:-translate-y-1 transition-all"
                >
                  <Trophy className="w-5 h-5 mr-2" /> Hoàn thành & Lưu
                </Button>
              </div>
            </div>
          ) : currentVocabulary && currentQuestion ? (
            <div className="space-y-8 animate-in slide-in-from-right duration-500">
              {/* Progress & Meta */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                   <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Tiến độ khảo bài</span>
                   <span className="text-sm font-black text-gray-900">Câu {currentIndex + 1} / {vocabularies.length}</span>
                </div>
                <div className="w-40 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="h-full chinese-gradient transition-all duration-500"
                    style={{ width: `${((currentIndex + 1) / vocabularies.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Character Focus */}
              <div className="bg-gray-50 rounded-[2rem] p-10 text-center space-y-2 border border-gray-100 shadow-inner group">
                 <p className="text-[10px] font-black uppercase text-primary tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity">Mặt chữ Hán tự</p>
                 <div className="text-7xl md:text-8xl font-black text-gray-900 tracking-tight transform group-hover:scale-110 transition-transform duration-500">
                    {currentVocabulary.word}
                 </div>
              </div>

              {/* Question */}
              <div className="space-y-4">
                 <Badge className="bg-primary/5 text-primary border-none rounded-lg px-2 py-0.5 text-[8px] font-black uppercase tracking-widest">Question</Badge>
                 <h4 className="text-xl font-black text-gray-900 leading-snug">{currentQuestion.question}</h4>
                 {Array.isArray(currentQuestion.correctAnswer) && currentQuestion.correctAnswer.length > 1 && (
                   <p className="text-[10px] font-black uppercase text-amber-600">
                     Dạng: Chọn <span className="underline">nhiều đáp án đúng</span>
                   </p>
                 )}
              </div>

              {/* Options */}
              <div className="grid gap-3">
                {currentQuestion.options.map((option, index) => {
                  const selectedForCurrent = answers[currentIndex] || []
                  const isSelected = selectedForCurrent.includes(index)

                  const correctRaw = currentQuestion.correctAnswer
                  const correctIndices = Array.isArray(correctRaw) ? correctRaw : [correctRaw]
                  const isCorrect = showAnswer && correctIndices.includes(index)
                  const isWrong = showAnswer && isSelected && !isCorrect
                  
                  return (
                    <button
                      key={index}
                      disabled={showAnswer}
                      onClick={() => handleAnswer(index)}
                      className={`w-full flex items-center p-5 rounded-2xl border-2 transition-all text-left group ${
                        isCorrect ? 'border-green-500 bg-green-50 shadow-md ring-4 ring-green-50' :
                        isWrong ? 'border-red-500 bg-red-50' :
                        isSelected ? 'border-primary bg-primary/5 shadow-md ring-4 ring-primary/5' :
                        'border-gray-50 bg-gray-50/30 hover:border-primary/30 hover:bg-white'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg mr-6 shrink-0 transition-colors ${
                        isCorrect ? 'bg-green-500 text-white' :
                        isWrong ? 'bg-red-500 text-white' :
                        isSelected ? 'chinese-gradient text-white' : 
                        'bg-white text-gray-400 group-hover:bg-primary/10 group-hover:text-primary'
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className={`text-base font-bold flex-1 ${isSelected || isCorrect || isWrong ? 'text-gray-900' : 'text-gray-600'}`}>{option}</span>
                      {isCorrect && <CheckCircle className="w-6 h-6 text-green-500" />}
                      {isWrong && <XCircle className="w-6 h-6 text-red-500" />}
                    </button>
                  )
                })}
              </div>

              {/* Action Bar */}
              <div className="pt-8 border-t border-gray-100 flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className="rounded-xl font-bold text-gray-400 h-12"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Trước đó
                </Button>

                <div className="flex gap-3">
                   {!showAnswer ? (
                     <Button
                       onClick={handleCheck}
                       disabled={answers[currentIndex] === undefined}
                       className="h-12 px-8 chinese-gradient text-white rounded-xl font-black shadow-lg shadow-primary/20 transform hover:-translate-y-1 transition-all"
                     >
                       Kiểm tra đáp án
                     </Button>
                   ) : (
                     <Button
                       onClick={handleNext}
                       className="h-12 px-8 chinese-gradient text-white rounded-xl font-black shadow-lg shadow-primary/20 transform hover:-translate-y-1 transition-all"
                     >
                       {currentIndex === vocabularies.length - 1 ? 'Xem kết quả' : 'Câu tiếp theo'} <ArrowRight className="w-4 h-4 ml-2" />
                     </Button>
                   )}
                </div>
              </div>

              {/* Explanation */}
              {showAnswer && currentQuestion.explanation && (
                <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 flex items-start space-x-4 animate-in fade-in slide-in-from-bottom duration-300">
                   <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                      <Lightbulb className="w-5 h-5 text-amber-600" />
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Lời giải chi tiết</p>
                      <p className="text-sm text-amber-900 font-medium leading-relaxed">{currentQuestion.explanation}</p>
                   </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 space-y-4">
               <XCircle className="w-12 h-12 text-gray-200 mx-auto" />
               <p className="text-gray-400 font-bold">Không tìm thấy câu hỏi khảo bài phù hợp.</p>
               <Button onClick={onClose} variant="outline" className="rounded-xl">Đóng cửa sổ</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
