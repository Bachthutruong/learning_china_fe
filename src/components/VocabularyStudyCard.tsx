import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { 
  Play, 
  Pause,
  CheckCircle, 
  BookOpen, 
  ArrowLeft,
  ArrowRight,
  // HelpCircle
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
  currentIndex: number
  totalCount: number
  status?: 'learned' | 'studying' | 'skipped'
}

export const VocabularyStudyCard = ({
  vocabulary,
  onStatusChange,
  currentIndex,
  totalCount,
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
  
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Audio control functions
  const handlePlayPause = async () => {
    if (!vocabulary.audioUrl) return

    if (!audioRef.current) {
      audioRef.current = new Audio(vocabulary.audioUrl)
      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current?.duration || 0)
      })
      audioRef.current.addEventListener('timeupdate', () => {
        setCurrentTime(audioRef.current?.currentTime || 0)
      })
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false)
        setCurrentTime(0)
      })
    }

    try {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        await audioRef.current.play()
        setIsPlaying(true)
      }
    } catch (error) {
      console.error('Error playing audio:', error)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const newTime = parseFloat(e.target.value)
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

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
      <Card className="w-full max-w-5xl mx-auto border shadow-lg bg-white">
        <CardHeader className="px-6 py-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-md">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-1">
              <Badge className="bg-white/20 text-white border-white/30">Cấp {vocabulary.level}</Badge>
              {vocabulary.topics.map((topic, index) => (
                <Badge key={index} className="bg-white/20 text-white border-white/30">{topic}</Badge>
              ))}
            </div>
            <div className="flex items-center gap-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
              <Play className="w-3 h-3" />
              <span className="font-semibold">{currentIndex + 1}/{totalCount}</span>
            </div>
          </div>

          <CardTitle className="mt-2 text-5xl font-extrabold text-white text-center">
            {vocabulary.word}
          </CardTitle>

          <div className="mt-1 flex items-center gap-2 justify-center">
            <span className="text-2xl text-purple-100">{vocabulary.pinyin}</span>
            {vocabulary.zhuyin && (
              <span className="text-base text-purple-200">({vocabulary.zhuyin})</span>
            )}
          </div>

          {/* Audio Player */}
          {vocabulary.audioUrl && (
            <div className="mt-3 bg-white/10 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handlePlayPause}
                  className="h-8 w-8 p-0 bg-white/20 hover:bg-white/30 text-white border-white/30 rounded-full"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                
                <div className="flex-1">
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #ffffff 0%, #ffffff ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) 100%)`,
                      WebkitAppearance: 'none',
                      appearance: 'none'
                    }}
                  />
                </div>
                
                <div className="text-xs text-white/80 font-mono min-w-[40px]">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>
            </div>
          )}

          <div className="mt-2 text-base text-purple-100 text-center">
            {vocabulary.partOfSpeech} • {vocabulary.meaning}
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-5 relative">
          {/* Compact actions at a corner */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setShowDetails(true)}
              className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <BookOpen className="w-4 h-4 mr-1" />
              Học
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowReport(true)}
              className="h-8 px-3 border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              Báo lỗi
            </Button>
          </div>

          {/* Image Display */}
          {vocabulary.imageUrl && (
            <div className="flex justify-center">
              <img 
                src={vocabulary.imageUrl} 
                alt={vocabulary.word}
                className="max-w-full h-80 object-contain rounded-lg border border-gray-200"
              />
            </div>
          )}

          {/* Video Display */}
          {(vocabulary.videoUrl || (vocabulary as any).videoUrl) && (
            <div className="flex justify-center">
              <video
                controls
                src={(vocabulary.videoUrl || (vocabulary as any).videoUrl) as string}
                className="w-full max-w-3xl rounded-lg border border-gray-200"
              />
            </div>
          )}

          {/* Centered meaning/examples block */}
          <div className="text-center">
            {vocabulary.examples.length > 0 && (
              <div className="text-sm text-gray-600">VD: {vocabulary.examples[0]}</div>
            )}
          </div>

          {/* Actions */}
          <div>
            <div className="text-center text-base font-semibold text-gray-700 mb-3">
              Bạn đã thuộc từ này chưa?
            </div>
            <div className="flex justify-center">
              <div className="flex items-center gap-3">
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
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vocabulary Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl border-0 shadow-2xl bg-gradient-to-br from-white to-blue-50">
          <DialogHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-lg p-6 -m-6 mb-6">
            <DialogTitle className="text-3xl font-bold text-white">{vocabulary.word}</DialogTitle>
            <DialogDescription className="text-blue-100 text-lg">
              {vocabulary.pinyin} {vocabulary.zhuyin && `• ${vocabulary.zhuyin}`} • {vocabulary.partOfSpeech}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 p-6">
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

          <div className="flex justify-end gap-4 p-6">
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
