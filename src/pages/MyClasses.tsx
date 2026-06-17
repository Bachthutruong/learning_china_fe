import { useEffect, useMemo, useState } from 'react'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Pagination } from '../components/Pagination'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import {
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileQuestion,
  GraduationCap,
  Link as LinkIcon,
  Loader2,
  MessageSquare,
  Send,
  UserMinus
} from 'lucide-react'

interface UserInfo {
  _id: string
  name: string
  email: string
}

interface ClassQuestion {
  _id: string
  questionType?: string
  question: string
  options?: string[]
  correctAnswer?: any
  explanation?: string
  passage?: string
  sentences?: string[]
  correctOrder?: number[]
  subQuestions?: Array<{ question: string; options: string[]; correctAnswer: number }>
  vocabularyWord?: string
}

interface ClassSession {
  _id: string
  title: string
  startAt: string
  endAt: string
  googleMeetLink?: string
  content?: string
  vocabularyIds: Array<{ _id: string; word: string; pinyin: string; meaning: string; questions?: any[] }>
  exercises: ClassQuestion[]
  vocabularyQuizQuestions: ClassQuestion[]
  vocabularyDeadline: string
  exerciseDeadline: string
  feedbackDeadline: string
  myFeedback?: any | null
  myLeaveRequest?: any | null
  latestVocabularySubmission?: any | null
  latestExerciseSubmission?: any | null
}

interface MyClass {
  _id: string
  name: string
  description?: string
  capacity: number
  tuitionFee: number
  groupLink?: string
  teacherIds: UserInfo[]
  stats: {
    attendedSessions: number
    totalSessions: number
    finishedSessions: number
  }
  sessions: ClassSession[]
}

const emptyFeedback = {
  attendanceChoice: 'full',
  attendanceReason: '',
  understandingPercent: 80,
  lessonDifficulty: 'just_right',
  vocabularyMemory: 'partial',
  grammarUnderstanding: 'partial',
  teacherRating: 5,
  unansweredQuestions: '',
  satisfactionRating: 5,
  additionalComment: ''
}

