import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { 
  ArrowLeft, 
  ArrowRight, 
  XCircle,
  RotateCcw,
  Trophy
} from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'

interface Vocabulary {
  _id: string
  word: string
  pronunciation: string
  meaning: string
  partOfSpeech: string
  level: number
  topics: string[]
  examples: string[]
  synonyms: string[]
  antonyms: string[]
  audio?: string
  audioUrl?: string
  questions?: QuizQuestion[]
}

interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: number
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
  const [answers, setAnswers] = useState<number[]>([])
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
    const newAnswers = [...answers]
    newAnswers[currentIndex] = answerIndex
    setAnswers(newAnswers)
  }

  const handleCheck = () => {
    if (answers[currentIndex] === undefined) return
    setShowAnswer(true)
  }

  const handleNext = () => {
    
    if (currentIndex < vocabularies.length - 1) {
      setShowAnswer(false)
      setCurrentIndex(currentIndex + 1)
    } else {
      // Calculate final score
      const correctAnswers = vocabularies.filter((vocab, index) => 
        answers[index] === vocab.questions![0].correctAnswer
      ).length
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
        const isCorrect = answers[index] === vocab.questions![0].correctAnswer
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center justify-between text-xl">
            <span>Khảo bài: {topicName}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <XCircle className="w-5 h-5" />
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2">Đang tải...</p>
            </div>
          ) : quizCompleted ? (
            <div className="text-center space-y-6">
              <div className="text-6xl">🎉</div>
              <div className="text-4xl font-bold text-green-600">
                {score}%
              </div>
              <div className="text-xl">
                {score >= 80 ? 'Xuất sắc!' : score >= 60 ? 'Tốt!' : 'Cần cải thiện!'}
              </div>
              <div className="text-gray-600">
                Bạn đã trả lời đúng {score}% câu hỏi
              </div>
              <div className="flex gap-2 justify-center">
                <Button onClick={handleRestart} variant="outline">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Làm lại
                </Button>
                <Button
                  onClick={async () => {
                    await persistResults()
                    onClose()
                  }}
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Hoàn thành
                </Button>
              </div>
            </div>
          ) : currentVocabulary && currentQuestion ? (
            <div className="space-y-6">
              {/* Progress */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Câu {currentIndex + 1}/{vocabularies.length}
                </div>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${((currentIndex + 1) / vocabularies.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Vocabulary word only (ẩn nghĩa và phiên âm) */}
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {currentVocabulary.word}
                </div>
              </div>

              {/* Question */}
              <div className="p-4 bg-gray-50 rounded-lg border mb-4">
                <div className="text-lg font-medium text-gray-800">
                  {currentQuestion.question}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = answers[currentIndex] === index
                  const isCorrect = index === currentQuestion.correctAnswer
                  const isWrong = isSelected && !isCorrect
                  
                  console.log('Rendering option:', index, 'isSelected:', isSelected, 'isCorrect:', isCorrect, 'isWrong:', isWrong, 'showAnswer:', showAnswer)
                  
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
                      onClick={() => handleAnswer(index)}
                      disabled={showAnswer}
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

              {/* Check button */}
              {!showAnswer && (
                <div className="text-right">
                  <Button
                    onClick={handleCheck}
                    disabled={answers[currentIndex] === undefined}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Kiểm tra
                  </Button>
                </div>
              )}

              {/* Answer Explanation */}
              {showAnswer && currentQuestion.explanation && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <span className="font-medium">Giải thích:</span> {currentQuestion.explanation}
                  </div>
                </div>
              )}

              {/* No auto countdown */}

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className="px-4 py-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Trước
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!showAnswer}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {currentIndex === vocabularies.length - 1 ? 'Kết thúc' : 'Tiếp theo'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p>Không có câu hỏi khảo bài</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
