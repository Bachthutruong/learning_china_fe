import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { 
  CheckCircle, 
  BookOpen, 
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { ReportErrorDialog } from './ReportErrorDialog'

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
  videoUrl?: string
  questions?: QuizQuestion[]
}

interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

interface VocabularyStudyCardProps {
  vocabulary: Vocabulary
  onStatusChange: any
  status?: 'learned' | 'studying' | 'skipped'
}

export const VocabularyStudyCard = ({
  vocabulary,
  onStatusChange,
  status
}: VocabularyStudyCardProps) => {
  const [showDetails, setShowDetails] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<number[]>([])
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
  
  useEffect(() => {
    const audioEl = audioRef.current
    if (!audioEl) return
    // In case metadata already loaded before handlers bind
    if (isFinite(audioEl.duration)) setDuration(audioEl.duration)
  }, [vocabulary.audioUrl])

  const formatTime = (timeSec: number) => {
    if (!isFinite(timeSec)) return '0:00'
    const minutes = Math.floor(timeSec / 60)
    const seconds = Math.floor(timeSec % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleSeekAtClientX = (clientX: number) => {
    if (!progressBarRef.current || !audioRef.current || duration === 0) return
    const rect = progressBarRef.current.getBoundingClientRect()
    const clamped = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const newTime = clamped * duration
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    handleSeekAtClientX(e.clientX)
  }
  
  // No audio controls; simplified view

  const handleStatusChange = (status: 'learned' | 'studying' | 'skipped') => {
    if (status === 'learned') {
      // Luôn yêu cầu khảo bài khi đánh dấu đã thuộc/học tiếp
      setShowQuiz(true)
      setQuizAnswers([])
      setQuizCompleted(false)
      setQuizScore(0)
      setCurrentQuizIndex(0)
      setShowAnswer(false)
      return
    }
    onStatusChange(status)
  }

  const handleQuizAnswer = (answerIndex: number) => {
    const newAnswers = [...quizAnswers]
    newAnswers[currentQuizIndex] = answerIndex
    setQuizAnswers(newAnswers)
  }

  const handleCheckAnswer = () => {
    setShowAnswer(true)
  }

  const handleNextQuiz = () => {
    setShowAnswer(false)
    if (currentQuizIndex < vocabulary.questions!.length - 1) {
      setCurrentQuizIndex(currentQuizIndex + 1)
    } else {
      // Calculate score
      const correctAnswers = vocabulary.questions!.filter((q, index) => 
        quizAnswers[index] === q.correctAnswer
      ).length
      const score = Math.round((correctAnswers / vocabulary.questions!.length) * 100)
      setQuizScore(score)
      setQuizCompleted(true)
    }
  }

  const handlePreviousQuiz = () => {
    setShowAnswer(false)
    if (currentQuizIndex > 0) {
      setCurrentQuizIndex(currentQuizIndex - 1)
    }
  }

  const handleFinishQuiz = async () => {
    setShowQuiz(false)
    // Chỉ đánh dấu "đã thuộc" nếu trả lời đúng tất cả câu hỏi
    if (quizScore === 100) {
      // Gọi onStatusChange để cập nhật trạng thái và nhận rewards
      await onStatusChange('learned')
    } else {
      // Nếu không đúng hết thì đánh dấu "cần học thêm"
      await onStatusChange('studying')
    }
  }

  const currentQuiz = vocabulary.questions?.[currentQuizIndex]

  return (
    <>
      <Card className="w-full max-w-5xl mx-auto border shadow-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <CardHeader className="px-6 py-10">
          <CardTitle className="text-6xl font-extrabold text-white text-center">
            {vocabulary.word}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 bg-transparent">
          {/* Actions: Học, Đã thuộc, Cần học thêm, Bỏ qua, Báo lỗi */}
          <div className="flex justify-center">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="sm"
                onClick={() => setShowDetails(true)}
                className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <BookOpen className="w-5 h-5 mr-1" />
                Học
              </Button>
              <Button
                size="sm"
                onClick={() => handleStatusChange('learned')}
                className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle className="w-5 h-5 mr-1" />
                {status === 'learned' ? 'Học tiếp' : 'Đã thuộc'}
              </Button>
              <Button
                size="sm"
                onClick={() => handleStatusChange('studying')}
                className="h-10 px-4 bg-orange-500 hover:bg-orange-600 text-white"
              >
                Cần học thêm
              </Button>
              <Button
                size="sm"
                onClick={() => handleStatusChange('skipped')}
                className="h-10 px-4 bg-gray-500 hover:bg-gray-600 text-white"
              >
                Bỏ qua
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowReport(true)}
                className="h-10 px-4 border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                Báo lỗi
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vocabulary Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl border-0 shadow-2xl bg-white">
          <div className="space-y-6 p-1">
            {/* Title card */}
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-blue-200">
              <div className="text-3xl font-bold text-gray-900">{vocabulary.word}</div>
              <div className="text-blue-700/80 mt-1">
                {vocabulary.pinyin} {vocabulary.zhuyin && `• ${vocabulary.zhuyin}`} • {vocabulary.partOfSpeech}
              </div>
            </div>

            {/* Media section: show image/video and audio if available */}
            {(vocabulary.imageUrl || (vocabulary as any).videoUrl) && (
              <div className="flex justify-center">
                {((vocabulary as any).videoUrl) ? (
                  <video
                    controls
                    src={(vocabulary as any).videoUrl as string}
                    className="w-full max-w-3xl rounded-lg border border-gray-200"
                  />
                ) : (
                  <img
                    src={vocabulary.imageUrl!}
                    alt={vocabulary.word}
                    className="max-w-full h-80 object-contain rounded-lg border border-gray-200"
                  />
                )}
              </div>
            )}

            {vocabulary.audioUrl && (
              <div className="flex flex-col items-center gap-3">
                <audio
                  ref={audioRef}
                  src={vocabulary.audioUrl}
                  preload="metadata"
                  onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
                  onDurationChange={() => setDuration(audioRef.current?.duration || 0)}
                  onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />
                <div className="w-full max-w-3xl">
                  <div className="p-1 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500">
                    <div className="flex items-center gap-4 rounded-xl px-4 py-3 bg-gradient-to-r from-purple-400 to-pink-400">
                      <button
                        onClick={handlePlayPause}
                        className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-white/30 hover:bg-white/40 text-white"
                        aria-label={isPlaying ? 'Pause' : 'Play'}
                      >
                        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                      </button>
                      <div className="flex-1 flex items-center gap-4">
                        <div
                          ref={progressBarRef}
                          className="relative h-3 w-full rounded-full bg-white/30 cursor-pointer"
                          onClick={handleSeekClick}
                        >
                          <div
                            className="absolute left-0 top-0 h-3 rounded-full bg-white/60"
                            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                          />
                          <div
                            className="absolute -top-1.5 h-6 w-6 rounded-full bg-blue-500 shadow border border-white"
                            style={{ left: `calc(${duration ? (currentTime / duration) * 100 : 0}% - 12px)` }}
                          />
                        </div>
                        <div className="shrink-0 text-white font-semibold tracking-wide">
                          {`${formatTime(currentTime)} / ${formatTime(duration)}`}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
              <h4 className="font-bold text-lg text-blue-800 mb-3">📖 Nghĩa:</h4>
              <p className="text-xl text-gray-800">{vocabulary.meaning}</p>
            </div>

            {vocabulary.examples.length > 0 && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <h4 className="font-bold text-lg text-green-800 mb-3">💡 Ví dụ:</h4>
                <ul className="space-y-2">
                  {vocabulary.examples.map((example, index) => (
                    <li key={index} className="text-gray-700 text-lg">• {example}</li>
                  ))}
                </ul>
              </div>
            )}

            {vocabulary.synonyms.length > 0 && (
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                <h4 className="font-bold text-lg text-purple-800 mb-3">🔗 Từ đồng nghĩa:</h4>
                <div className="flex flex-wrap gap-2">
                  {vocabulary.synonyms.map((synonym, index) => (
                    <Badge key={index} className="bg-purple-100 text-purple-700 border-purple-200">{synonym}</Badge>
                  ))}
                </div>
              </div>
            )}

            {vocabulary.antonyms.length > 0 && (
              <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
                <h4 className="font-bold text-lg text-orange-800 mb-3">⚡ Từ trái nghĩa:</h4>
                <div className="flex flex-wrap gap-2">
                  {vocabulary.antonyms.map((antonym, index) => (
                    <Badge key={index} className="bg-orange-100 text-orange-700 border-orange-200">{antonym}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4 p-1 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowDetails(false)}
              className="px-6 py-3 text-lg border-2 border-gray-300 hover:border-gray-400"
            >
              Đóng
            </Button>
            {/* <Button 
              onClick={() => {
                setShowDetails(false)
                handleStatusChange('studying')
              }}
              className="px-6 py-3 text-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              Thêm vào danh sách học
            </Button> */}
          </div>
        </DialogContent>
      </Dialog>

      <ReportErrorDialog
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        itemType="vocabulary"
        itemId={vocabulary._id}
        itemContent={vocabulary.word}
      />

      {/* Quiz Dialog */}
      <Dialog open={showQuiz} onOpenChange={setShowQuiz}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="text-center pb-4">
            <DialogTitle className="text-2xl font-bold text-gray-800">Khảo bài: {vocabulary.word}</DialogTitle>
            {vocabulary.questions && vocabulary.questions.length > 0 && (
              <DialogDescription className="text-gray-600">
                Câu {currentQuizIndex + 1}/{vocabulary.questions.length}
              </DialogDescription>
            )}
          </DialogHeader>

          {/* No-questions state: không cộng điểm, chỉ thông báo */}
          {(!vocabulary.questions || vocabulary.questions.length === 0) ? (
            <div className="text-center space-y-4 py-6">
              <div className="text-4xl">ℹ️</div>
              <div className="text-lg text-gray-700">
                Chưa có câu hỏi khảo bài cho từ này. Không thể cộng điểm khi học lại.
              </div>
              <Button onClick={() => setShowQuiz(false)} className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white">
                Đóng
              </Button>
            </div>
          ) : (
          !quizCompleted ? (
            <div className="space-y-4">
              {/* Question */}
              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="text-lg font-medium text-gray-800">
                  {currentQuiz?.question}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {currentQuiz?.options.map((option, index) => {
                  const isSelected = quizAnswers[currentQuizIndex] === index
                  const isCorrect = index === currentQuiz?.correctAnswer
                  const isWrong = isSelected && !isCorrect
                  
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      className={`w-full justify-start text-left h-auto py-3 ${
                        showAnswer 
                          ? isCorrect 
                            ? 'bg-green-100 border-green-500 text-green-800' 
                            : isWrong
                              ? 'bg-red-100 border-red-500 text-red-800'
                              : 'bg-gray-50 border-gray-200'
                          : isSelected
                            ? 'bg-blue-50 border-blue-300'
                            : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleQuizAnswer(index)}
                    >
                      <span className="mr-3 font-medium text-gray-600">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <span className="flex-1">{option}</span>
                      {showAnswer && isCorrect && (
                        <span className="ml-2 text-green-600 font-bold">✓</span>
                      )}
                      {showAnswer && isWrong && (
                        <span className="ml-2 text-red-600 font-bold">✗</span>
                      )}
                    </Button>
                  )
                })}
              </div>

              {/* Check Answer Button */}
              {!showAnswer && quizAnswers[currentQuizIndex] !== undefined && (
                <div className="text-center">
                  <Button
                    onClick={handleCheckAnswer}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white"
                  >
                    Kiểm tra
                  </Button>
                </div>
              )}

              {/* Answer Explanation */}
              {showAnswer && currentQuiz?.explanation && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <span className="font-medium">Giải thích:</span> {currentQuiz.explanation}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={handlePreviousQuiz}
                  disabled={currentQuizIndex === 0}
                  className="px-4 py-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Trước
                </Button>
                {showAnswer && (
                  <Button
                    onClick={handleNextQuiz}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {currentQuizIndex === vocabulary.questions!.length - 1 ? 'Kết thúc' : 'Tiếp theo'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4 py-6">
              {quizScore === 100 ? (
                <>
                  <div className="text-4xl">🎉</div>
                  <div className="text-4xl font-bold text-green-600">
                    {quizScore}%
                  </div>
                  <div className="text-xl font-semibold text-green-800">
                    Xuất sắc! Bạn đã thuộc từ này!
                  </div>
                  <div className="text-gray-600">
                    Trả lời đúng tất cả {vocabulary.questions!.length} câu hỏi
                  </div>
                </>
              ) : (
                <>
                  <div className="text-4xl">😔</div>
                  <div className="text-4xl font-bold text-orange-600">
                    {quizScore}%
                  </div>
                  <div className="text-xl font-semibold text-orange-800">
                    Chưa đạt yêu cầu
                  </div>
                  <div className="text-gray-600">
                    Cần trả lời đúng 100% để đánh dấu "đã thuộc"
                  </div>
                  <div className="text-sm text-gray-500">
                    Từ này sẽ được thêm vào danh sách "cần học thêm"
                  </div>
                </>
              )}
              <Button 
                onClick={handleFinishQuiz} 
                className={`px-6 py-3 ${
                  quizScore === 100 
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                }`}
              >
                {quizScore === 100 ? 'Hoàn thành' : 'Tiếp tục học'}
              </Button>
            </div>
          )
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
