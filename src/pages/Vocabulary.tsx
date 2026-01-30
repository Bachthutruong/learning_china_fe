import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { 
  BookOpen, 
  Target, 
  Brain, 
  TrendingUp,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  XCircle,
  Loader2,
  Flag,
  Plus
} from 'lucide-react'
import { api } from '../services/api'
import { ReportErrorDialog } from '../components/ReportErrorDialog'
import toast from 'react-hot-toast'

interface Vocabulary {
  _id: string
  word: string
  pinyin: string
  zhuyin?: string
  meaning: string
  level: number
  topics: string[]
  imageUrl?: string
  audio?: string
  examples: string[]
  synonyms: string[]
  antonyms: string[]
  partOfSpeech: string
  questions?: any[]
}

interface Topic {
  _id: string
  name: string
  description?: string
  color?: string
}

interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: string
  explanation?: string
}


export const Vocabulary = () => {
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [quizAnswers, setQuizAnswers] = useState<(string | number)[]>([])
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0)
  const [wordStatus, setWordStatus] = useState<'learning' | 'known' | 'needs-study' | 'skip'>('learning')
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [showTopicSelector, setShowTopicSelector] = useState(true)
  const [customKeywords, setCustomKeywords] = useState('')
  const [searchResults, setSearchResults] = useState<Vocabulary[]>([])
  const [selectedVocabularies, setSelectedVocabularies] = useState<string[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)

  const filteredVocabulary = selectedTopic 
    ? vocabularies.filter(word => word.topics.includes(selectedTopic))
    : vocabularies

  const currentWord = filteredVocabulary[currentWordIndex]

  useEffect(() => {
    fetchTopics()
    fetchVocabularies()
  }, [])

  useEffect(() => {
    if (selectedTopic) {
      fetchVocabularies(selectedTopic)
    }
  }, [selectedTopic])

  const fetchTopics = async () => {
    try {
      const response = await api.get('/vocabulary/topics')
      setTopics(response.data)
    } catch (error) {
      console.error('Failed to fetch topics:', error)
      toast.error('Không thể tải danh sách chủ đề')
    }
  }

  const fetchVocabularies = async (topic?: string) => {
    try {
      setLoading(true)
      const params = topic ? { topic, limit: 10 } : { limit: 10 }
      const response = await api.get('/vocabulary/suggested', { params })
      setVocabularies(response.data)
      setCurrentWordIndex(0)
      setShowTopicSelector(false)
    } catch (error) {
      console.error('Failed to fetch vocabularies:', error)
      toast.error('Không thể tải từ vựng')
    } finally {
      setLoading(false)
    }
  }

  const searchVocabulary = async () => {
    if (!customKeywords.trim()) return

    try {
      const response = await api.get(`/vocabulary/search?keywords=${encodeURIComponent(customKeywords)}`)
      setSearchResults(response.data.vocabularies)
    } catch (error) {
      console.error('Failed to search vocabulary:', error)
      toast.error('Không thể tìm kiếm từ vựng')
    }
  }

  const handlePlayAudio = () => {
    if (currentWord?.audio) {
      setIsPlaying(true)
      const audio = new Audio(currentWord.audio)
      audio.play()
      audio.onended = () => setIsPlaying(false)
    }
  }

  const handleNext = () => {
    if (currentWordIndex < filteredVocabulary.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1)
      setWordStatus('learning')
    }
  }

  const handlePrevious = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(currentWordIndex - 1)
      setWordStatus('learning')
    }
  }

  const handleWordStatus = async (status: 'known' | 'needs-study' | 'skip') => {
    if (status === 'known') {
      // Show quiz - 3 câu hỏi ngẫu nhiên
      try {
        const response = await api.get(`/vocabulary/${currentWord?._id}/quiz`)
        const questions = response.data.questions || []
        // Lấy tối đa 3 câu hỏi ngẫu nhiên
        const randomQuestions = questions
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.min(3, questions.length))
        
        setQuizQuestions(randomQuestions)
        setQuizAnswers([])
        setCurrentQuizIndex(0)
        setShowQuiz(true)
      } catch (error) {
        console.error('Failed to fetch quiz:', error)
        toast.error('Không thể tải câu hỏi')
      }
    } else {
      // Skip or mark as needs study
      setWordStatus(status)
      if (status === 'skip') {
        handleNext()
      } else {
        // Cập nhật trạng thái từ vựng
        try {
          await api.post('/vocabulary/update-status', {
            vocabularyId: currentWord?._id,
            status: status
          })
          toast.success('Đã cập nhật trạng thái từ vựng')
          handleNext()
        } catch (error) {
          console.error('Failed to update status:', error)
          toast.error('Không thể cập nhật trạng thái')
        }
      }
    }
  }



  const handleReset = () => {
    setCurrentWordIndex(0)
    setWordStatus('learning')
  }

  const handleQuizAnswer = (answerIndex: number) => {
    const newAnswers = [...quizAnswers]
    newAnswers[currentQuizIndex] = answerIndex
    setQuizAnswers(newAnswers)

    if (currentQuizIndex < quizQuestions.length - 1) {
      setCurrentQuizIndex(currentQuizIndex + 1)
    } else {
      // Submit quiz
      completeQuiz(newAnswers)
    }
  }

  const completeQuiz = async (answers: (string | number)[]) => {
    try {
      // Kiểm tra đáp án
      let correctCount = 0
      for (let i = 0; i < answers.length; i++) {
        if (quizQuestions[i] && answers[i] === quizQuestions[i].correctAnswer) {
          correctCount++
        }
      }

      const allCorrect = correctCount === answers.length

      if (allCorrect) {
        // Đúng hết 3 câu - +0.5 điểm +0.5 xu
        await api.post('/vocabulary/complete', {
          vocabularyId: currentWord?._id,
          status: 'known',
          reward: true
        })
        toast.success('Chúc mừng! Bạn đã học thuộc từ này! (+0.5 điểm, +0.5 xu)')
      } else {
        // Sai - thêm vào danh sách cần học
        await api.post('/vocabulary/update-status', {
          vocabularyId: currentWord?._id,
          status: 'needs-study'
        })
        toast.error('Bạn cần học thêm từ này')
      }

      setShowQuiz(false)
      setWordStatus(allCorrect ? 'known' : 'needs-study')
      
      // Tự động chuyển sang từ tiếp theo sau 2 giây
      setTimeout(() => {
        handleNext()
        // Tự động thêm từ mới nếu còn ít từ trong danh sách
        if (vocabularies.length - currentWordIndex <= 2) {
          addMoreWords()
        }
      }, 2000)
    } catch (error) {
      console.error('Failed to complete quiz:', error)
      toast.error('Không thể hoàn thành bài kiểm tra')
    }
  }

  const addMoreWords = async () => {
    try {
      const params = selectedTopic ? { topic: selectedTopic, limit: 5 } : { limit: 5 }
      const response = await api.get('/vocabulary/suggested', { params })
      const newWords = response.data.filter((newWord: any) => 
        !vocabularies.some(existing => existing._id === newWord._id)
      )
      if (newWords.length > 0) {
        setVocabularies(prev => [...prev, ...newWords])
        toast.success(`Đã thêm ${newWords.length} từ vựng mới`)
      }
    } catch (error) {
      console.error('Failed to add more words:', error)
    }
  }

  const addVocabularyToLearning = async (vocabularyIds: string[]) => {
    try {
      await api.post('/vocabulary/add-to-learning', {
        vocabularyIds
      })
      toast.success('Đã thêm từ vựng vào danh sách học tập')
      setShowAddDialog(false)
      // Thêm từ vựng vào danh sách hiện tại
      const newVocabularies = await api.get('/vocabulary/suggested')
      setVocabularies(newVocabularies.data)
    } catch (error) {
      console.error('Failed to add vocabulary:', error)
      toast.error('Không thể thêm từ vựng')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Đang tải từ vựng...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
           <div className="inline-flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-primary text-xs font-bold uppercase tracking-widest">Từ vựng hệ thống</span>
           </div>
           <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
              Khám phá <span className="text-primary">Hán ngữ</span>
           </h1>
           <p className="text-gray-500 font-medium">
              Tra cứu và học tập kho từ vựng khổng lồ được phân loại theo trình độ HSK mới nhất.
           </p>
           
           <div className="flex justify-center pt-4">
              <Button
                onClick={() => setShowAddDialog(true)}
                className="chinese-gradient h-12 px-8 rounded-2xl font-black shadow-lg shadow-primary/20 hover:shadow-primary/30 transform hover:-translate-y-1 transition-all"
              >
                <Plus className="w-5 h-5 mr-2" />
                Thêm từ mới vào kho cá nhân
              </Button>
           </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
           {/* Sidebar: Categories & Progress */}
           <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl space-y-6">
                 <h3 className="text-xl font-black text-gray-900 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-primary" />
                    Chủ đề
                 </h3>
                 <div className="space-y-2">
                    <button
                      onClick={() => setSelectedTopic(null)}
                      className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                        selectedTopic === null ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                       Tất cả từ vựng
                    </button>
                    {topics.map((topic) => (
                      <button
                        key={topic._id}
                        onClick={() => setSelectedTopic(topic.name)}
                        className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                          selectedTopic === topic.name ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                         <div className={`w-2 h-2 rounded-full mr-3 ${topic.color || 'bg-blue-400'}`} />
                         {topic.name}
                      </button>
                    ))}
                 </div>
              </div>

              <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl space-y-4">
                 <h3 className="text-xl font-black text-gray-900 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                    Tiến độ đợt
                 </h3>
                 <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                       <span>Đã xem</span>
                       <span>{currentWordIndex + 1} / {filteredVocabulary.length}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                       <div 
                         className="h-full chinese-gradient transition-all duration-500"
                         style={{ width: `${(currentWordIndex + 1) / filteredVocabulary.length * 100}%` }}
                       />
                    </div>
                 </div>
              </div>
           </div>

           {/* Main Learning Card */}
           <div className="lg:col-span-3">
              {currentWord && !showQuiz ? (
                <div className="bg-white rounded-[3rem] p-12 md:p-20 border border-gray-100 shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-64 h-64 chinese-gradient opacity-5 rounded-bl-[8rem]" />
                   
                   <div className="relative z-10 text-center space-y-10">
                      <div className="space-y-4">
                         <div className="flex justify-center space-x-2">
                            <Badge className="bg-primary/10 text-primary border-primary/20 rounded-lg px-3 py-1 font-black text-[10px] uppercase tracking-widest">
                               HSK Cấp {currentWord.level}
                            </Badge>
                            {currentWord.partOfSpeech && (
                              <Badge variant="outline" className="text-[10px] font-bold uppercase text-gray-400 rounded-lg">
                                 {currentWord.partOfSpeech}
                              </Badge>
                            )}
                         </div>
                         <h2 className="text-8xl md:text-9xl font-black text-gray-900 tracking-tight">{currentWord.word}</h2>
                         <p className="text-2xl md:text-3xl font-bold text-primary italic uppercase tracking-[0.2em]">{currentWord.pinyin}</p>
                      </div>

                      {currentWord.imageUrl && (
                        <div className="flex justify-center">
                           <img 
                             src={currentWord.imageUrl} 
                             alt={currentWord.word}
                             className="h-64 object-cover rounded-[2rem] shadow-2xl border-4 border-white ring-1 ring-gray-100"
                           />
                        </div>
                      )}

                      <div className="pt-8 border-t border-gray-50 flex flex-col items-center space-y-8">
                         <div className="space-y-2">
                            <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Bạn đã thuộc từ này chưa?</p>
                            <div className="flex flex-wrap justify-center gap-4">
                               <Button
                                 onClick={() => handleWordStatus('known')}
                                 className="h-14 px-8 chinese-gradient text-white rounded-2xl font-black shadow-xl shadow-primary/20 transform hover:-translate-y-1 transition-all"
                               >
                                 <CheckCircle className="w-5 h-5 mr-2" /> Đã thuộc
                               </Button>
                               <Button
                                 onClick={() => handleWordStatus('needs-study')}
                                 variant="outline"
                                 className="h-14 px-8 border-2 border-amber-100 text-amber-600 hover:bg-amber-50 rounded-2xl font-black"
                               >
                                 <Brain className="w-5 h-5 mr-2" /> Cần học thêm
                               </Button>
                               <Button
                                 onClick={() => handleWordStatus('skip')}
                                 variant="ghost"
                                 className="h-14 px-8 font-bold text-gray-400 rounded-2xl hover:bg-gray-50"
                               >
                                 <XCircle className="w-5 h-5 mr-2" /> Bỏ qua
                               </Button>
                            </div>
                         </div>

                         {currentWord.audio && (
                           <Button
                             onClick={handlePlayAudio}
                             disabled={isPlaying}
                             className="w-16 h-16 rounded-full bg-gray-900 text-white flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
                           >
                             {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                           </Button>
                         )}
                      </div>
                   </div>
                </div>
              ) : showQuiz ? (
                <div className="bg-white rounded-[2.5rem] p-12 border border-gray-100 shadow-xl space-y-8 text-center">
                   <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Brain className="w-8 h-8 text-primary" />
                   </div>
                   <h3 className="text-3xl font-black text-gray-900">Khảo bài nhanh</h3>
                   <p className="text-gray-500 font-medium">Câu {currentQuizIndex + 1} / {quizQuestions.length}</p>
                   
                   <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 mb-8">
                      <p className="text-xl font-bold text-gray-900">{quizQuestions[currentQuizIndex]?.question}</p>
                   </div>

                   <div className="grid gap-3">
                      {quizQuestions[currentQuizIndex]?.options.map((option, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleQuizAnswer(idx)}
                          className="w-full flex items-center p-5 rounded-2xl border-2 border-gray-100 hover:border-primary hover:bg-primary/5 transition-all group"
                        >
                           <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-400 font-black text-xs flex items-center justify-center mr-4 group-hover:bg-primary group-hover:text-white transition-colors">
                              {String.fromCharCode(65 + idx)}
                           </div>
                           <span className="font-bold text-gray-600 group-hover:text-gray-900">{option}</span>
                        </button>
                      ))}
                   </div>
                </div>
              ) : (
                <div className="bg-white p-20 rounded-[3rem] border border-gray-100 shadow-sm text-center space-y-6">
                   <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                      <BookOpen className="w-10 h-10" />
                   </div>
                   <div className="space-y-2">
                      <h3 className="text-2xl font-black text-gray-900">Kho từ vựng đang trống</h3>
                      <p className="text-gray-500 font-medium">Vui lòng chọn một chủ đề bên cạnh hoặc thêm từ mới để bắt đầu học.</p>
                   </div>
                </div>
              )}

              {/* Navigation Controls */}
              {currentWord && !showQuiz && (
                <div className="flex items-center justify-between mt-8">
                   <Button
                     onClick={handlePrevious}
                     disabled={currentWordIndex === 0}
                     variant="ghost"
                     className="rounded-xl font-bold text-gray-400 h-12"
                   >
                      <RotateCcw className="mr-2 h-4 w-4" /> Quay lại từ trước
                   </Button>
                   
                   <Button
                     onClick={handleNext}
                     disabled={currentWordIndex === filteredVocabulary.length - 1}
                     className="bg-gray-900 text-white h-12 px-8 rounded-xl font-black hover:bg-black transition-all"
                   >
                      Từ tiếp theo <Play className="ml-2 h-4 w-4 fill-current" />
                   </Button>
                </div>
              )}
           </div>
        </div>
      </div>

      {/* Add Vocabulary Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Thêm từ vựng mới</DialogTitle>
            <DialogDescription>
              Tìm kiếm và thêm từ vựng vào danh sách học tập
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Custom Search */}
            <div>
              <Label htmlFor="keywords">Tìm kiếm từ khóa</Label>
              <div className="flex gap-2">
                <Input
                  id="keywords"
                  placeholder="Nhập từ khóa để tìm kiếm..."
                  value={customKeywords}
                  onChange={(e) => setCustomKeywords(e.target.value)}
                />
                <Button onClick={searchVocabulary} disabled={!customKeywords.trim()}>
                  Tìm kiếm
                </Button>
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold">Kết quả tìm kiếm:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto">
                  {searchResults.map((vocab: Vocabulary) => (
                    <Card key={vocab._id} className="cursor-pointer hover:bg-gray-50">
                      <CardContent
                        className="p-4"
                        onClick={() => {
                          if (selectedVocabularies.includes(vocab._id)) {
                            setSelectedVocabularies(selectedVocabularies.filter(id => id !== vocab._id));
                          } else {
                            setSelectedVocabularies([...selectedVocabularies, vocab._id]);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-semibold">{vocab.word}</h5>
                            <p className="text-sm text-gray-600">{vocab.meaning}</p>
                            <p className="text-xs text-gray-500">{vocab.pinyin}</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={selectedVocabularies.includes(vocab._id)}
                            onChange={() => {}}
                            className="w-4 h-4"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {selectedVocabularies.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => addVocabularyToLearning(selectedVocabularies)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Thêm {selectedVocabularies.length} từ đã chọn
                    </Button>
                    <Button
                      onClick={() => setSelectedVocabularies([])}
                      variant="outline"
                    >
                      Bỏ chọn tất cả
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Error Dialog */}
      <ReportErrorDialog
        isOpen={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        itemType="vocabulary"
        itemId={currentWord?._id || ''}
        itemContent={currentWord?.word || ''}
      />
    </div>
  )
}
