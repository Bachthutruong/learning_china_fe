import { useEffect, useMemo, useState } from 'react'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Pagination } from '../../components/Pagination'
import { ConfirmDialog, ConfirmState } from '../../components/ConfirmDialog'
import { api } from '../../services/api'
import toast from 'react-hot-toast'
import {
  BarChart3,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Edit,
  GraduationCap,
  Link as LinkIcon,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  UserCheck,
  Users
} from 'lucide-react'

interface UserOption {
  _id: string
  name: string
  email: string
  role: string
  level?: number
}

interface VocabularyOption {
  _id: string
  word: string
  pinyin: string
  meaning: string
  questions?: any[]
}

interface ExerciseOption {
  _id: string
  level?: number
  questionType: string
  question: string
  testTitle?: string
}

interface LearningClass {
  _id: string
  name: string
  description?: string
  capacity: number
  tuitionFee: number
  groupLink?: string
  teacherIds: UserOption[]
  studentIds: UserOption[]
  status: 'active' | 'archived'
  sessionsCount?: number
  upcomingCount?: number
}

interface ClassSession {
  _id: string
  title: string
  startAt: string
  endAt: string
  durationMinutes: number
  googleMeetLink?: string
  content?: string
  vocabularyIds: VocabularyOption[]
  exercises: ExerciseOption[]
  vocabularyDeadline: string
  exerciseDeadline: string
  feedbackDeadline: string
  scheduleLabel?: string
}

interface RosterItem {
  student: UserOption
  feedback: any | null
  leaveRequest: any | null
  submissions: any[]
}

interface ClassManagementProps {
  mode: 'admin' | 'teacher'
}

const dayOptions = [
  { value: 1, label: 'Thứ 2' },
  { value: 2, label: 'Thứ 3' },
  { value: 3, label: 'Thứ 4' },
  { value: 4, label: 'Thứ 5' },
  { value: 5, label: 'Thứ 6' },
  { value: 6, label: 'Thứ 7' },
  { value: 7, label: 'Chủ nhật' }
]

const emptyClassForm = {
  _id: '',
  name: '',
  description: '',
  capacity: 20,
  tuitionFee: 0,
  groupLink: '',
  teacherIds: [] as string[],
  studentIds: [] as string[],
  status: 'active'
}

const emptySessionForm = {
  _id: '',
  title: '',
  startAt: '',
  durationMinutes: 90,
  googleMeetLink: '',
  content: '',
  vocabularyIds: [] as string[],
  exerciseIds: [] as string[],
  vocabularyDeadline: '',
  exerciseDeadline: '',
  feedbackDeadline: '',
  recurringDays: [] as number[],
  repeatUntil: ''
}

const ATTENDANCE_LABELS: Record<string, string> = {
  full: 'Tham gia đầy đủ',
  partial: 'Vào muộn / rời sớm',
  absent: 'Không tham gia'
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
const scoreColor = (percent: number) =>
  percent >= 80 ? 'text-emerald-600' : percent >= 50 ? 'text-amber-600' : 'text-red-500'

const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value || 0)

const formatDateTime = (value?: string) => {
  if (!value) return 'Chưa đặt'
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

const toDateTimeLocal = (value?: string) => {
  if (!value) return ''
  const date = new Date(value)
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 16)
}

