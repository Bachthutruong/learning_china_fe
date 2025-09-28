import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { Badge } from '../../components/ui/badge'
import { Dialog, DialogContent, DialogHeader as UIDialogHeader, DialogTitle as UIDialogTitle, DialogFooter } from '../../components/ui/dialog'
import { api } from '../../services/api'
import toast from 'react-hot-toast'
import { Plus, Save, Trash2, ChevronLeft } from 'lucide-react'

type LevelKey = 'A' | 'B' | 'C'

interface Question { question: string; options: string[]; correctAnswer: number | number[]; questionType?: 'single' | 'multiple' }
interface ProficiencyTestDoc { _id?: string; level: LevelKey; questions: Question[]; timeLimit?: number; requiredCoins: number; rewardExperience: number; rewardCoins: number }

export const AdminProficiencyLevel = () => {
  const { level: levelParam } = useParams()
  const level = (levelParam?.toUpperCase?.() || 'A') as LevelKey
  const [doc, setDoc] = useState<ProficiencyTestDoc | null>(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [draft, setDraft] = useState<Question | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteIdx, setDeleteIdx] = useState<number | null>(null)

  useEffect(() => { fetchDoc() }, [level])

  const fetchDoc = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/proficiency/${level}`)
      setDoc(res.data)
    } catch (e) {
      // if not exists, init skeleton
      setDoc({ level, questions: [], timeLimit: 30, requiredCoins: 0, rewardExperience: 0, rewardCoins: 0 })
    } finally { setLoading(false) }
  }

  const filtered = useMemo(() => {
    if (!doc) return []
    if (!search.trim()) return doc.questions
    return doc.questions.filter(q => q.question?.toLowerCase().includes(search.toLowerCase()))
  }, [doc, search])

  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize)

  const updateDoc = (patch: Partial<ProficiencyTestDoc>) => setDoc(prev => prev ? ({ ...prev, ...patch }) : prev)
  // const updateQ = (idx: number, patch: Partial<Question>) => {
  //   if (!doc) return
  //   const qs = [...doc.questions]
  //   qs[idx] = { ...qs[idx], ...patch }
  //   setDoc({ ...doc, questions: qs })
  // }

  const addQuestion = () => {
    if (!doc) return
    const q: Question = { question: '', options: ['', '', '', ''], correctAnswer: 0, questionType: 'single' }
    setEditingIdx(doc.questions.length)
    setDraft(q)
    setDialogOpen(true)
  }

  const removeQuestion = (idx: number) => {
    setDeleteIdx(idx)
  }

  const save = async () => {
    if (!doc) return
    try {
      setLoading(true)
      if (doc._id) await api.put(`/proficiency/${level}`, doc)
      else await api.post('/proficiency', doc)
      toast.success('Đã lưu')
      fetchDoc()
    } catch (e) { toast.error('Lưu thất bại') } finally { setLoading(false) }
  }

  const openEditor = (idx: number) => {
    if (!doc) return
    setEditingIdx(idx)
    setDraft({ ...doc.questions[idx] })
    setDialogOpen(true)
  }

  const saveEditor = () => {
    if (!doc || draft == null || editingIdx == null) return
    const qs = [...doc.questions]
    qs[editingIdx] = draft
    setDoc({ ...doc, questions: qs })
    setDialogOpen(false)
    setDraft(null)
    setEditingIdx(null)
  }

  if (!doc) return null

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline"><a href="/admin/proficiency"><ChevronLeft className="h-4 w-4" /></a></Button>
          <h1 className="text-2xl font-bold">Level {level}</h1>
          <Badge variant="secondary">{doc.questions.length} câu hỏi</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Input placeholder="Tìm câu hỏi" value={search} onChange={e => { setPage(1); setSearch(e.target.value) }} className="w-64" />
          <select className="border rounded px-2 py-1" value={pageSize} onChange={e => { setPage(1); setPageSize(parseInt(e.target.value)) }}>
            <option value={5}>5 / trang</option>
            <option value={10}>10 / trang</option>
            <option value={20}>20 / trang</option>
            <option value={50}>50 / trang</option>
          </select>
          <Button onClick={save} disabled={loading} className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"><Save className="h-4 w-4 mr-1" /> Lưu</Button>
        </div>
      </div>

      {/* Config */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-sm text-gray-600">Cấu hình</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            <div><label className="text-xs text-gray-500">Thời gian (phút)</label><Input type="number" value={doc.timeLimit ?? 30} onChange={e => updateDoc({ timeLimit: parseInt(e.target.value || '0') })} /></div>
            <div><label className="text-xs text-gray-500">Xu yêu cầu</label><Input type="number" value={doc.requiredCoins} onChange={e => updateDoc({ requiredCoins: parseInt(e.target.value || '0') })} /></div>
            <div><label className="text-xs text-gray-500">XP thưởng</label><Input type="number" value={doc.rewardExperience} onChange={e => updateDoc({ rewardExperience: parseInt(e.target.value || '0') })} /></div>
            <div><label className="text-xs text-gray-500">Xu thưởng</label><Input type="number" value={doc.rewardCoins} onChange={e => updateDoc({ rewardCoins: parseInt(e.target.value || '0') })} /></div>
          </div>
        </CardContent>
      </Card>

      {/* Table (compact) */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Danh sách câu hỏi</CardTitle>
            <Button onClick={addQuestion}><Plus className="h-4 w-4 mr-1" /> Thêm câu</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-4">#</th>
                  <th className="py-2 pr-4 w-2/5">Câu hỏi</th>
                  <th className="py-2 pr-4">Loại</th>
                  <th className="py-2 pr-4">Số phương án</th>
                  <th className="py-2 pr-4">Đúng</th>
                  <th className="py-2">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((q, i) => {
                  const idx = (page - 1) * pageSize + i
                  return (
                    <tr key={idx} className="border-t">
                      <td className="py-2 pr-4">{idx + 1}</td>
                      <td className="py-2 pr-4"><div className="line-clamp-2 max-w-xl text-gray-800">{q.question || '—'}</div></td>
                      <td className="py-2 pr-4">{q.questionType === 'multiple' ? <Badge>Nhiều đáp án</Badge> : <Badge variant="outline">Một đáp án</Badge>}</td>
                      <td className="py-2 pr-4">{q.options.length}</td>
                      <td className="py-2 pr-4">{Array.isArray(q.correctAnswer) ? (q.correctAnswer as number[]).map(v => String.fromCharCode(65 + v)).join(', ') : String.fromCharCode(65 + (typeof q.correctAnswer === 'number' ? q.correctAnswer : 0))}</td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditor(idx)}>Sửa</Button>
                          <Button variant="outline" size="sm" className="text-red-600" onClick={() => removeQuestion(idx)}>
                          <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-3 text-sm">
            <div>Tổng {filtered.length} câu hỏi</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Trước</Button>
              <Badge variant="outline">Trang {page}</Badge>
              <Button variant="outline" size="sm" disabled={page * pageSize >= filtered.length} onClick={() => setPage(p => p + 1)}>Sau</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit / Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <UIDialogHeader>
            <UIDialogTitle>{editingIdx != null ? `Sửa câu hỏi #${(editingIdx || 0) + 1}` : 'Thêm câu hỏi'}</UIDialogTitle>
          </UIDialogHeader>
          {draft && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500">Câu hỏi</label>
                <Textarea value={draft.question} onChange={e => setDraft({ ...draft, question: e.target.value })} />
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Loại</label>
                  <select className="border rounded px-2 py-2 w-full" value={draft.questionType || 'single'} onChange={e => setDraft({ ...draft, questionType: e.target.value as any })}>
                    <option value="single">Một đáp án</option>
                    <option value="multiple">Nhiều đáp án</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Số phương án: {draft.options.length}</label>
                  <div>
                    <Button size="sm" onClick={() => setDraft({ ...draft, options: [...draft.options, ''] })}><Plus className="h-4 w-4 mr-1" /> Thêm phương án</Button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {draft.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs w-5">{String.fromCharCode(65 + i)}.</span>
                    <Input value={opt} onChange={e => {
                      const arr = [...draft.options]; arr[i] = e.target.value; setDraft({ ...draft, options: arr })
                    }} />
                    <Button variant="outline" size="sm" onClick={() => {
                      const arr = draft.options.filter((_, j) => j !== i)
                      let next: number | number[] = draft.correctAnswer
                      if (Array.isArray(next)) next = next.filter(v => v !== i).map(v => v > i ? v - 1 : v)
                      else if (typeof next === 'number') next = next > i ? next - 1 : next
                      setDraft({ ...draft, options: arr, correctAnswer: next })
                    }} className="text-red-600">Xóa</Button>
                  </div>
                ))}
              </div>
              <div>
                <label className="text-xs text-gray-500">Đáp án đúng</label>
                {draft.questionType === 'multiple' ? (
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {draft.options.map((_, i) => (
                      <label key={i} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={Array.isArray(draft.correctAnswer) ? (draft.correctAnswer as number[]).includes(i) : draft.correctAnswer === i}
                          onChange={e => {
                            let next: number[] = Array.isArray(draft.correctAnswer) ? [...(draft.correctAnswer as number[])] : (typeof draft.correctAnswer === 'number' ? [draft.correctAnswer] : [])
                            if (e.target.checked) next = Array.from(new Set([...next, i]))
                            else next = next.filter(v => v !== i)
                            setDraft({ ...draft, correctAnswer: next })
                          }} /> {String.fromCharCode(65 + i)}
                      </label>
                    ))}
                  </div>
                ) : (
                  <select className="border rounded px-2 py-2" value={typeof draft.correctAnswer === 'number' ? draft.correctAnswer : (Array.isArray(draft.correctAnswer) && draft.correctAnswer.length ? draft.correctAnswer[0] : 0)} onChange={e => setDraft({ ...draft, correctAnswer: parseInt(e.target.value) })}>
                    {draft.options.map((_, i) => (
                      <option key={i} value={i}>{String.fromCharCode(65 + i)}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={saveEditor} className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteIdx !== null} onOpenChange={(open) => { if (!open) setDeleteIdx(null) }}>
        <DialogContent className="max-w-md">
          <UIDialogHeader><UIDialogTitle>Xóa câu hỏi</UIDialogTitle></UIDialogHeader>
          <p className="text-sm text-gray-600">Bạn có chắc muốn xóa câu hỏi này? Hành động không thể hoàn tác.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteIdx(null)}>Hủy</Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={() => { if (deleteIdx !== null && doc) { setDoc({ ...doc, questions: doc.questions.filter((_, i) => i !== deleteIdx) }); setDeleteIdx(null) } }}>Xóa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminProficiencyLevel


