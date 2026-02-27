import { useEffect, useRef, useState } from 'react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { 
  CheckCircle, 
  BookOpen, 
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
  Brain,
  Lightbulb,
  Trophy,
  Star
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { ReportErrorDialog } from './ReportErrorDialog'

interface Vocabulary {
  _id: string
  word: string
  pinyin: string
  meaning: string
  partOfSpeech: string
  level: number
  topics: string[]
  examples: string[]
  synonyms: string[]
  antonyms: string[]
  imageUrl?: string
  audioUrl?: string
  questions?: QuizQuestion[]
}

interface QuizQuestion {
  question: string
  options: string[]
  // Backend cho phép correctAnswer là number | number[]
  correctAnswer: number | number[]
  explanation?: string
}

interface VocabularyStudyCardProps {
  vocabulary: Vocabulary
  onStatusChange: (status: 'learned' | 'studying' | 'skipped') => Promise<void>
  status?: 'learned' | 'studying' | 'skipped'
}

export const VocabularyStudyCard = ({
  vocabulary,
  onStatusChange,
  status
}: VocabularyStudyCardProps) => {
  const [showDetails, setShowDetails] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  // Mỗi phần tử là danh sách index đáp án đã chọn cho 1 câu hỏi
  const [quizAnswers, setQuizAnswers] = useState<number[][]>([])
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [quizScore, setQuizScore] = useState(0)
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const progressBarRef = useRef<HTMLDivElement | null>(null)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  const handlePlayPause = async () => {
    if (!audioRef.current) return
    try {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        await audioRef.current.play()
        setIsPlaying(true)
      }
    } catch {}
  }

  useEffect(() => {
    if (!showDetails && audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
    }
  }, [showDetails])
  
  const formatTime = (timeSec: number) => {
    if (!isFinite(timeSec)) return '0:00'
    const minutes = Math.floor(timeSec / 60)
    const seconds = Math.floor(timeSec % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !audioRef.current || duration === 0) return
    const rect = progressBarRef.current.getBoundingClientRect()
    const clamped = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const newTime = clamped * duration
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleStatusChange = (newStatus: 'learned' | 'studying' | 'skipped') => {
    if (newStatus === 'learned') {
      setShowQuiz(true)
      setQuizAnswers([])
      setQuizCompleted(false)
      setQuizScore(0)
      setCurrentQuizIndex(0)
      setShowAnswer(false)
      return
    }
    onStatusChange(newStatus)
  }

  const handleQuizAnswer = (answerIndex: number) => {
    if (!vocabulary.questions || !vocabulary.questions[currentQuizIndex]) return

    const question = vocabulary.questions[currentQuizIndex]
    const isMulti = Array.isArray(question.correctAnswer)

    const newAnswers = [...quizAnswers]
    const currentSelected = newAnswers[currentQuizIndex]
      ? [...newAnswers[currentQuizIndex]]
      : []

    if (isMulti) {
      // Câu hỏi nhiều đáp án: toggle chọn/bỏ chọn
      if (currentSelected.includes(answerIndex)) {
        newAnswers[currentQuizIndex] = currentSelected.filter((i) => i !== answerIndex)
      } else {
        newAnswers[currentQuizIndex] = [...currentSelected, answerIndex]
      }
    } else {
      // Câu hỏi 1 đáp án: chỉ giữ 1 lựa chọn
      newAnswers[currentQuizIndex] = [answerIndex]
    }

    setQuizAnswers(newAnswers)
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

  const handleNextQuiz = () => {
    setShowAnswer(false)
    if (currentQuizIndex < vocabulary.questions!.length - 1) {
      setCurrentQuizIndex(currentQuizIndex + 1)
    } else {
      const correctAnswers = vocabulary.questions!.filter((q, index) => {
        const selected = quizAnswers[index] || []
        return isUserAnswerCorrect(q, selected)
      }).length
      const score = Math.round((correctAnswers / vocabulary.questions!.length) * 100)
      setQuizScore(score)
      setQuizCompleted(true)
    }
  }

  const handleFinishQuiz = async () => {
    setShowQuiz(false)
    const hasNoQuestions = !vocabulary.questions || vocabulary.questions.length === 0
    if (hasNoQuestions || quizScore === 100) {
      await onStatusChange('learned')
    } else {
      await onStatusChange('studying')
    }
  }

  const currentQuiz = vocabulary.questions?.[currentQuizIndex]

  return (
    <>
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden relative group">
           <div className="absolute top-0 right-0 w-64 h-64 chinese-gradient opacity-5 rounded-bl-[8rem]" />
           
           <div className="p-12 md:p-20 text-center space-y-12">
              <div className="space-y-4 animate-in fade-in zoom-in duration-700">
                 <h2 className="text-8xl md:text-9xl font-black text-gray-900 tracking-tight">{vocabulary.word}</h2>
                 <p className="text-2xl md:text-3xl font-bold text-primary italic font-serif uppercase tracking-widest">{vocabulary.pinyin}</p>
              </div>

              <div className="flex flex-wrap justify-center gap-4">
                 <Button size="lg" onClick={() => setShowDetails(true)} className="h-14 px-8 bg-gray-900 text-white rounded-2xl font-black shadow-xl hover:bg-black transition-all">
                   <BookOpen className="w-5 h-5 mr-2" /> Khám phá chi tiết
                 </Button>
                 <Button size="lg" onClick={() => handleStatusChange('learned')} className="h-14 px-8 chinese-gradient text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:shadow-primary/30 transform hover:-translate-y-1 transition-all">
                   <CheckCircle className="w-5 h-5 mr-2" /> {status === 'learned' ? 'Ôn tập lại' : 'Tôi đã thuộc từ này'}
                 </Button>
              </div>

              <div className="flex flex-wrap justify-center gap-3 pt-4">
                 <Button variant="ghost" onClick={() => handleStatusChange('studying')} className="rounded-xl font-bold text-orange-600 hover:bg-orange-50">Cần học thêm</Button>
                 <Button variant="ghost" onClick={() => handleStatusChange('skipped')} className="rounded-xl font-bold text-gray-400 hover:bg-gray-50">Bỏ qua từ này</Button>
                 <Button variant="ghost" onClick={() => setShowReport(true)} className="rounded-xl font-bold text-red-400 hover:bg-red-50">Báo lỗi</Button>
              </div>
           </div>

           <div className="bg-gray-50/50 p-6 border-t border-gray-100 flex justify-between items-center px-12">
              <div className="flex items-center space-x-2">
                 <Badge className="bg-primary/10 text-primary border-primary/20 rounded-lg px-3 py-1 font-black text-[10px] uppercase tracking-widest">Level {vocabulary.level}</Badge>
                 <Badge variant="outline" className="rounded-lg px-3 py-1 font-bold text-[10px] uppercase tracking-widest text-gray-400">{vocabulary.partOfSpeech}</Badge>
              </div>
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Jiudi Learning System</p>
           </div>
        </div>
      </div>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="chinese-gradient p-8 md:p-12 text-white relative">
             <div className="relative z-10 space-y-2">
                <h3 className="text-5xl font-black">{vocabulary.word}</h3>
                <div className="flex items-center space-x-4 opacity-90 font-bold">
                   <span className="text-xl tracking-widest uppercase">{vocabulary.pinyin}</span>
                   <span className="w-1.5 h-1.5 bg-white/50 rounded-full" />
                   <span className="text-lg">{vocabulary.partOfSpeech}</span>
                </div>
             </div>
          </div>

          <div className="p-8 md:p-12 space-y-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {vocabulary.imageUrl && (
              <div className="flex justify-center group">
                <img src={vocabulary.imageUrl} alt={vocabulary.word} className="max-w-full h-80 object-cover rounded-[2rem] shadow-2xl border-4 border-white ring-1 ring-gray-100" />
              </div>
            )}

            {vocabulary.audioUrl && (
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex items-center space-x-6">
                <button onClick={handlePlayPause} className="w-16 h-16 rounded-2xl chinese-gradient flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform shrink-0">
                  {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 fill-current" />}
                </button>
                <div className="flex-1 space-y-2">
                   <div className="flex justify-between text-[10px] font-black uppercase text-gray-400"><span>Phát âm mẫu</span><span className="font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span></div>
                   <div ref={progressBarRef} onClick={handleSeekClick} className="h-2 bg-gray-200 rounded-full overflow-hidden cursor-pointer">
                      <div className="h-full chinese-gradient transition-all duration-100" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
                   </div>
                </div>
                <audio ref={audioRef} src={vocabulary.audioUrl} onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)} onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)} onEnded={() => setIsPlaying(false)} className="hidden" />
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <h4 className="text-sm font-black uppercase text-primary flex items-center"><span className="w-6 h-0.5 bg-primary mr-2" /> Nghĩa của từ</h4>
                  <p className="text-2xl font-bold text-gray-900">{vocabulary.meaning}</p>
               </div>
               {vocabulary.examples.length > 0 && (
                 <div className="space-y-4">
                    <h4 className="text-sm font-black uppercase text-blue-600 flex items-center"><span className="w-6 h-0.5 bg-blue-600 mr-2" /> Ví dụ minh họa</h4>
                    <ul className="space-y-3">{vocabulary.examples.map((ex, i) => <li key={i} className="text-sm text-gray-600 font-medium bg-blue-50/50 p-3 rounded-xl border border-blue-50">{ex}</li>)}</ul>
                 </div>
               )}
            </div>
          </div>

          <div className="p-8 border-t border-gray-100 flex justify-end">
            <Button variant="outline" onClick={() => setShowDetails(false)} className="h-12 px-8 rounded-xl font-bold border-2 border-gray-100 hover:border-primary hover:text-primary transition-all">Đóng cửa sổ</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ReportErrorDialog isOpen={showReport} onClose={() => setShowReport(false)} itemType="vocabulary" itemId={vocabulary._id} itemContent={vocabulary.word} />

      <Dialog open={showQuiz} onOpenChange={setShowQuiz}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] p-10 border-none shadow-2xl">
          <DialogHeader className="text-center space-y-4 mb-8">
             <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto"><Brain className="w-8 h-8 text-primary" /></div>
             <DialogTitle className="text-3xl font-black">Kiểm tra: {vocabulary.word}</DialogTitle>
             {vocabulary.questions && (
               <div className="space-y-1">
                 <p className="text-xs font-black uppercase text-gray-400">
                   Câu hỏi {currentQuizIndex + 1} của {vocabulary.questions.length}
                 </p>
                 {currentQuiz && Array.isArray(currentQuiz.correctAnswer) && currentQuiz.correctAnswer.length > 1 && (
                   <p className="text-[10px] font-black uppercase text-amber-600">
                     Dạng: Chọn <span className="underline">nhiều đáp án đúng</span>
                   </p>
                 )}
               </div>
             )}
          </DialogHeader>

          {(!vocabulary.questions || vocabulary.questions.length === 0) ? (
            <div className="text-center py-10 space-y-6">
              <p className="text-gray-500 font-medium italic">Từ vựng này chưa có dữ liệu khảo bài. Bạn có thể đánh dấu thuộc ngay.</p>
              <Button onClick={handleFinishQuiz} className="chinese-gradient h-14 px-10 rounded-2xl font-black text-white shadow-xl">Xác nhận đã thuộc</Button>
            </div>
          ) : !quizCompleted ? (
            <div className="space-y-8">
              <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
                <p className="text-xl font-bold text-gray-900 text-center">{currentQuiz?.question}</p>
              </div>
              <div className="grid gap-3">
                {currentQuiz?.options.map((option, index) => {
                  const selectedForCurrent = quizAnswers[currentQuizIndex] || []
                  const isSelected = selectedForCurrent.includes(index)

                  const correctRaw = currentQuiz.correctAnswer
                  const correctIndices = Array.isArray(correctRaw) ? correctRaw : [correctRaw]
                  const isCorrect = showAnswer && correctIndices.includes(index)
                  const isWrong = showAnswer && isSelected && !isCorrect

                  return (
                    <button
                      key={index}
                      disabled={showAnswer}
                      onClick={() => handleQuizAnswer(index)}
                      className={`flex items-center p-5 rounded-2xl border-2 transition-all text-left ${
                        isCorrect
                          ? 'border-green-500 bg-green-50'
                          : isWrong
                            ? 'border-red-500 bg-red-50'
                            : isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-100 hover:bg-gray-50'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm mr-4 shrink-0 ${
                          isCorrect
                            ? 'bg-green-500 text-white'
                            : isWrong
                              ? 'bg-red-500 text-white'
                              : isSelected
                                ? 'chinese-gradient text-white'
                                : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span
                        className={`font-bold ${
                          isSelected || isCorrect ? 'text-gray-900' : 'text-gray-500'
                        }`}
                      >
                        {option}
                      </span>
                      {isCorrect && <CheckCircle className="ml-auto w-5 h-5 text-green-500" />}
                    </button>
                  )
                })}
              </div>
              {showAnswer && currentQuiz?.explanation && (
                <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 flex items-start space-x-3">
                   <Lightbulb className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                   <p className="text-xs text-blue-900 font-medium leading-relaxed">{currentQuiz.explanation}</p>
                </div>
              )}
              <div className="flex justify-between items-center pt-4">
                <Button
                  variant="ghost"
                  onClick={() => currentQuizIndex > 0 && setCurrentQuizIndex(currentQuizIndex - 1)}
                  disabled={currentQuizIndex === 0}
                  className="rounded-xl font-bold text-gray-400"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
                </Button>
                {!showAnswer ? (
                  <Button
                    disabled={!quizAnswers[currentQuizIndex] || quizAnswers[currentQuizIndex].length === 0}
                    onClick={() => setShowAnswer(true)}
                    className="chinese-gradient h-12 px-8 rounded-xl font-black text-white shadow-lg"
                  >
                    Kiểm tra đáp án
                  </Button>
                ) : (
                  <Button
                    onClick={handleNextQuiz}
                    className="chinese-gradient h-12 px-8 rounded-xl font-black text-white shadow-lg"
                  >
                    {currentQuizIndex === vocabulary.questions!.length - 1 ? 'Xem kết quả' : 'Câu tiếp theo'}{' '}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center space-y-8 py-10">
              <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl ${quizScore === 100 ? 'chinese-gradient' : 'bg-orange-500'} text-white`}>
                 {quizScore === 100 ? <Trophy className="w-12 h-12" /> : <Star className="w-12 h-12" />}
              </div>
              <div className="space-y-2">
                 <div className={`text-6xl font-black ${quizScore === 100 ? 'text-green-600' : 'text-orange-600'}`}>{quizScore}%</div>
                 <h4 className="text-2xl font-black text-gray-900">{quizScore === 100 ? 'Xuất sắc! Đã thuộc từ.' : 'Cần ôn tập thêm!'}</h4>
                 <p className="text-gray-500 font-medium">
                   Bạn đã trả lời đúng{' '}
                   {vocabulary.questions!.filter((q, i) => {
                     const selected = quizAnswers[i] || []
                     return isUserAnswerCorrect(q, selected)
                   }).length}
                   /{vocabulary.questions!.length} câu hỏi.
                 </p>
              </div>
              <Button onClick={handleFinishQuiz} className={`w-full h-14 rounded-2xl font-black text-lg shadow-xl transition-all ${quizScore === 100 ? 'chinese-gradient text-white shadow-primary/20 hover:shadow-primary/30' : 'bg-gray-900 text-white hover:bg-black'}`}>{quizScore === 100 ? 'Hoàn thành bài khảo' : 'Tiếp tục luyện tập'}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}