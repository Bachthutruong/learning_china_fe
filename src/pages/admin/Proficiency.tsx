import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { Badge } from '../../components/ui/badge'
import { api } from '../../services/api'
import toast from 'react-hot-toast'
import { Plus, Trash2, Save, Clock, Gem, Star, Settings2, ChevronDown, ChevronRight, Pencil } from 'lucide-react'

type LevelKey = 'A' | 'B' | 'C'

interface Question {
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

interface ProficiencyTestDoc {
  _id?: string
  level: LevelKey
  questions: Question[]
  timeLimit: number
  requiredCoins: number
  rewardExperience: number
  rewardCoins: number
}

export const AdminProficiency = () => {
  const [tests, setTests] = useState<Record<LevelKey, ProficiencyTestDoc | null>>({ A: null, B: null, C: null })
  const [loading, setLoading] = useState(false)
  const [openIndex, setOpenIndex] = useState<Record<LevelKey, number | null>>({ A: null, B: null, C: null })
  const [pageByLevel, setPageByLevel] = useState<Record<LevelKey, number>>({ A: 1, B: 1, C: 1 })
  const pageSize = 5

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      setLoading(true)
      const res = await api.get('/proficiency')
      const byLevel: any = { A: null, B: null, C: null }
      ;(res.data || []).forEach((t: ProficiencyTestDoc) => { byLevel[t.level] = t })
      setTests(byLevel)
    } catch (e) {
      toast.error('Không tải được danh sách bài A/B/C')
    } finally { setLoading(false) }
  }

  const upsert = async (level: LevelKey) => {
    const payload = tests[level]
    if (!payload) return
    try {
      setLoading(true)
      if (payload._id) {
        await api.put(`/proficiency/${level}`, payload)
      } else {
        await api.post('/proficiency', payload)
      }
      toast.success('Lưu thành công')
      fetchAll()
    } catch (e) {
      toast.error('Lưu thất bại')
    } finally { setLoading(false) }
  }

  const remove = async (level: LevelKey) => {
    try {
      setLoading(true)
      await api.delete(`/proficiency/${level}`)
      toast.success('Xóa thành công')
      fetchAll()
    } catch (e) {
      toast.error('Xóa thất bại')
    } finally { setLoading(false) }
  }

  const ensure = (level: LevelKey) => {
    if (!tests[level]) {
      setTests(prev => ({
        ...prev,
        [level]: {
          level,
          questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0 }],
          timeLimit: 30,
          requiredCoins: 0,
          rewardExperience: 0,
          rewardCoins: 0
        }
      }))
    }
  }

  const renderEditor = (level: LevelKey) => {
    const doc = tests[level]
    if (!doc) return (
      <div className="text-center py-8">
        <div className="mx-auto w-16 h-16 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center mb-3">
          <Plus className="h-7 w-7 text-blue-600" />
        </div>
        <p className="text-sm text-gray-500 mb-3">Chưa có dữ liệu cho Level {level}</p>
        <Button variant="default" size="sm" onClick={() => ensure(level)} className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">Tạo mới</Button>
      </div>
    )
    const update = (patch: Partial<ProficiencyTestDoc>) => setTests(prev => ({ ...prev, [level]: { ...(prev[level] as any), ...patch } }))
    const updateQ = (idx: number, qPatch: Partial<Question>) => {
      const qs = [...doc.questions]
      qs[idx] = { ...qs[idx], ...qPatch }
      update({ questions: qs })
    }
    const levelColors: Record<LevelKey, string> = {
      A: 'from-emerald-500 to-green-600',
      B: 'from-blue-500 to-indigo-600',
      C: 'from-purple-500 to-fuchsia-600'
    }
    const accent: Record<LevelKey, string> = {
      A: 'text-emerald-600',
      B: 'text-blue-600',
      C: 'text-purple-600'
    }

    return (
      <div className="space-y-5">
        {/* Config */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
              <Settings2 className={`h-4 w-4 ${accent[level]}`} /> Cấu hình Level {level}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-gray-500 flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Thời gian (phút)</label>
                <Input type="number" value={doc.timeLimit} onChange={e => update({ timeLimit: parseInt(e.target.value || '0') })} />
              </div>
              <div>
                <label className="text-xs text-gray-500 flex items-center gap-1"><Gem className="h-3.5 w-3.5" /> Xu yêu cầu</label>
                <Input type="number" value={doc.requiredCoins} onChange={e => update({ requiredCoins: parseInt(e.target.value || '0') })} />
              </div>
              <div>
                <label className="text-xs text-gray-500 flex items-center gap-1"><Star className="h-3.5 w-3.5" /> XP thưởng</label>
                <Input type="number" value={doc.rewardExperience} onChange={e => update({ rewardExperience: parseInt(e.target.value || '0') })} />
              </div>
              <div>
                <label className="text-xs text-gray-500 flex items-center gap-1"><Gem className="h-3.5 w-3.5" /> Xu thưởng</label>
                <Input type="number" value={doc.rewardCoins} onChange={e => update({ rewardCoins: parseInt(e.target.value || '0') })} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions - compact list with inline expand */}
        <div className="space-y-3">
          {doc.questions
            .slice((pageByLevel[level] - 1) * pageSize, pageByLevel[level] * pageSize)
            .map((q, iLocal) => {
              const idx = (pageByLevel[level] - 1) * pageSize + iLocal
              const isOpen = openIndex[level] === idx
              return (
                <Card key={idx} className={`border ${isOpen ? 'border-blue-300' : 'border-gray-200'}`}>
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center shadow bg-gradient-to-br ${levelColors[level]}`}>{idx + 1}</div>
                        <div>
                          <div className="text-sm font-medium">{q.question?.trim() ? q.question : `Câu hỏi ${idx + 1}`}</div>
                          <div className="text-xs text-gray-500">Đáp án: {String.fromCharCode(65 + (q.correctAnswer || 0))}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setOpenIndex(prev => ({ ...prev, [level]: isOpen ? null : idx }))}>
                          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setOpenIndex(prev => ({ ...prev, [level]: idx }))}>
                          <Pencil className="h-4 w-4 mr-1" /> Sửa
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => update({ questions: doc.questions.filter((_, j) => j !== idx) })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {isOpen && (
                    <CardContent className="space-y-4">
                      <Textarea placeholder="Nội dung câu hỏi" value={q.question} onChange={e => updateQ(idx, { question: e.target.value })} />
                      <div className="grid md:grid-cols-2 gap-3">
                        {q.options.map((opt, i) => (
                          <div key={i} className={`flex items-center gap-2 p-2 rounded-lg border ${q.correctAnswer === i ? 'bg-blue-50 border-blue-200' : 'border-gray-200'}`}>
                            <Button
                              variant={q.correctAnswer === i ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => updateQ(idx, { correctAnswer: i })}
                              className={q.correctAnswer === i ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : ''}
                            >
                              {String.fromCharCode(65 + i)}
                            </Button>
                            <Input placeholder={`Đáp án ${String.fromCharCode(65 + i)}`} value={opt} onChange={e => {
                              const arr = [...q.options]; arr[i] = e.target.value; updateQ(idx, { options: arr })
                            }} />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })}
        </div>

        {/* Pagination + Add */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-gray-500">Tổng {doc.questions.length} câu hỏi</div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pageByLevel[level] === 1}
              onClick={() => setPageByLevel(prev => ({ ...prev, [level]: Math.max(1, prev[level] - 1) }))}
            >
              Trước
            </Button>
            <Badge variant="outline">Trang {pageByLevel[level]}</Badge>
            <Button
              variant="outline"
              size="sm"
              disabled={pageByLevel[level] * pageSize >= doc.questions.length}
              onClick={() => setPageByLevel(prev => ({ ...prev, [level]: prev[level] + 1 }))}
            >
              Sau
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const next = { question: '', options: ['', '', '', ''], correctAnswer: 0 }
                update({ questions: [...doc.questions, next] })
                const newIndex = doc.questions.length
                setPageByLevel(prev => ({ ...prev, [level]: Math.floor(newIndex / pageSize) + 1 }))
                setOpenIndex(prev => ({ ...prev, [level]: newIndex }))
              }}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
            >
              <Plus className="h-4 w-4 mr-1" /> Thêm câu
            </Button>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <Button disabled={loading} onClick={() => upsert(level)} className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
            <Save className="h-4 w-4 mr-1" /> Lưu Level {level}
          </Button>
          {doc._id && (
            <Button variant="destructive" disabled={loading} onClick={() => remove(level)}>
              <Trash2 className="h-4 w-4 mr-1" /> Xóa Level
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý Test năng lực (A/B/C)</h1>
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        {(['A','B','C'] as LevelKey[]).map(lv => (
          <Card key={lv} className="overflow-hidden border-0 shadow">
            <div className={`h-1.5 w-full bg-gradient-to-r ${lv === 'A' ? 'from-emerald-400 to-green-500' : lv === 'B' ? 'from-blue-400 to-indigo-500' : 'from-purple-400 to-fuchsia-500'}`}></div>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Level {lv}</CardTitle>
                {tests[lv]?.questions && (
                  <Badge variant="secondary">{tests[lv]?.questions.length || 0} câu hỏi</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>{renderEditor(lv)}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default AdminProficiency