const formatDateTime = (value?: string) => {
  if (!value) return 'Chưa đặt'
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

const isBefore = (value: string) => new Date() < new Date(value)
const isAfter = (value: string) => new Date() > new Date(value)

const ATTENDANCE_LABELS: Record<string, string> = {
  full: 'Tham gia đầy đủ',
  partial: 'Vào muộn / rời sớm',
  absent: 'Không tham gia'
}
const DIFFICULTY_LABELS: Record<string, string> = {
  too_easy: 'Quá dễ',
  just_right: 'Vừa sức',
  a_bit_hard: 'Hơi khó',
  very_hard: 'Rất khó'
}
const VOCAB_MEMORY_LABELS: Record<string, string> = {
  good: 'Nhớ tốt',
  partial: 'Nhớ một phần',
  weak: 'Chưa nhớ nhiều',
  need_review: 'Cần ôn lại'
}
const GRAMMAR_LABELS: Record<string, string> = {
  clear: 'Hiểu rõ',
  partial: 'Hiểu một phần',
  unclear: 'Chưa hiểu',
  need_reteach: 'Cần giảng lại'
}
const CONFIRMATION_LABELS: Record<string, string> = {
  pending: 'Chưa xác nhận',
  present: 'Có mặt',
  absent: 'Vắng',
  excused: 'Được nghỉ'
}
const FEEDBACK_STATUS_LABELS: Record<string, string> = {
  submitted: 'Đã gửi',
  teacher_seen: 'GV đã xem',
  needs_action: 'Cần xử lý',
  resolved: 'Đã xử lý'
}

export const MyClasses = () => {
  const [classes, setClasses] = useState<MyClass[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [loading, setLoading] = useState(true)
  const [feedbackSession, setFeedbackSession] = useState<ClassSession | null>(null)
  const [feedbackForm, setFeedbackForm] = useState(emptyFeedback)
  const [leaveSession, setLeaveSession] = useState<ClassSession | null>(null)
  const [leaveReason, setLeaveReason] = useState('')
  const [quiz, setQuiz] = useState<{ session: ClassSession; type: 'vocabulary' | 'exercise' } | null>(null)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [submitting, setSubmitting] = useState(false)
  const [sessionPage, setSessionPage] = useState(1)
  const [sessionPageSize, setSessionPageSize] = useState(5)

  useEffect(() => {
    fetchClasses()
  }, [])

  // Reset session pagination when switching class
  useEffect(() => { setSessionPage(1) }, [selectedClassId])

  const fetchClasses = async () => {
    try {
      setLoading(true)
      const res = await api.get('/classes/my')
      const items = res.data.classes || []
      setClasses(items)
      if (!selectedClassId && items[0]) setSelectedClassId(items[0]._id)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể tải lớp học')
    } finally {
      setLoading(false)
    }
  }

  const selectedClass = useMemo(
    () => classes.find(item => item._id === selectedClassId) || classes[0] || null,
    [classes, selectedClassId]
  )

  const openFeedback = (session: ClassSession) => {
    setFeedbackSession(session)
    setFeedbackForm({
      attendanceChoice: session.myFeedback?.attendanceChoice || 'full',
      attendanceReason: session.myFeedback?.attendanceReason || '',
      understandingPercent: session.myFeedback?.understandingPercent || 80,
      lessonDifficulty: session.myFeedback?.lessonDifficulty || 'just_right',
      vocabularyMemory: session.myFeedback?.vocabularyMemory || 'partial',
      grammarUnderstanding: session.myFeedback?.grammarUnderstanding || 'partial',
      teacherRating: session.myFeedback?.teacherRating || 5,
      unansweredQuestions: session.myFeedback?.unansweredQuestions || '',
      satisfactionRating: session.myFeedback?.satisfactionRating || 5,
      additionalComment: session.myFeedback?.additionalComment || ''
    })
  }

  const submitFeedback = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedClass || !feedbackSession) return
    if ((feedbackForm.attendanceChoice === 'partial' || feedbackForm.attendanceChoice === 'absent') && !feedbackForm.attendanceReason.trim()) {
      toast.error('Vui lòng nhập lý do đi muộn/vắng mặt')
      return
    }
    try {
      setSubmitting(true)
      await api.post(`/classes/${selectedClass._id}/sessions/${feedbackSession._id}/feedback`, feedbackForm)
      toast.success('Đã gửi feedback buổi học')
      setFeedbackSession(null)
      fetchClasses()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể gửi feedback')
    } finally {
      setSubmitting(false)
    }
  }

  const submitLeave = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedClass || !leaveSession) return
    if (!leaveReason.trim()) {
      toast.error('Vui lòng nhập lý do xin nghỉ')
      return
    }
    try {
      setSubmitting(true)
      await api.post(`/classes/${selectedClass._id}/sessions/${leaveSession._id}/leave`, { reason: leaveReason })
      toast.success('Đã gửi yêu cầu xin nghỉ')
      setLeaveSession(null)
      setLeaveReason('')
      fetchClasses()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể gửi xin nghỉ')
    } finally {
      setSubmitting(false)
    }
  }

  const cancelLeave = async (session: ClassSession) => {
    if (!selectedClass) return
    try {
      await api.delete(`/classes/${selectedClass._id}/sessions/${session._id}/leave`)
      toast.success('Đã hủy xin nghỉ')
      fetchClasses()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể hủy xin nghỉ')
    }
  }

  const startQuiz = (session: ClassSession, type: 'vocabulary' | 'exercise') => {
    const questions = type === 'vocabulary' ? session.vocabularyQuizQuestions : session.exercises
    if (!questions.length) {
      toast.error(type === 'vocabulary' ? 'Buổi học chưa có câu khảo từ vựng' : 'Buổi học chưa có bài tập')
      return
    }
    setAnswers({})
    setQuiz({ session, type })
  }

  const quizQuestions = quiz
    ? (quiz.type === 'vocabulary' ? quiz.session.vocabularyQuizQuestions : quiz.session.exercises)
    : []

  const setAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const toggleMultiAnswer = (questionId: string, optionIndex: number) => {
    const current = Array.isArray(answers[questionId]) ? answers[questionId] : []
    setAnswer(questionId, current.includes(optionIndex) ? current.filter((item: number) => item !== optionIndex) : [...current, optionIndex])
  }

  const submitQuiz = async () => {
    if (!selectedClass || !quiz) return
    try {
      setSubmitting(true)
      const payload = {
        type: quiz.type,
        answers: quizQuestions.map(question => ({
          questionId: String(question._id),
          answer: answers[String(question._id)]
        }))
      }
      const res = await api.post(`/classes/${selectedClass._id}/sessions/${quiz.session._id}/submissions`, payload)
      const submission = res.data.submission
      toast.success(`Kết quả: ${submission.correctCount}/${submission.totalQuestions} câu đúng`)
      setQuiz(null)
      fetchClasses()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể nộp bài')
    } finally {
      setSubmitting(false)
    }
  }

  const renderQuestion = (question: ClassQuestion, index: number) => {
    const id = String(question._id)
    const type = question.questionType || 'multiple-choice'
    const isMulti = Array.isArray(question.correctAnswer)

    return (
      <div key={id} className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Badge className="rounded-lg bg-primary/10 text-primary border-none font-black text-[10px]">
              Câu {index + 1}{question.vocabularyWord ? ` • ${question.vocabularyWord}` : ''}
            </Badge>
            {question.passage && <p className="mt-3 rounded-xl bg-white p-3 text-sm font-medium text-gray-600">{question.passage}</p>}
            <h4 className="mt-3 text-lg font-black text-gray-900 leading-relaxed">{question.question}</h4>
          </div>
        </div>

        {type === 'multiple-choice' && (
          <div className="grid gap-2">
            {(question.options || []).map((option, optionIndex) => {
              const active = isMulti
                ? (answers[id] || []).includes(optionIndex)
                : answers[id] === optionIndex
              return (
                <button
                  key={optionIndex}
                  type="button"
                  onClick={() => isMulti ? toggleMultiAnswer(id, optionIndex) : setAnswer(id, optionIndex)}
                  className={`min-h-[48px] rounded-xl border px-4 py-3 text-left font-bold transition-all ${
                    active ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 bg-white text-gray-600 hover:border-primary/30'
                  }`}
                >
                  {option}
                </button>
              )
            })}
          </div>
        )}

        {type === 'fill-blank' && (
          <Input
            value={answers[id] || ''}
            onChange={e => setAnswer(id, e.target.value)}
            className="h-12 rounded-xl bg-white font-bold"
            placeholder="Nhập câu trả lời..."
          />
        )}

        {type === 'sentence-order' && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {(question.sentences || question.options || []).map((sentence, optionIndex) => (
                <button
                  type="button"
                  key={optionIndex}
                  onClick={() => setAnswer(id, [...(answers[id] || []), optionIndex])}
                  className="rounded-xl border border-gray-100 bg-white px-3 py-2 text-sm font-bold text-gray-600"
                >
                  {sentence}
                </button>
              ))}
            </div>
            <div className="rounded-xl bg-white p-3 text-sm font-bold text-gray-500">
              Thứ tự đã chọn: {Array.isArray(answers[id]) && answers[id].length ? answers[id].map((item: number) => item + 1).join(' → ') : 'Chưa chọn'}
            </div>
            <Button type="button" variant="outline" onClick={() => setAnswer(id, [])} className="rounded-xl font-black">Chọn lại</Button>
          </div>
        )}

        {type === 'reading-comprehension' && (
          <div className="space-y-4">
            {(question.subQuestions || []).map((subQuestion, subIndex) => (
              <div key={subIndex} className="rounded-xl bg-white p-3 space-y-2">
                <p className="font-black text-gray-900">{subIndex + 1}. {subQuestion.question}</p>
                <div className="grid gap-2">
                  {subQuestion.options.map((option, optionIndex) => {
                    const current = Array.isArray(answers[id]) ? [...answers[id]] : []
                    const active = current[subIndex] === optionIndex
                    return (
                      <button
                        key={optionIndex}
                        type="button"
                        onClick={() => {
                          const next = Array.isArray(answers[id]) ? [...answers[id]] : []
                          next[subIndex] = optionIndex
                          setAnswer(id, next)
                        }}
                        className={`rounded-lg border px-3 py-2 text-left text-sm font-bold ${active ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 text-gray-600'}`}
                      >
                        {option}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfaf6] flex items-center justify-center">
        <Loader2 className="h-9 w-9 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fdfaf6] p-4 sm:p-6 md:p-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 flex items-center gap-3">
              <span className="h-12 w-12 rounded-2xl chinese-gradient text-white flex items-center justify-center shadow-lg">
                <GraduationCap className="h-7 w-7" />
              </span>
              Lớp học của tôi
            </h1>
            <p className="mt-2 text-sm sm:text-base font-medium text-gray-500">
              Theo dõi lịch học, feedback sau buổi học, kết quả khảo từ vựng và bài tập.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 bg-white rounded-2xl border border-gray-100 p-3 shadow-sm">
            <div className="text-center px-3">
              <p className="text-[10px] font-black uppercase text-gray-400">Lớp</p>
              <p className="text-xl font-black text-gray-900">{classes.length}</p>
            </div>
            <div className="text-center px-3">
              <p className="text-[10px] font-black uppercase text-gray-400">Đã học</p>
              <p className="text-xl font-black text-primary">{selectedClass?.stats.attendedSessions || 0}</p>
            </div>
            <div className="text-center px-3">
              <p className="text-[10px] font-black uppercase text-gray-400">Tổng buổi</p>
              <p className="text-xl font-black text-gray-900">{selectedClass?.stats.totalSessions || 0}</p>
            </div>
          </div>
        </div>

        {classes.length === 0 ? (
          <div className="rounded-[2rem] bg-white border border-gray-100 shadow-xl p-12 text-center">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="font-black text-gray-500">Bạn chưa được thêm vào lớp học nào.</p>
          </div>
        ) : (
          <div className="grid xl:grid-cols-[340px_1fr] gap-6">
            <aside className="space-y-3">
              {classes.map((klass) => {
                const active = selectedClass?._id === klass._id
                return (
                  <button
                    key={klass._id}
                    onClick={() => setSelectedClassId(klass._id)}
                    className={`w-full rounded-2xl border p-4 text-left transition-all ${
                      active ? 'border-primary bg-white shadow-xl' : 'border-gray-100 bg-white/70 hover:bg-white hover:shadow-md'
                    }`}
                  >
                    <h3 className="font-black text-gray-900">{klass.name}</h3>
                    <p className="mt-1 text-xs font-medium text-gray-500 line-clamp-2">{klass.description || 'Chưa có mô tả'}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge className="rounded-lg bg-primary/10 text-primary border-none">
                        {klass.stats.attendedSessions}/{klass.stats.totalSessions} buổi
                      </Badge>
                      <Badge className="rounded-lg bg-gray-100 text-gray-500 border-none">
                        {klass.teacherIds?.[0]?.name || 'Chưa có GV'}
                      </Badge>
                    </div>
                  </button>
                )
              })}
            </aside>

            <section className="space-y-5 min-w-0">
              {selectedClass && (
                <div className="rounded-[2rem] bg-white border border-gray-100 shadow-xl p-5 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-black text-gray-900">{selectedClass.name}</h2>
                      <p className="mt-2 text-sm font-medium text-gray-500">{selectedClass.description || 'Chưa có mô tả lớp.'}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {selectedClass.teacherIds?.map(teacher => (
                          <Badge key={teacher._id} className="rounded-lg bg-indigo-50 text-indigo-600 border-none font-bold">
                            Giáo viên: {teacher.name}
                          </Badge>
                        ))}
                        {selectedClass.groupLink && (
                          <a href={selectedClass.groupLink} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-lg bg-blue-50 px-3 py-1 text-xs font-black text-blue-600">
                            <LinkIcon className="mr-1 h-3.5 w-3.5" /> Nhóm lớp
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="w-full lg:w-64 rounded-2xl bg-gray-50 p-4">
                      <div className="flex justify-between text-sm font-black text-gray-600 mb-2">
                        <span>Tiến độ tham gia</span>
                        <span>{selectedClass.stats.attendedSessions}/{selectedClass.stats.totalSessions}</span>
                      </div>
                      <div className="h-3 rounded-full bg-white overflow-hidden">
                        <div
                          className="h-full chinese-gradient"
                          style={{ width: `${selectedClass.stats.totalSessions ? Math.round((selectedClass.stats.attendedSessions / selectedClass.stats.totalSessions) * 100) : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedClass && selectedClass.sessions.length > 0 && (
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                    <CalendarClock className="h-5 w-5 text-primary" /> Các buổi học
                  </h3>
                  <Badge className="rounded-lg bg-primary/10 text-primary border-none font-black">{selectedClass.sessions.length} buổi</Badge>
                </div>
              )}

              {selectedClass?.sessions.length === 0 && (
                <div className="rounded-[2rem] bg-white border border-dashed border-gray-200 p-10 text-center">
                  <CalendarClock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="font-black text-gray-500">Lớp chưa có buổi học.</p>
                </div>
              )}

              {(selectedClass?.sessions || []).slice((sessionPage - 1) * sessionPageSize, sessionPage * sessionPageSize).map((session) => {
                const leaveLocked = !isBefore(session.startAt)
                const feedbackOpen = isAfter(session.startAt) && isBefore(session.feedbackDeadline)
                const vocabOpen = isBefore(session.vocabularyDeadline)
                const exerciseOpen = isBefore(session.exerciseDeadline)
                return (
                  <div key={session._id} className="rounded-[2rem] bg-white border border-gray-100 shadow-lg p-5">
                    <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                      <div className="space-y-3 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-xl font-black text-gray-900">{session.title}</h3>
                          {session.myFeedback?.submittedByStudent && <Badge className="rounded-lg bg-emerald-50 text-emerald-600 border-none">Đã feedback</Badge>}
                          {session.myLeaveRequest && <Badge className="rounded-lg bg-blue-50 text-blue-600 border-none">Xin nghỉ: {session.myLeaveRequest.status}</Badge>}
                        </div>
                        <p className="text-sm font-bold text-gray-500 flex items-center">
                          <CalendarClock className="mr-2 h-4 w-4 text-primary" /> {formatDateTime(session.startAt)} - {formatDateTime(session.endAt)}
                        </p>
                        {session.googleMeetLink && (
                          <a href={session.googleMeetLink} target="_blank" rel="noreferrer" className="inline-flex items-center text-sm font-black text-blue-600">
                            <LinkIcon className="mr-2 h-4 w-4" /> Vào Google Meet
                          </a>
                        )}
                        <p className="text-sm font-medium text-gray-500 leading-relaxed">{session.content || 'Chưa có nội dung buổi học.'}</p>
                        <div className="grid md:grid-cols-3 gap-3">
                          <div className="rounded-2xl bg-gray-50 p-3">
                            <p className="text-[10px] font-black uppercase text-gray-400">Khảo từ vựng trước</p>
                            <p className="text-sm font-black text-gray-900">{formatDateTime(session.vocabularyDeadline)}</p>
                            <p className="text-xs font-medium text-gray-500 mt-1">{session.latestVocabularySubmission ? `${session.latestVocabularySubmission.correctCount}/${session.latestVocabularySubmission.totalQuestions} câu đúng` : 'Chưa làm'}</p>
                          </div>
                          <div className="rounded-2xl bg-gray-50 p-3">
                            <p className="text-[10px] font-black uppercase text-gray-400">Bài tập trước</p>
                            <p className="text-sm font-black text-gray-900">{formatDateTime(session.exerciseDeadline)}</p>
                            <p className="text-xs font-medium text-gray-500 mt-1">{session.latestExerciseSubmission ? `${session.latestExerciseSubmission.correctCount}/${session.latestExerciseSubmission.totalQuestions} câu đúng` : 'Chưa làm'}</p>
                          </div>
                          <div className="rounded-2xl bg-gray-50 p-3">
                            <p className="text-[10px] font-black uppercase text-gray-400">Feedback trước</p>
                            <p className="text-sm font-black text-gray-900">{formatDateTime(session.feedbackDeadline)}</p>
                            <p className="text-xs font-medium text-gray-500 mt-1">GV xác nhận: {CONFIRMATION_LABELS[session.myFeedback?.teacherConfirmationStatus] || 'Chưa xác nhận'}</p>
                          </div>
                        </div>

                        {session.myFeedback?.submittedByStudent && (
                          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 space-y-2">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 flex items-center gap-1.5">
                                <MessageSquare className="h-3.5 w-3.5" /> Feedback đã gửi
                              </p>
                              <span className="text-[10px] font-black text-gray-400">{formatDateTime(session.myFeedback.submittedAt)}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                              <Badge className="rounded-lg bg-white text-gray-600 border border-gray-100">{ATTENDANCE_LABELS[session.myFeedback.attendanceChoice] || session.myFeedback.attendanceChoice}</Badge>
                              <Badge className="rounded-lg bg-white text-gray-600 border border-gray-100">Hiểu {session.myFeedback.understandingPercent}%</Badge>
                              <Badge className="rounded-lg bg-white text-gray-600 border border-gray-100">{DIFFICULTY_LABELS[session.myFeedback.lessonDifficulty]}</Badge>
                              <Badge className="rounded-lg bg-white text-gray-600 border border-gray-100">Từ vựng: {VOCAB_MEMORY_LABELS[session.myFeedback.vocabularyMemory]}</Badge>
                              <Badge className="rounded-lg bg-white text-gray-600 border border-gray-100">Ngữ pháp: {GRAMMAR_LABELS[session.myFeedback.grammarUnderstanding]}</Badge>
                              <Badge className="rounded-lg bg-white text-amber-600 border border-gray-100">GV {session.myFeedback.teacherRating}/5</Badge>
                              <Badge className="rounded-lg bg-white text-amber-600 border border-gray-100">Hài lòng {session.myFeedback.satisfactionRating}/5</Badge>
                            </div>
                            {session.myFeedback.unansweredQuestions && (
                              <p className="text-xs font-medium text-gray-600"><span className="font-black">Chưa hiểu:</span> {session.myFeedback.unansweredQuestions}</p>
                            )}
                            {session.myFeedback.additionalComment && (
                              <p className="text-xs font-medium text-gray-600"><span className="font-black">Góp ý:</span> {session.myFeedback.additionalComment}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <Badge className="rounded-lg bg-emerald-100 text-emerald-700 border-none text-[10px]">Trạng thái: {FEEDBACK_STATUS_LABELS[session.myFeedback.status] || session.myFeedback.status}</Badge>
                              <Badge className="rounded-lg bg-indigo-50 text-indigo-600 border-none text-[10px]">GV xác nhận: {CONFIRMATION_LABELS[session.myFeedback.teacherConfirmationStatus] || 'Chưa xác nhận'}</Badge>
                            </div>
                            {session.myFeedback.teacherNote && (
                              <p className="text-xs font-medium text-gray-600 rounded-xl bg-white p-2.5 border border-gray-100"><span className="font-black text-primary">GV phản hồi:</span> {session.myFeedback.teacherNote}</p>
                            )}
                            {session.myFeedback.teacherConfirmationReason && (
                              <p className="text-xs font-medium text-gray-500"><span className="font-black">Ghi chú điểm danh:</span> {session.myFeedback.teacherConfirmationReason}</p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="grid sm:grid-cols-2 xl:grid-cols-1 gap-2 shrink-0 xl:w-52">
                        <Button disabled={!vocabOpen} onClick={() => startQuiz(session, 'vocabulary')} className="rounded-xl font-black bg-purple-600 hover:bg-purple-700 text-white">
                          <ClipboardCheck className="mr-2 h-4 w-4" /> Khảo từ vựng
                        </Button>
                        <Button disabled={!exerciseOpen} onClick={() => startQuiz(session, 'exercise')} className="rounded-xl font-black bg-indigo-600 hover:bg-indigo-700 text-white">
                          <FileQuestion className="mr-2 h-4 w-4" /> Làm bài tập
                        </Button>
                        <Button disabled={!feedbackOpen} onClick={() => openFeedback(session)} className="rounded-xl font-black chinese-gradient text-white">
                          <MessageSquare className="mr-2 h-4 w-4" /> Feedback
                        </Button>
                        {session.myLeaveRequest && session.myLeaveRequest.status !== 'cancelled' ? (
                          <Button disabled={leaveLocked} variant="outline" onClick={() => cancelLeave(session)} className="rounded-xl font-black border-blue-100 text-blue-600">
                            Hủy xin nghỉ
                          </Button>
                        ) : (
                          <Button disabled={leaveLocked} variant="outline" onClick={() => { setLeaveSession(session); setLeaveReason('') }} className="rounded-xl font-black border-red-100 text-red-500">
                            <UserMinus className="mr-2 h-4 w-4" /> Xin nghỉ
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {selectedClass && selectedClass.sessions.length > sessionPageSize && (
                <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
                  <Pagination
                    total={selectedClass.sessions.length}
                    page={sessionPage}
                    pageSize={sessionPageSize}
                    onPageChange={setSessionPage}
                    onPageSizeChange={setSessionPageSize}
                    pageSizeOptions={[5, 10, 20, 50]}
                    itemLabel="buổi"
                  />
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      <Dialog open={!!leaveSession} onOpenChange={(open) => !open && setLeaveSession(null)}>
        <DialogContent className="sm:max-w-xl rounded-[2rem] border-none shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-gray-900">Xin nghỉ buổi học</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitLeave} className="space-y-4">
            <p className="text-sm font-medium text-gray-500">{leaveSession?.title} • {formatDateTime(leaveSession?.startAt)}</p>
            <Textarea value={leaveReason} onChange={e => setLeaveReason(e.target.value)} className="min-h-32 rounded-xl font-medium" placeholder="Nhập lý do xin nghỉ..." />
            <Button disabled={submitting} className="w-full h-12 rounded-xl chinese-gradient text-white font-black">
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Gửi xin nghỉ
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!feedbackSession} onOpenChange={(open) => !open && setFeedbackSession(null)}>
        <DialogContent className="sm:max-w-4xl rounded-[2rem] border-none shadow-2xl p-5 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-gray-900">Feedback sau buổi học</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitFeedback} className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-5">
              <div className="rounded-2xl bg-gray-50 p-4 space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">1. Xác nhận tham gia lớp</Label>
                {[
                  ['full', 'Có, tôi có tham gia đầy đủ.'],
                  ['partial', 'Có, nhưng tôi vào muộn hoặc rời sớm.'],
                  ['absent', 'Không, tôi không tham gia.']
                ].map(([value, label]) => (
                  <button key={value} type="button" onClick={() => setFeedbackForm({ ...feedbackForm, attendanceChoice: value })} className={`w-full rounded-xl border p-3 text-left font-bold ${feedbackForm.attendanceChoice === value ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 bg-white text-gray-600'}`}>
                    {label}
                  </button>
                ))}
                {(feedbackForm.attendanceChoice === 'partial' || feedbackForm.attendanceChoice === 'absent') && (
                  <Textarea value={feedbackForm.attendanceReason} onChange={e => setFeedbackForm({ ...feedbackForm, attendanceReason: e.target.value })} className="rounded-xl bg-white" placeholder="Nhập lý do..." />
                )}
              </div>

              <div className="rounded-2xl bg-gray-50 p-4 space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">2. Mức độ hiểu bài</Label>
                <div className="grid grid-cols-5 gap-2">
                  {[100, 80, 60, 40, 20].map(value => (
                    <button key={value} type="button" onClick={() => setFeedbackForm({ ...feedbackForm, understandingPercent: value })} className={`h-12 rounded-xl border text-sm font-black ${feedbackForm.understandingPercent === value ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 bg-white text-gray-500'}`}>
                      {value === 20 ? '<40%' : `${value}%`}
                    </button>
                  ))}
                </div>
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">3. Độ khó bài học</Label>
                <select value={feedbackForm.lessonDifficulty} onChange={e => setFeedbackForm({ ...feedbackForm, lessonDifficulty: e.target.value })} className="h-12 w-full rounded-xl border border-gray-100 bg-white px-3 font-bold">
                  <option value="too_easy">Quá dễ</option>
                  <option value="just_right">Vừa sức</option>
                  <option value="a_bit_hard">Hơi khó</option>
                  <option value="very_hard">Rất khó</option>
                </select>
              </div>

              <div className="rounded-2xl bg-gray-50 p-4 space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">4. Từ vựng và ngữ pháp</Label>
                <select value={feedbackForm.vocabularyMemory} onChange={e => setFeedbackForm({ ...feedbackForm, vocabularyMemory: e.target.value })} className="h-12 w-full rounded-xl border border-gray-100 bg-white px-3 font-bold">
                  <option value="good">Từ vựng: Nhớ tốt</option>
                  <option value="partial">Từ vựng: Nhớ một phần</option>
                  <option value="weak">Từ vựng: Chưa nhớ nhiều</option>
                  <option value="need_review">Từ vựng: Cần ôn lại</option>
                </select>
                <select value={feedbackForm.grammarUnderstanding} onChange={e => setFeedbackForm({ ...feedbackForm, grammarUnderstanding: e.target.value })} className="h-12 w-full rounded-xl border border-gray-100 bg-white px-3 font-bold">
                  <option value="clear">Ngữ pháp: Hiểu rõ</option>
                  <option value="partial">Ngữ pháp: Hiểu một phần</option>
                  <option value="unclear">Ngữ pháp: Chưa hiểu</option>
                  <option value="need_reteach">Ngữ pháp: Cần giáo viên giảng lại</option>
                </select>
              </div>

              <div className="rounded-2xl bg-gray-50 p-4 space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">5. Đánh giá giáo viên</Label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map(value => (
                    <button key={value} type="button" onClick={() => setFeedbackForm({ ...feedbackForm, teacherRating: value })} className={`h-12 rounded-xl border text-sm font-black ${feedbackForm.teacherRating === value ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 bg-white text-gray-500'}`}>
                      {value}
                    </button>
                  ))}
                </div>
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">7. Mức độ hài lòng</Label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map(value => (
                    <button key={value} type="button" onClick={() => setFeedbackForm({ ...feedbackForm, satisfactionRating: value })} className={`h-12 rounded-xl border text-sm font-black ${feedbackForm.satisfactionRating === value ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 bg-white text-gray-500'}`}>
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">6. Bạn còn chỗ nào chưa hiểu không?</Label>
                <Textarea value={feedbackForm.unansweredQuestions} onChange={e => setFeedbackForm({ ...feedbackForm, unansweredQuestions: e.target.value })} className="min-h-28 rounded-xl" placeholder="Ví dụ: Em chưa hiểu cách dùng 了..." />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">8. Góp ý thêm</Label>
                <Textarea value={feedbackForm.additionalComment} onChange={e => setFeedbackForm({ ...feedbackForm, additionalComment: e.target.value })} className="min-h-28 rounded-xl" placeholder="Góp ý cho giáo viên hoặc trung tâm..." />
              </div>
            </div>

            <Button disabled={submitting} className="w-full h-13 rounded-2xl chinese-gradient text-white font-black shadow-xl">
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Gửi feedback
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!quiz} onOpenChange={(open) => !open && setQuiz(null)}>
        <DialogContent className="sm:max-w-5xl rounded-[2rem] border-none shadow-2xl p-5 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-gray-900">
              {quiz?.type === 'vocabulary' ? 'Khảo từ vựng' : 'Bài tập buổi học'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[68vh] overflow-y-auto pr-1">
            {quizQuestions.map((question, index) => renderQuestion(question, index))}
          </div>
          <Button disabled={submitting || quizQuestions.length === 0} onClick={submitQuiz} className="h-13 rounded-2xl chinese-gradient text-white font-black shadow-xl">
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Nộp bài
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MyClasses