const ToggleList = ({
  title,
  items,
  selected,
  onChange,
  renderItem,
  emptyText,
  searchable = false,
  searchPlaceholder = 'Tìm kiếm...',
  getSearchText
}: {
  title: string
  items: any[]
  selected: string[]
  onChange: (next: string[]) => void
  renderItem: (item: any) => JSX.Element
  emptyText: string
  searchable?: boolean
  searchPlaceholder?: string
  getSearchText?: (item: any) => string
}) => {
  const [query, setQuery] = useState('')
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter(item => item !== id) : [...selected, id])
  }

  const keyword = query.trim().toLowerCase()
  const visibleItems = searchable && keyword && getSearchText
    ? items.filter(item => getSearchText(item).toLowerCase().includes(keyword))
    : items

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{title}</Label>
        <Badge variant="outline" className="rounded-lg text-[10px] font-black">Đã chọn {selected.length}</Badge>
      </div>
      {searchable && (
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="h-10 rounded-xl font-bold text-sm"
          placeholder={searchPlaceholder}
        />
      )}
      <div className="max-h-64 overflow-y-auto rounded-2xl border border-gray-100 bg-gray-50/60 p-2 space-y-2">
        {visibleItems.length === 0 && <p className="p-4 text-sm font-bold text-gray-400 text-center">{keyword ? 'Không tìm thấy kết quả phù hợp.' : emptyText}</p>}
        {visibleItems.map((item) => {
          const id = item._id
          const active = selected.includes(id)
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              className={`w-full rounded-xl border p-3 text-left transition-all ${
                active ? 'border-primary bg-primary/5 shadow-sm' : 'border-transparent bg-white hover:border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 h-5 w-5 rounded-lg border flex items-center justify-center shrink-0 ${
                  active ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-transparent'
                }`}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">{renderItem(item)}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export const ClassManagement = ({ mode }: ClassManagementProps) => {
  const isAdmin = mode === 'admin'
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState<LearningClass[]>([])
  const [selectedClass, setSelectedClass] = useState<LearningClass | null>(null)
  const [sessions, setSessions] = useState<ClassSession[]>([])
  const [teachers, setTeachers] = useState<UserOption[]>([])
  const [students, setStudents] = useState<UserOption[]>([])
  const [vocabularies, setVocabularies] = useState<VocabularyOption[]>([])
  const [exercises, setExercises] = useState<ExerciseOption[]>([])
  const [vocabulariesTotal, setVocabulariesTotal] = useState(0)
  const [exercisesTotal, setExercisesTotal] = useState(0)
  const [classDialogOpen, setClassDialogOpen] = useState(false)
  const [studentDialogOpen, setStudentDialogOpen] = useState(false)
  const [studentForm, setStudentForm] = useState<string[]>([])
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false)
  const [classForm, setClassForm] = useState(emptyClassForm)
  const [sessionForm, setSessionForm] = useState(emptySessionForm)
  const [rosterSession, setRosterSession] = useState<ClassSession | null>(null)
  const [roster, setRoster] = useState<RosterItem[]>([])
  const [rosterLoading, setRosterLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [contentSearch, setContentSearch] = useState('')
  const [rosterEdits, setRosterEdits] = useState<Record<string, { status: string; confirmation: string; reason: string; note: string }>>({})
  const [statsSession, setStatsSession] = useState<ClassSession | null>(null)
  const [statsRoster, setStatsRoster] = useState<RosterItem[]>([])
  const [statsLoading, setStatsLoading] = useState(false)
  // Server-side pagination + search for the class list
  const [classesTotal, setClassesTotal] = useState(0)
  const [classPage, setClassPage] = useState(1)
  const [classPageSize, setClassPageSize] = useState(8)
  const [classSearch, setClassSearch] = useState('')
  const [classSearchDebounced, setClassSearchDebounced] = useState('')
  // Server-side pagination + search for the session list
  const [sessionsTotal, setSessionsTotal] = useState(0)
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [sessionPage, setSessionPage] = useState(1)
  const [sessionPageSize, setSessionPageSize] = useState(5)
  const [sessionSearch, setSessionSearch] = useState('')
  const [sessionSearchDebounced, setSessionSearchDebounced] = useState('')
  // Roster pagination stays client-side (bounded by class size)
  const [rosterPage, setRosterPage] = useState(1)
  const [rosterPageSize, setRosterPageSize] = useState(5)
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const runConfirm = async (action: () => void | Promise<void>) => {
    try {
      setConfirmLoading(true)
      await action()
      setConfirmState(null)
    } finally {
      setConfirmLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchContent()
  }, [mode])

  // Debounce the search inputs
  useEffect(() => { const t = setTimeout(() => setClassSearchDebounced(classSearch), 350); return () => clearTimeout(t) }, [classSearch])
  useEffect(() => { const t = setTimeout(() => setSessionSearchDebounced(sessionSearch), 350); return () => clearTimeout(t) }, [sessionSearch])

  // Reset to first page when the search term or page size changes
  useEffect(() => { setClassPage(1) }, [classSearchDebounced, classPageSize])
  useEffect(() => { setSessionPage(1) }, [sessionSearchDebounced, sessionPageSize, selectedClass?._id])
  // Reset roster pagination whenever a roster dialog opens for a different session
  useEffect(() => { setRosterPage(1) }, [rosterSession?._id])

  // Server-driven fetch for the class list
  useEffect(() => { fetchClasses() }, [mode, classPage, classPageSize, classSearchDebounced])
  // Server-driven fetch for the session list of the selected class
  useEffect(() => {
    if (selectedClass?._id) fetchSessions(selectedClass._id)
    else { setSessions([]); setSessionsTotal(0) }
  }, [selectedClass?._id, sessionPage, sessionPageSize, sessionSearchDebounced])

  const clampPage = (page: number, total: number, size: number) => Math.min(page, Math.max(1, Math.ceil(total / size)))
  const pagedRoster = (() => { const p = clampPage(rosterPage, roster.length, rosterPageSize); return roster.slice((p - 1) * rosterPageSize, p * rosterPageSize) })()

  const fetchClasses = async () => {
    try {
      setLoading(true)
      const endpoint = isAdmin ? '/classes/admin' : '/classes/teacher'
      const res = await api.get(endpoint, { params: { page: classPage, limit: classPageSize, search: classSearchDebounced } })
      const items = res.data.classes || []
      setClasses(items)
      setClassesTotal(res.data.total ?? items.length)
      if (!selectedClass && items[0]) {
        await fetchClassDetail(items[0]._id)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể tải danh sách lớp')
    } finally {
      setLoading(false)
    }
  }

  const fetchSessions = async (classId: string) => {
    try {
      setSessionsLoading(true)
      const res = await api.get(`/classes/${classId}/sessions`, { params: { page: sessionPage, limit: sessionPageSize, search: sessionSearchDebounced } })
      setSessions(res.data.sessions || [])
      setSessionsTotal(res.data.total ?? (res.data.sessions || []).length)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể tải danh sách buổi học')
    } finally {
      setSessionsLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await api.get('/classes/options/users')
      setTeachers(res.data.teachers || [])
      setStudents(res.data.students || [])
    } catch {
      toast.error('Không thể tải danh sách giáo viên/học viên')
    }
  }

  const fetchContent = async (q = '') => {
    try {
      const res = await api.get('/classes/options/content', { params: { q, limit: 500 } })
      setVocabularies(res.data.vocabularies || [])
      setExercises(res.data.exercises || [])
      setVocabulariesTotal(res.data.vocabulariesTotal || (res.data.vocabularies || []).length)
      setExercisesTotal(res.data.exercisesTotal || (res.data.exercises || []).length)
    } catch {
      toast.error('Không thể tải ngân hàng nội dung')
    }
  }

  const fetchClassDetail = async (id: string) => {
    try {
      const res = await api.get(`/classes/${id}`)
      setSelectedClass(res.data.class)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể tải chi tiết lớp')
    }
  }

  // Reload the session list of the currently selected class (after create/edit/delete)
  const reloadSessions = async () => {
    if (selectedClass?._id) await fetchSessions(selectedClass._id)
  }

  const openCreateClass = () => {
    setClassForm(emptyClassForm)
    setClassDialogOpen(true)
  }

  const openEditClass = (klass: LearningClass) => {
    setClassForm({
      _id: klass._id,
      name: klass.name,
      description: klass.description || '',
      capacity: klass.capacity || 20,
      tuitionFee: klass.tuitionFee || 0,
      groupLink: klass.groupLink || '',
      teacherIds: (klass.teacherIds || []).map(item => item._id),
      studentIds: (klass.studentIds || []).map(item => item._id),
      status: klass.status || 'active'
    })
    setClassDialogOpen(true)
  }

  const saveClass = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!classForm.name.trim()) {
      toast.error('Vui lòng nhập tên lớp')
      return
    }
    try {
      setSaving(true)
      let savedId = classForm._id
      if (classForm._id) {
        const res = await api.put(`/classes/${classForm._id}`, classForm)
        savedId = res.data?.class?._id || classForm._id
        toast.success('Đã cập nhật lớp học')
      } else {
        const res = await api.post('/classes', classForm)
        savedId = res.data?.class?._id || ''
        toast.success('Đã tạo lớp học')
      }
      setClassDialogOpen(false)
      await fetchClasses()
      // Refresh the selected class detail so reopening "Sửa lớp" shows the latest
      // teachers/students (otherwise the dialog keeps stale data).
      if (savedId) await fetchClassDetail(savedId)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể lưu lớp học')
    } finally {
      setSaving(false)
    }
  }

  const openStudentDialog = () => {
    if (!selectedClass) return
    setStudentForm((selectedClass.studentIds || []).map(item => item._id))
    setStudentDialogOpen(true)
  }

  const saveStudents = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedClass) return
    try {
      setSaving(true)
      await api.put(`/classes/${selectedClass._id}`, { studentIds: studentForm })
      toast.success('Đã cập nhật danh sách học viên')
      setStudentDialogOpen(false)
      await fetchClasses()
      await fetchClassDetail(selectedClass._id)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật học viên')
    } finally {
      setSaving(false)
    }
  }

  const archiveClass = async (klass: LearningClass) => {
    try {
      await api.delete(`/classes/${klass._id}`)
      toast.success('Đã ẩn lớp học')
      setSelectedClass(null)
      setSessions([])
      fetchClasses()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể ẩn lớp')
    }
  }

  const openCreateSession = () => {
    setSessionForm(emptySessionForm)
    setSessionDialogOpen(true)
  }

  const openEditSession = (session: ClassSession) => {
    setSessionForm({
      _id: session._id,
      title: session.title,
      startAt: toDateTimeLocal(session.startAt),
      durationMinutes: session.durationMinutes || 90,
      googleMeetLink: session.googleMeetLink || '',
      content: session.content || '',
      vocabularyIds: (session.vocabularyIds || []).map(item => item._id),
      exerciseIds: (session.exercises || []).map(item => item._id),
      vocabularyDeadline: toDateTimeLocal(session.vocabularyDeadline),
      exerciseDeadline: toDateTimeLocal(session.exerciseDeadline),
      feedbackDeadline: toDateTimeLocal(session.feedbackDeadline),
      recurringDays: [],
      repeatUntil: ''
    })
    setSessionDialogOpen(true)
  }

  const saveSession = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedClass) return
    if (!sessionForm.title.trim() || !sessionForm.startAt) {
      toast.error('Vui lòng nhập tên buổi học và thời gian')
      return
    }

    const payload = {
      ...sessionForm,
      vocabularyDeadline: sessionForm.vocabularyDeadline || undefined,
      exerciseDeadline: sessionForm.exerciseDeadline || undefined,
      feedbackDeadline: sessionForm.feedbackDeadline || undefined,
      repeatUntil: sessionForm.repeatUntil || undefined
    }

    try {
      setSaving(true)
      if (sessionForm._id) {
        await api.put(`/classes/${selectedClass._id}/sessions/${sessionForm._id}`, payload)
        toast.success('Đã cập nhật buổi học')
      } else {
        const res = await api.post(`/classes/${selectedClass._id}/sessions`, payload)
        toast.success(`Đã tạo ${res.data.sessions?.length || 1} buổi học`)
      }
      setSessionDialogOpen(false)
      await Promise.all([reloadSessions(), fetchClassDetail(selectedClass._id), fetchClasses()])
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể lưu buổi học')
    } finally {
      setSaving(false)
    }
  }

  const deleteSession = async (session: ClassSession) => {
    if (!selectedClass) return
    try {
      await api.delete(`/classes/${selectedClass._id}/sessions/${session._id}`)
      toast.success('Đã xóa buổi học')
      await Promise.all([reloadSessions(), fetchClassDetail(selectedClass._id), fetchClasses()])
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể xóa buổi học')
    }
  }

  const openRoster = async (session: ClassSession) => {
    if (!selectedClass) return
    setRosterSession(session)
    setRoster([])
    setRosterEdits({})
    setRosterLoading(true)
    try {
      const res = await api.get(`/classes/${selectedClass._id}/sessions/${session._id}/roster`)
      const items = res.data.roster || []
      setRoster(items)
      const edits: Record<string, { status: string; confirmation: string; reason: string; note: string }> = {}
      items.forEach((item: RosterItem) => {
        edits[item.student._id] = {
          status: item.feedback?.status || 'submitted',
          confirmation: item.feedback?.teacherConfirmationStatus || 'pending',
          reason: item.feedback?.teacherConfirmationReason || '',
          note: item.feedback?.teacherNote || ''
        }
      })
      setRosterEdits(edits)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể tải điểm danh')
    } finally {
      setRosterLoading(false)
    }
  }

  const openStats = async (session: ClassSession) => {
    if (!selectedClass) return
    setStatsSession(session)
    setStatsRoster([])
    setStatsLoading(true)
    try {
      const res = await api.get(`/classes/${selectedClass._id}/sessions/${session._id}/roster`)
      setStatsRoster(res.data.roster || [])
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể tải thống kê')
    } finally {
      setStatsLoading(false)
    }
  }

  const latestOf = (item: RosterItem, type: 'vocabulary' | 'exercise') =>
    item.submissions.find(sub => sub.type === type) || null

  const statsSummary = useMemo(() => {
    const total = statsRoster.length
    let present = 0, feedbackCount = 0, vocabDone = 0, exerciseDone = 0
    let vocabScoreSum = 0, exerciseScoreSum = 0, understandingSum = 0, satisfactionSum = 0, understandingCount = 0
    statsRoster.forEach(item => {
      const fb: any = item.feedback
      if (fb?.teacherConfirmationStatus === 'present' || (fb?.submittedByStudent && ['full', 'partial'].includes(fb?.attendanceChoice))) present++
      if (fb?.submittedByStudent) { feedbackCount++; understandingSum += Number(fb.understandingPercent || 0); satisfactionSum += Number(fb.satisfactionRating || 0); understandingCount++ }
      const v = latestOf(item, 'vocabulary'); const e = latestOf(item, 'exercise')
      if (v) { vocabDone++; vocabScoreSum += Number(v.scorePercent || 0) }
      if (e) { exerciseDone++; exerciseScoreSum += Number(e.scorePercent || 0) }
    })
    return {
      total, present, feedbackCount, vocabDone, exerciseDone,
      avgVocab: vocabDone ? Math.round(vocabScoreSum / vocabDone) : 0,
      avgExercise: exerciseDone ? Math.round(exerciseScoreSum / exerciseDone) : 0,
      avgUnderstanding: understandingCount ? Math.round(understandingSum / understandingCount) : 0,
      avgSatisfaction: understandingCount ? (satisfactionSum / understandingCount).toFixed(1) : '0'
    }
  }, [statsRoster])

  const saveRosterStatus = async (studentId: string) => {
    if (!selectedClass || !rosterSession) return
    const edit = rosterEdits[studentId]
    try {
      await api.patch(`/classes/${selectedClass._id}/sessions/${rosterSession._id}/feedback/${studentId}/status`, {
        status: edit.status,
        teacherConfirmationStatus: edit.confirmation,
        teacherConfirmationReason: edit.reason,
        teacherNote: edit.note
      })
      toast.success('Đã cập nhật trạng thái')
      openRoster(rosterSession)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật')
    }
  }

  const reviewLeave = async (studentId: string, status: 'approved' | 'rejected') => {
    if (!selectedClass || !rosterSession) return
    try {
      await api.patch(`/classes/${selectedClass._id}/sessions/${rosterSession._id}/leave/${studentId}`, { status })
      toast.success(status === 'approved' ? 'Đã duyệt nghỉ' : 'Đã từ chối nghỉ')
      openRoster(rosterSession)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể xử lý xin nghỉ')
    }
  }

  // Recurring creation only generates empty slots; content/vocab/exercises are added per session later.
  const isRecurringCreate = !sessionForm._id && sessionForm.recurringDays.length > 0

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <span className="h-11 w-11 rounded-2xl chinese-gradient text-white flex items-center justify-center shadow-lg">
              <GraduationCap className="h-6 w-6" />
            </span>
            {isAdmin ? 'Quản lý lớp học' : 'Lớp giảng dạy'}
          </h1>
          <p className="mt-2 text-sm font-medium text-gray-500">
            Tạo lớp, phân giáo viên/học viên, lên lịch buổi học, quản lý feedback và kết quả học tập.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => fetchContent(contentSearch)}
            className="h-11 rounded-xl font-black border-gray-200"
          >
            <BookOpen className="mr-2 h-4 w-4" /> Đồng bộ ngân hàng
          </Button>
          {isAdmin && (
            <Button onClick={openCreateClass} className="h-11 rounded-xl chinese-gradient text-white font-black shadow-lg">
              <Plus className="mr-2 h-4 w-4" /> Tạo lớp học
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
        <aside className="space-y-4">
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Danh sách lớp</p>
              <Badge className="rounded-lg bg-primary/10 text-primary border-none font-black">{classesTotal}</Badge>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={classSearch}
                onChange={e => setClassSearch(e.target.value)}
                className="h-10 rounded-xl font-bold pl-9 text-sm"
                placeholder="Tìm lớp theo tên..."
              />
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {classes.length === 0 && (
                <div className="rounded-2xl bg-gray-50 p-6 text-center text-sm font-bold text-gray-400">
                  {classSearchDebounced ? 'Không tìm thấy lớp phù hợp.' : 'Chưa có lớp học nào.'}
                </div>
              )}
              {classes.map((klass) => {
                const active = selectedClass?._id === klass._id
                return (
                  <button
                    key={klass._id}
                    onClick={() => fetchClassDetail(klass._id)}
                    className={`w-full rounded-2xl border p-4 text-left transition-all ${
                      active ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-100 bg-gray-50/60 hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-black text-gray-900 truncate">{klass.name}</h3>
                        <p className="mt-1 text-xs font-medium text-gray-500 line-clamp-2">{klass.description || 'Chưa có mô tả'}</p>
                      </div>
                      <Badge className={klass.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-none' : 'bg-gray-100 text-gray-500 border-none'}>
                        {klass.status === 'active' ? 'Active' : 'Ẩn'}
                      </Badge>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl bg-white p-2">
                        <p className="text-[10px] font-black text-gray-400">GV</p>
                        <p className="font-black text-gray-900">{klass.teacherIds?.length || 0}</p>
                      </div>
                      <div className="rounded-xl bg-white p-2">
                        <p className="text-[10px] font-black text-gray-400">HV</p>
                        <p className="font-black text-gray-900">{klass.studentIds?.length || 0}</p>
                      </div>
                      <div className="rounded-xl bg-white p-2">
                        <p className="text-[10px] font-black text-gray-400">Buổi</p>
                        <p className="font-black text-gray-900">{klass.sessionsCount || 0}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
            {classesTotal > classPageSize && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <Pagination
                  total={classesTotal}
                  page={classPage}
                  pageSize={classPageSize}
                  onPageChange={setClassPage}
                  onPageSizeChange={setClassPageSize}
                  pageSizeOptions={[8, 16, 32]}
                  itemLabel="lớp"
                />
              </div>
            )}
          </div>
        </aside>

        <section className="space-y-6 min-w-0">
          {!selectedClass ? (
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl p-12 text-center">
              <GraduationCap className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="font-black text-gray-500">Chọn một lớp học để quản lý.</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl p-5 sm:p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-2xl font-black text-gray-900">{selectedClass.name}</h2>
                      <Badge className="rounded-lg bg-red-50 text-primary border-none font-black">
                        {money(selectedClass.tuitionFee)}đ
                      </Badge>
                      {selectedClass.groupLink && (
                        <a href={selectedClass.groupLink} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs font-black text-blue-600">
                          <LinkIcon className="mr-1 h-3.5 w-3.5" /> Nhóm lớp
                        </a>
                      )}
                    </div>
                    <p className="mt-2 text-sm font-medium text-gray-500 leading-relaxed">{selectedClass.description || 'Chưa có mô tả lớp.'}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(selectedClass.teacherIds || []).map(teacher => (
                        <Badge key={teacher._id} className="rounded-lg bg-indigo-50 text-indigo-600 border-none font-bold">
                          GV: {teacher.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 shrink-0">
                    <div className="rounded-2xl bg-gray-50 p-3 text-center">
                      <p className="text-[10px] font-black uppercase text-gray-400">Sức chứa</p>
                      <p className="text-xl font-black text-gray-900">{selectedClass.capacity}</p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 p-3 text-center">
                      <p className="text-[10px] font-black uppercase text-gray-400">Học viên</p>
                      <p className="text-xl font-black text-gray-900">{selectedClass.studentIds?.length || 0}</p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 p-3 text-center">
                      <p className="text-[10px] font-black uppercase text-gray-400">Sắp tới</p>
                      <p className="text-xl font-black text-primary">{selectedClass.upcomingCount || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button onClick={openCreateSession} className="rounded-xl chinese-gradient text-white font-black shadow-lg">
                    <CalendarClock className="mr-2 h-4 w-4" /> Tạo buổi học
                  </Button>
                  <Button variant="outline" onClick={openStudentDialog} className="rounded-xl font-black border-gray-200">
                    <Users className="mr-2 h-4 w-4" /> Quản lý học viên
                  </Button>
                  {isAdmin && (
                    <>
                      <Button variant="outline" onClick={() => openEditClass(selectedClass)} className="rounded-xl font-black border-gray-200">
                        <Edit className="mr-2 h-4 w-4" /> Sửa lớp
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setConfirmState({
                          title: 'Ẩn lớp học?',
                          description: `Lớp "${selectedClass.name}" sẽ được ẩn khỏi danh sách hoạt động. Bạn có thể khôi phục lại sau.`,
                          confirmText: 'Ẩn lớp',
                          onConfirm: () => runConfirm(() => archiveClass(selectedClass))
                        })}
                        className="rounded-xl font-black border-red-100 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Ẩn lớp
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-primary" /> Danh sách buổi học
                  <Badge className="rounded-lg bg-primary/10 text-primary border-none font-black">{sessionsTotal} buổi</Badge>
                </h3>
                <div className="relative sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={sessionSearch}
                    onChange={e => setSessionSearch(e.target.value)}
                    className="h-10 rounded-xl font-bold pl-9 text-sm"
                    placeholder="Tìm buổi học theo tên..."
                  />
                </div>
              </div>

              <div className="grid gap-4">
                {sessionsLoading && (
                  <div className="rounded-[2rem] border border-gray-100 bg-white p-10 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                  </div>
                )}
                {!sessionsLoading && sessions.length === 0 && (
                  <div className="rounded-[2rem] border border-dashed border-gray-200 bg-white p-10 text-center">
                    <CalendarClock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="font-black text-gray-500">{sessionSearchDebounced ? 'Không tìm thấy buổi học phù hợp.' : 'Lớp này chưa có buổi học.'}</p>
                  </div>
                )}
                {!sessionsLoading && sessions.map((session) => (
                  <div key={session._id} className="bg-white rounded-[2rem] border border-gray-100 shadow-lg p-5">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="min-w-0 space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-xl font-black text-gray-900">{session.title}</h3>
                          {session.scheduleLabel && <Badge className="rounded-lg bg-blue-50 text-blue-600 border-none font-black">{session.scheduleLabel}</Badge>}
                        </div>
                        <p className="text-sm font-bold text-gray-500 flex items-center">
                          <CalendarClock className="mr-2 h-4 w-4 text-primary" /> {formatDateTime(session.startAt)} - {formatDateTime(session.endAt)}
                        </p>
                        {session.googleMeetLink && (
                          <a href={session.googleMeetLink} target="_blank" rel="noreferrer" className="inline-flex items-center text-sm font-black text-blue-600">
                            <LinkIcon className="mr-2 h-4 w-4" /> Google Meet
                          </a>
                        )}
                        <p className="text-sm text-gray-500 line-clamp-3">{session.content || 'Chưa có nội dung mô tả buổi học.'}</p>
                        <div className="grid sm:grid-cols-3 gap-2 pt-2">
                          <div className="rounded-2xl bg-gray-50 p-3">
                            <p className="text-[10px] font-black uppercase text-gray-400">Từ vựng</p>
                            <p className="font-black text-gray-900">{session.vocabularyIds?.length || 0} từ • {(session.vocabularyIds || []).reduce((sum, item) => sum + (item.questions?.length || 0), 0)} câu khảo</p>
                          </div>
                          <div className="rounded-2xl bg-gray-50 p-3">
                            <p className="text-[10px] font-black uppercase text-gray-400">Bài tập</p>
                            <p className="font-black text-gray-900">{session.exercises?.length || 0} câu</p>
                          </div>
                          <div className="rounded-2xl bg-gray-50 p-3">
                            <p className="text-[10px] font-black uppercase text-gray-400">Feedback trước</p>
                            <p className="font-black text-gray-900">{formatDateTime(session.feedbackDeadline)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex lg:flex-col gap-2 shrink-0">
                        <Button onClick={() => openStats(session)} className="rounded-xl font-black chinese-gradient text-white shadow-lg">
                          <BarChart3 className="mr-2 h-4 w-4" /> Thống kê
                        </Button>
                        <Button variant="outline" onClick={() => openRoster(session)} className="rounded-xl font-black border-gray-200">
                          <UserCheck className="mr-2 h-4 w-4" /> Điểm danh
                        </Button>
                        <Button variant="outline" onClick={() => openEditSession(session)} className="rounded-xl font-black border-gray-200">
                          <Edit className="mr-2 h-4 w-4" /> Sửa
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setConfirmState({
                            title: 'Xóa buổi học?',
                            description: `Buổi "${session.title}" cùng toàn bộ feedback, kết quả khảo bài/bài tập và đơn xin nghỉ của buổi này sẽ bị xóa vĩnh viễn.`,
                            confirmText: 'Xóa buổi học',
                            onConfirm: () => runConfirm(() => deleteSession(session))
                          })}
                          className="rounded-xl font-black border-red-100 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Xóa
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {sessionsTotal > sessionPageSize && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <Pagination
                    total={sessionsTotal}
                    page={sessionPage}
                    pageSize={sessionPageSize}
                    onPageChange={setSessionPage}
                    onPageSizeChange={setSessionPageSize}
                    pageSizeOptions={[5, 10, 20, 50]}
                    itemLabel="buổi"
                  />
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <Dialog open={classDialogOpen} onOpenChange={setClassDialogOpen}>
        <DialogContent className="sm:max-w-5xl rounded-[2rem] border-none shadow-2xl p-5 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-gray-900 flex items-center gap-3">
              <GraduationCap className="h-7 w-7 text-primary" /> {classForm._id ? 'Cập nhật lớp học' : 'Tạo lớp học mới'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={saveClass} className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tên lớp học</Label>
                <Input value={classForm.name} onChange={e => setClassForm({ ...classForm, name: e.target.value })} className="h-12 rounded-xl font-bold" required />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Mô tả</Label>
                <Textarea value={classForm.description} onChange={e => setClassForm({ ...classForm, description: e.target.value })} className="min-h-28 rounded-xl font-medium" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Số lượng</Label>
                  <Input type="number" min={1} value={classForm.capacity} onChange={e => setClassForm({ ...classForm, capacity: Number(e.target.value) })} className="h-12 rounded-xl font-black" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Học phí</Label>
                  <Input type="number" min={0} value={classForm.tuitionFee} onChange={e => setClassForm({ ...classForm, tuitionFee: Number(e.target.value) })} className="h-12 rounded-xl font-black" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Link nhóm lớp nếu có</Label>
                <Input value={classForm.groupLink} onChange={e => setClassForm({ ...classForm, groupLink: e.target.value })} className="h-12 rounded-xl font-bold" placeholder="https://..." />
              </div>
            </div>
            <div className="space-y-5">
              <ToggleList
                title="Giáo viên"
                items={teachers}
                selected={classForm.teacherIds}
                onChange={teacherIds => setClassForm({ ...classForm, teacherIds })}
                emptyText="Chưa có giáo viên"
                searchable
                searchPlaceholder="Tìm giáo viên theo tên hoặc email..."
                getSearchText={(teacher) => `${teacher.name} ${teacher.email}`}
                renderItem={(teacher) => (
                  <>
                    <p className="font-black text-gray-900 truncate">{teacher.name}</p>
                    <p className="text-xs font-medium text-gray-500 truncate">{teacher.email}</p>
                  </>
                )}
              />
              <ToggleList
                title="Học viên"
                items={students}
                selected={classForm.studentIds}
                onChange={studentIds => setClassForm({ ...classForm, studentIds })}
                emptyText="Chưa có học viên"
                searchable
                searchPlaceholder="Tìm học viên theo tên hoặc email..."
                getSearchText={(student) => `${student.name} ${student.email}`}
                renderItem={(student) => (
                  <>
                    <p className="font-black text-gray-900 truncate">{student.name}</p>
                    <p className="text-xs font-medium text-gray-500 truncate">{student.email}</p>
                  </>
                )}
              />
              <Button type="submit" disabled={saving} className="w-full h-13 rounded-2xl chinese-gradient text-white font-black shadow-xl">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Lưu lớp học
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={studentDialogOpen} onOpenChange={setStudentDialogOpen}>
        <DialogContent className="sm:max-w-2xl rounded-[2rem] border-none shadow-2xl p-5 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-gray-900 flex items-center gap-3">
              <Users className="h-7 w-7 text-primary" /> Quản lý học viên
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={saveStudents} className="space-y-5">
            <p className="text-sm font-medium text-gray-500">
              Lớp <span className="font-black text-gray-900">{selectedClass?.name}</span> • Thêm hoặc bỏ học viên khỏi lớp.
            </p>
            <ToggleList
              title="Học viên trong lớp"
              items={students}
              selected={studentForm}
              onChange={setStudentForm}
              emptyText="Chưa có học viên"
              searchable
              searchPlaceholder="Tìm học viên theo tên hoặc email..."
              getSearchText={(student) => `${student.name} ${student.email}`}
              renderItem={(student) => (
                <>
                  <p className="font-black text-gray-900 truncate">{student.name}</p>
                  <p className="text-xs font-medium text-gray-500 truncate">{student.email}</p>
                </>
              )}
            />
            <Button type="submit" disabled={saving} className="w-full h-13 rounded-2xl chinese-gradient text-white font-black shadow-xl">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Lưu học viên
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
        <DialogContent className="sm:max-w-6xl rounded-[2rem] border-none shadow-2xl p-5 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-gray-900 flex items-center gap-3">
              <CalendarClock className="h-7 w-7 text-primary" /> {sessionForm._id ? 'Cập nhật buổi học' : 'Tạo buổi học'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={saveSession} className="grid lg:grid-cols-[1fr_1.1fr] gap-8">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tên buổi học</Label>
                <Input value={sessionForm.title} onChange={e => setSessionForm({ ...sessionForm, title: e.target.value })} className="h-12 rounded-xl font-bold" required />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Bắt đầu</Label>
                  <Input type="datetime-local" value={sessionForm.startAt} onChange={e => setSessionForm({ ...sessionForm, startAt: e.target.value })} className="h-12 rounded-xl font-black" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Thời lượng phút</Label>
                  <Input type="number" min={15} value={sessionForm.durationMinutes} onChange={e => setSessionForm({ ...sessionForm, durationMinutes: Number(e.target.value) })} className="h-12 rounded-xl font-black" />
                </div>
              </div>
              {!sessionForm._id && (
                <div className="rounded-2xl bg-gray-50 p-4 space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Lặp hàng tuần</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {dayOptions.map(day => {
                      const active = sessionForm.recurringDays.includes(day.value)
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => setSessionForm({
                            ...sessionForm,
                            recurringDays: active ? sessionForm.recurringDays.filter(item => item !== day.value) : [...sessionForm.recurringDays, day.value]
                          })}
                          className={`h-11 rounded-xl border text-xs font-black ${active ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 bg-white text-gray-500'}`}
                        >
                          {day.label}
                        </button>
                      )
                    })}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Lặp đến ngày</Label>
                    <Input type="date" value={sessionForm.repeatUntil} onChange={e => setSessionForm({ ...sessionForm, repeatUntil: e.target.value })} className="h-11 rounded-xl font-bold" />
                    <p className="text-[11px] font-medium text-gray-400">Ví dụ chọn Thứ 2, Thứ 4, Thứ 6 lúc 20:00 để tạo lịch hàng tuần.</p>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Google Meet</Label>
                <Input value={sessionForm.googleMeetLink} onChange={e => setSessionForm({ ...sessionForm, googleMeetLink: e.target.value })} className="h-12 rounded-xl font-bold" placeholder="https://meet.google.com/..." />
              </div>
              {isRecurringCreate ? (
                <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
                  <p className="text-sm font-black text-amber-700">Tạo lịch lặp</p>
                  <p className="mt-1 text-xs font-medium text-amber-600 leading-relaxed">
                    Chỉ tạo các buổi học trống theo lịch. Nội dung, từ vựng, bài tập và deadline sẽ được thêm riêng cho từng buổi sau khi tạo (bấm "Sửa" ở mỗi buổi). Deadline được tự tính: từ vựng trước giờ học, bài tập trước buổi kế tiếp, feedback trong ngày học.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nội dung buổi học</Label>
                    <Textarea value={sessionForm.content} onChange={e => setSessionForm({ ...sessionForm, content: e.target.value })} className="min-h-32 rounded-xl font-medium" />
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Deadline từ vựng</Label>
                      <Input type="datetime-local" value={sessionForm.vocabularyDeadline} onChange={e => setSessionForm({ ...sessionForm, vocabularyDeadline: e.target.value })} className="h-11 rounded-xl text-xs font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Deadline bài tập</Label>
                      <Input type="datetime-local" value={sessionForm.exerciseDeadline} onChange={e => setSessionForm({ ...sessionForm, exerciseDeadline: e.target.value })} className="h-11 rounded-xl text-xs font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Deadline feedback</Label>
                      <Input type="datetime-local" value={sessionForm.feedbackDeadline} onChange={e => setSessionForm({ ...sessionForm, feedbackDeadline: e.target.value })} className="h-11 rounded-xl text-xs font-bold" />
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="space-y-5">
              {isRecurringCreate ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 p-6 text-center space-y-2">
                  <CalendarClock className="h-10 w-10 text-gray-300 mx-auto" />
                  <p className="font-black text-gray-500">Buổi lặp chỉ tạo lịch trống</p>
                  <p className="text-xs font-medium text-gray-400 leading-relaxed">
                    Sau khi tạo, vào từng buổi và bấm "Sửa" để thêm từ vựng (khảo bài) và bài tập riêng cho buổi đó.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <Input
                      value={contentSearch}
                      onChange={e => setContentSearch(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); fetchContent(contentSearch) } }}
                      className="h-11 rounded-xl font-bold"
                      placeholder="Tìm từ vựng / bài tập..."
                    />
                    <Button type="button" variant="outline" onClick={() => fetchContent(contentSearch)} className="h-11 rounded-xl font-black">Tìm</Button>
                  </div>
                  <ToggleList
                    title={`Từ vựng cho buổi học (kho ${vocabulariesTotal})`}
                    items={vocabularies}
                    selected={sessionForm.vocabularyIds}
                    onChange={vocabularyIds => setSessionForm({ ...sessionForm, vocabularyIds })}
                    emptyText="Không tìm thấy từ vựng. Hãy gõ từ khóa để tìm trong kho."
                    renderItem={(vocab) => (
                      <>
                        <p className="font-black text-gray-900 truncate">{vocab.word} <span className="text-xs text-gray-400">{vocab.pinyin}</span></p>
                        <p className="text-xs font-medium text-gray-500 truncate">{vocab.meaning}</p>
                        <p className="text-[10px] font-black text-primary mt-1">{vocab.questions?.length || 0} câu khảo từ vựng</p>
                      </>
                    )}
                  />
                  <ToggleList
                    title={`Bài tập từ ngân hàng đề thi (kho ${exercisesTotal})`}
                    items={exercises}
                    selected={sessionForm.exerciseIds}
                    onChange={exerciseIds => setSessionForm({ ...sessionForm, exerciseIds })}
                    emptyText="Chưa có câu hỏi nào. Hãy tạo đề trong menu Bài test (/admin/tests)."
                    renderItem={(exercise) => (
                      <>
                        <p className="font-black text-gray-900 line-clamp-2">{exercise.question}</p>
                        <p className="text-[10px] font-black text-gray-400 mt-1">
                          {exercise.testTitle ? `${exercise.testTitle} • ` : ''}Level {exercise.level ?? '-'} • {exercise.questionType}
                        </p>
                      </>
                    )}
                  />
                </>
              )}
              <Button type="submit" disabled={saving} className="w-full h-13 rounded-2xl chinese-gradient text-white font-black shadow-xl">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Lưu buổi học
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rosterSession} onOpenChange={(open) => !open && setRosterSession(null)}>
        <DialogContent className="sm:max-w-6xl rounded-[2rem] border-none shadow-2xl p-5 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-gray-900 flex items-center gap-3">
              <UserCheck className="h-7 w-7 text-primary" /> Điểm danh và feedback
            </DialogTitle>
          </DialogHeader>
          {rosterLoading ? (
            <div className="py-16 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-4 max-h-[72vh] overflow-y-auto pr-1">
              {roster.length > rosterPageSize && (
                <Pagination
                  total={roster.length}
                  page={rosterPage}
                  pageSize={rosterPageSize}
                  onPageChange={setRosterPage}
                  onPageSizeChange={setRosterPageSize}
                  pageSizeOptions={[5, 10, 20]}
                  itemLabel="học viên"
                  className="pb-2 border-b border-gray-100"
                />
              )}
              {pagedRoster.map((item) => {
                const edit = rosterEdits[item.student._id] || { status: 'submitted', confirmation: 'pending', reason: '', note: '' }
                const latestVocabulary = item.submissions.find(sub => sub.type === 'vocabulary')
                const latestExercise = item.submissions.find(sub => sub.type === 'exercise')
                return (
                  <div key={item.student._id} className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                    <div className="grid xl:grid-cols-[1fr_1.2fr] gap-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="h-11 w-11 rounded-2xl chinese-gradient text-white flex items-center justify-center font-black shrink-0">
                            {item.student.name?.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-gray-900">{item.student.name}</p>
                            <p className="text-xs font-medium text-gray-500">{item.student.email}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge className={item.feedback?.submittedByStudent ? 'bg-emerald-50 text-emerald-600 border-none' : 'bg-amber-50 text-amber-600 border-none'}>
                            {item.feedback?.submittedByStudent ? 'Có feedback' : 'Chưa có feedback'}
                          </Badge>
                          {item.leaveRequest && (
                            <Badge className="bg-blue-50 text-blue-600 border-none">Xin nghỉ: {item.leaveRequest.status}</Badge>
                          )}
                          {latestVocabulary && <Badge className="bg-purple-50 text-purple-600 border-none">Từ vựng {latestVocabulary.correctCount}/{latestVocabulary.totalQuestions}</Badge>}
                          {latestExercise && <Badge className="bg-indigo-50 text-indigo-600 border-none">Bài tập {latestExercise.correctCount}/{latestExercise.totalQuestions}</Badge>}
                        </div>
                        {item.feedback?.submittedByStudent && (
                          <div className="rounded-xl bg-white p-3 text-sm text-gray-600 space-y-1">
                            <p><span className="font-black">Tham gia:</span> {ATTENDANCE_LABELS[item.feedback.attendanceChoice] || item.feedback.attendanceChoice}</p>
                            {item.feedback.attendanceReason && <p><span className="font-black">Lý do:</span> {item.feedback.attendanceReason}</p>}
                            <p><span className="font-black">Hiểu bài:</span> {item.feedback.understandingPercent}% • <span className="font-black">GV:</span> {item.feedback.teacherRating}/5 • <span className="font-black">Hài lòng:</span> {item.feedback.satisfactionRating}/5</p>
                            {item.feedback.unansweredQuestions && <p><span className="font-black">Chưa hiểu:</span> {item.feedback.unansweredQuestions}</p>}
                            {item.feedback.additionalComment && <p><span className="font-black">Góp ý:</span> {item.feedback.additionalComment}</p>}
                          </div>
                        )}
                        {item.leaveRequest && (
                          <div className="rounded-xl bg-white p-3">
                            <p className="text-sm font-bold text-gray-600">Lý do nghỉ: {item.leaveRequest.reason}</p>
                            <div className="mt-3 flex gap-2">
                              <Button size="sm" onClick={() => reviewLeave(item.student._id, 'approved')} className="rounded-lg bg-emerald-600 font-black">Duyệt</Button>
                              <Button size="sm" variant="outline" onClick={() => reviewLeave(item.student._id, 'rejected')} className="rounded-lg font-black border-red-100 text-red-500">Từ chối</Button>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">GV xác nhận</Label>
                          <select value={edit.confirmation} onChange={e => setRosterEdits({ ...rosterEdits, [item.student._id]: { ...edit, confirmation: e.target.value } })} className="h-11 w-full rounded-xl border border-gray-100 bg-white px-3 text-sm font-bold">
                            <option value="pending">Chưa xác nhận</option>
                            <option value="present">Có mặt</option>
                            <option value="absent">Vắng</option>
                            <option value="excused">Xin nghỉ</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Trạng thái feedback</Label>
                          <select value={edit.status} onChange={e => setRosterEdits({ ...rosterEdits, [item.student._id]: { ...edit, status: e.target.value } })} className="h-11 w-full rounded-xl border border-gray-100 bg-white px-3 text-sm font-bold">
                            <option value="submitted">Đã gửi</option>
                            <option value="teacher_seen">Giáo viên đã xem</option>
                            <option value="needs_action">Cần xử lý</option>
                            <option value="resolved">Đã xử lý</option>
                          </select>
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Lý do/ghi chú</Label>
                          <Textarea value={edit.reason} onChange={e => setRosterEdits({ ...rosterEdits, [item.student._id]: { ...edit, reason: e.target.value } })} className="min-h-16 rounded-xl bg-white" placeholder="Lý do chỉnh trạng thái..." />
                          <Textarea value={edit.note} onChange={e => setRosterEdits({ ...rosterEdits, [item.student._id]: { ...edit, note: e.target.value } })} className="min-h-16 rounded-xl bg-white" placeholder="Ghi chú xử lý feedback..." />
                        </div>
                        <Button onClick={() => saveRosterStatus(item.student._id)} className="sm:col-span-2 rounded-xl chinese-gradient text-white font-black">
                          <CheckCircle2 className="mr-2 h-4 w-4" /> Lưu trạng thái học viên
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!statsSession} onOpenChange={(open) => !open && setStatsSession(null)}>
        <DialogContent className="sm:max-w-6xl rounded-[2rem] border-none shadow-2xl p-5 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-gray-900 flex items-center gap-3">
              <BarChart3 className="h-7 w-7 text-primary" /> Thống kê buổi học
            </DialogTitle>
          </DialogHeader>
          {statsLoading ? (
            <div className="py-16 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-5 max-h-[74vh] overflow-y-auto pr-1">
              <p className="text-sm font-bold text-gray-500">{statsSession?.title} • {formatDateTime(statsSession?.startAt)}</p>

              {/* Summary cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Sĩ số', value: statsSummary.total, sub: `${statsSummary.feedbackCount} đã feedback`, icon: Users },
                  { label: 'Điểm danh', value: `${statsSummary.present}/${statsSummary.total}`, sub: statsSummary.total ? `${Math.round((statsSummary.present / statsSummary.total) * 100)}% có mặt` : '0%', icon: UserCheck },
                  { label: 'Khảo từ vựng', value: `${statsSummary.vocabDone}/${statsSummary.total}`, sub: `TB ${statsSummary.avgVocab}%`, icon: ClipboardList },
                  { label: 'Bài tập', value: `${statsSummary.exerciseDone}/${statsSummary.total}`, sub: `TB ${statsSummary.avgExercise}%`, icon: TrendingUp }
                ].map((card) => {
                  const CardIcon = card.icon
                  return (
                    <div key={card.label} className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{card.label}</p>
                        <CardIcon className="h-4 w-4 text-primary" />
                      </div>
                      <p className="mt-2 text-2xl font-black text-gray-900">{card.value}</p>
                      <p className="text-[11px] font-bold text-gray-400">{card.sub}</p>
                    </div>
                  )
                })}
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-2xl bg-primary/5 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Mức hiểu bài TB</p>
                  <p className="mt-1 text-xl font-black text-primary">{statsSummary.avgUnderstanding}%</p>
                </div>
                <div className="rounded-2xl bg-primary/5 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Hài lòng TB</p>
                  <p className="mt-1 text-xl font-black text-primary">{statsSummary.avgSatisfaction}/5</p>
                </div>
              </div>

              {/* Per-student table */}
              <div className="overflow-x-auto rounded-2xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">
                      <th className="px-3 py-3">Học viên</th>
                      <th className="px-3 py-3">Tham gia</th>
                      <th className="px-3 py-3 text-center">Khảo từ vựng</th>
                      <th className="px-3 py-3 text-center">Bài tập</th>
                      <th className="px-3 py-3 text-center">Hiểu bài</th>
                      <th className="px-3 py-3 text-center">GV ĐG</th>
                      <th className="px-3 py-3 text-center">Hài lòng</th>
                      <th className="px-3 py-3">Feedback</th>
                      <th className="px-3 py-3">GV xác nhận</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statsRoster.map((item) => {
                      const fb: any = item.feedback
                      const v = latestOf(item, 'vocabulary')
                      const e = latestOf(item, 'exercise')
                      return (
                        <tr key={item.student._id} className="border-t border-gray-100 hover:bg-gray-50/60">
                          <td className="px-3 py-3">
                            <p className="font-black text-gray-900">{item.student.name}</p>
                            <p className="text-[11px] font-medium text-gray-400">{item.student.email}</p>
                          </td>
                          <td className="px-3 py-3 font-bold text-gray-600">
                            {fb?.submittedByStudent ? (ATTENDANCE_LABELS[fb.attendanceChoice] || '—') : (item.leaveRequest && item.leaveRequest.status !== 'cancelled' ? 'Xin nghỉ' : '—')}
                          </td>
                          <td className="px-3 py-3 text-center font-black">
                            {v ? <span className={scoreColor(v.scorePercent)}>{v.correctCount}/{v.totalQuestions}</span> : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-3 py-3 text-center font-black">
                            {e ? <span className={scoreColor(e.scorePercent)}>{e.correctCount}/{e.totalQuestions}</span> : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-3 py-3 text-center font-bold text-gray-600">{fb?.submittedByStudent ? `${fb.understandingPercent}%` : '—'}</td>
                          <td className="px-3 py-3 text-center font-bold text-gray-600">{fb?.submittedByStudent ? `${fb.teacherRating}/5` : '—'}</td>
                          <td className="px-3 py-3 text-center font-bold text-gray-600">{fb?.submittedByStudent ? `${fb.satisfactionRating}/5` : '—'}</td>
                          <td className="px-3 py-3">
                            {fb?.submittedByStudent
                              ? <Badge className="rounded-lg bg-emerald-50 text-emerald-600 border-none text-[10px]">{FEEDBACK_STATUS_LABELS[fb.status] || 'Đã gửi'}</Badge>
                              : <Badge className="rounded-lg bg-amber-50 text-amber-600 border-none text-[10px]">Chưa có</Badge>}
                          </td>
                          <td className="px-3 py-3 font-bold text-gray-600">{CONFIRMATION_LABELS[fb?.teacherConfirmationStatus] || 'Chưa xác nhận'}</td>
                        </tr>
                      )
                    })}
                    {statsRoster.length === 0 && (
                      <tr><td colSpan={9} className="px-3 py-10 text-center font-bold text-gray-400">Lớp chưa có học viên.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog state={confirmState} loading={confirmLoading} onClose={() => setConfirmState(null)} />
    </div>
  )
}

export const AdminClasses = () => <ClassManagement mode="admin" />
export const TeacherClasses = () => (
  <div className="min-h-screen bg-[#fdfaf6] p-4 sm:p-6 md:p-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
    <div className="max-w-7xl mx-auto">
      <ClassManagement mode="teacher" />
    </div>
  </div>
)
