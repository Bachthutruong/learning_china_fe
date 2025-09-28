import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { Badge } from '../../components/ui/badge'
import { api } from '../../services/api'
import { ArrowLeft, Plus, Save } from 'lucide-react'
import { CardDescription } from '../../components/ui/card'

interface LevelItem { _id: string; name: string; number?: number; level?: number }

interface CompetitionForm {
  _id?: string
  title: string
  description: string
  level: string
  startDate: string
  endDate: string
  cost: number
  reward: { xp: number, coins: number }
  prizes: { first: { xp: number, coins: number }, second: { xp: number, coins: number }, third: { xp: number, coins: number } }
  questions: Array<{ question: string; options: string[]; correctAnswer: number | number[]; questionType?: 'single' | 'multiple' }>
}

export const AdminCompetitionEdit = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id || id === 'new'

  const [levels, setLevels] = useState<LevelItem[]>([])
  const [form, setForm] = useState<CompetitionForm>({
    title: '', description: '', level: 'All',
    startDate: new Date().toISOString().slice(0,16),
    endDate: new Date(Date.now()+3600_000).toISOString().slice(0,16),
    cost: 0, reward: { xp: 0, coins: 0 },
    prizes: { first: { xp: 100, coins: 50 }, second: { xp: 70, coins: 30 }, third: { xp: 40, coins: 20 } },
    questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0, questionType: 'single' }]
  })

  useEffect(() => {
    fetchLevels()
    if (!isNew) fetchCompetition(id as string)
  }, [id])

  const fetchLevels = async () => {
    try {
      const res = await api.get('/admin/levels')
      const arr = res.data.levels || res.data || []
      setLevels(arr)
    } catch (e) {
      setLevels([])
    }
  }

  const fetchCompetition = async (compId: string) => {
    try {
      const res = await api.get('/admin/competitions')
      const found = (res.data?.competitions || []).find((c: any) => c._id === compId)
      if (found) {
        setForm({
          _id: found._id,
          title: found.title,
          description: found.description,
          level: found.level,
          startDate: (found.startDate || new Date()).toString().slice(0,16),
          endDate: (found.endDate || new Date()).toString().slice(0,16),
          cost: found.cost || 0,
          reward: found.reward || { xp: 0, coins: 0 },
          prizes: found.prizes || { first: { xp: 100, coins: 50 }, second: { xp: 70, coins: 30 }, third: { xp: 40, coins: 20 } },
          questions: (found.questions || []).map((q: any) => ({
            question: q.question,
            options: q.options || [],
            correctAnswer: q.correctAnswer,
            questionType: q.questionType || (Array.isArray(q.correctAnswer) ? 'multiple' : 'single')
          }))
        })
      }
    } catch (e) {}
  }

  const joinUrl = useMemo(() => `${window.location.origin}/competition?c=${form._id || ''}`, [form._id])
  const qrUrl = useMemo(() => `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(joinUrl)}`, [joinUrl])

  const updateQuestion = (idx: number, patch: Partial<CompetitionForm['questions'][number]>) => {
    const qs = [...form.questions]; qs[idx] = { ...qs[idx], ...patch } as any; setForm({ ...form, questions: qs })
  }

  const save = async () => {
    const payload = { ...form }
    try {
      if (form._id) await api.put(`/admin/competitions/${form._id}`, payload)
      else {
        const res = await api.post('/admin/competitions', payload)
        setForm(prev => ({ ...prev, _id: res.data?.competition?._id }))
      }
      navigate('/admin/competitions')
    } catch (e) {}
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/admin/competitions')}><ArrowLeft className="h-4 w-4" /></Button>
          <h1 className="text-2xl font-bold">{isNew ? 'Tạo cuộc thi' : 'Chỉnh sửa cuộc thi'}</h1>
        </div>
        <Button onClick={save} className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"><Save className="h-4 w-4 mr-1" /> Lưu</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Thông tin cơ bản</CardTitle><CardDescription>Nhập mô tả để người tham gia hiểu rõ cuộc thi</CardDescription></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500">Tiêu đề</label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-gray-500">Mô tả</label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-gray-500">Cấp độ</label>
            <select className="border rounded px-2 py-2 w-full" value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}>
              <option value="All">All</option>
              {levels.map(l => (
                <option key={l._id} value={l.name}>{l.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Bắt đầu</label>
            <Input type="datetime-local" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-gray-500">Kết thúc</label>
            <Input type="datetime-local" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-gray-500">Chi phí (xu)</label>
            <Input type="number" value={form.cost} onChange={e => setForm({ ...form, cost: parseInt(e.target.value || '0') })} />
          </div>
          <div>
            <label className="text-xs text-gray-500">Thưởng tham gia</label>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" value={form.reward.xp} onChange={e => setForm({ ...form, reward: { ...form.reward, xp: parseInt(e.target.value || '0') } })} placeholder="XP" />
              <Input type="number" value={form.reward.coins} onChange={e => setForm({ ...form, reward: { ...form.reward, coins: parseInt(e.target.value || '0') } })} placeholder="Xu" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Câu hỏi</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {form.questions.map((q, idx) => (
            <div key={idx} className="border rounded p-3 space-y-2">
              <div className="flex justify-between"><div className="font-medium">Câu {idx + 1}</div><Button variant="outline" size="sm" onClick={() => setForm({ ...form, questions: form.questions.filter((_, i) => i !== idx) })}>Xóa</Button></div>
              <Textarea value={q.question} onChange={e => updateQuestion(idx, { question: e.target.value })} />
              <div className="grid md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs text-gray-500">Phương án</label>
                  {q.options.map((opt, oi) => (
                    <div className="flex items-center gap-2" key={oi}>
                      <span className="text-xs w-5">{String.fromCharCode(65 + oi)}.</span>
                      <Input value={opt} onChange={e => {
                        const opts = [...q.options]; opts[oi] = e.target.value; updateQuestion(idx, { options: opts })
                      }} />
                      <Button variant="outline" size="sm" className="text-red-600" onClick={() => {
                        const opts = q.options.filter((_, j) => j !== oi)
                        let next: number | number[] = q.correctAnswer
                        if (Array.isArray(next)) next = (next as number[]).filter(v => v !== oi).map(v => v > oi ? v - 1 : v)
                        else if (typeof next === 'number') next = next > oi ? (next as number) - 1 : next
                        updateQuestion(idx, { options: opts, correctAnswer: next })
                      }}>Xóa</Button>
                    </div>
                  ))}
                  <Button size="sm" onClick={() => updateQuestion(idx, { options: [...q.options, ''] })}><Plus className="h-4 w-4 mr-1" /> Thêm phương án</Button>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gray-500">Loại câu hỏi</label>
                  <select className="border rounded px-2 py-2 w-full" value={q.questionType || 'single'} onChange={e => updateQuestion(idx, { questionType: e.target.value as any })}>
                    <option value="single">Một đáp án</option>
                    <option value="multiple">Nhiều đáp án</option>
                  </select>
                  <label className="text-xs text-gray-500">Đáp án đúng</label>
                  {q.questionType === 'multiple' ? (
                    <div className="grid grid-cols-2 gap-1">
                      {q.options.map((_, oi) => (
                        <label key={oi} className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={Array.isArray(q.correctAnswer) ? (q.correctAnswer as number[]).includes(oi) : q.correctAnswer === oi} onChange={e => {
                            let next: number[] = Array.isArray(q.correctAnswer) ? [...(q.correctAnswer as number[])] : (typeof q.correctAnswer === 'number' ? [q.correctAnswer] : [])
                            if (e.target.checked) next = Array.from(new Set([...next, oi]))
                            else next = next.filter(v => v !== oi)
                            updateQuestion(idx, { correctAnswer: next })
                          }} />{String.fromCharCode(65 + oi)}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <select className="border rounded px-2 py-2" value={typeof q.correctAnswer === 'number' ? (q.correctAnswer as number) : ((q.correctAnswer as number[])[0] || 0)} onChange={e => updateQuestion(idx, { correctAnswer: parseInt(e.target.value) })}>
                      {q.options.map((_, oi) => (
                        <option key={oi} value={oi}>{String.fromCharCode(65 + oi)}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          ))}
          <Button size="sm" onClick={() => setForm({ ...form, questions: [...form.questions, { question: '', options: ['', '', '', ''], correctAnswer: 0, questionType: 'single' }] })}><Plus className="h-4 w-4 mr-1" /> Thêm câu</Button>
        </CardContent>
      </Card>

      {/* QR */}
      {form._id && (
        <Card>
          <CardHeader><CardTitle>QR tham gia</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-4">
            <img src={qrUrl} alt="QR" className="w-48 h-48" />
            <div>
              <div className="text-sm text-gray-600 mb-2">Người dùng quét để tham gia:</div>
              <Input value={joinUrl} readOnly />
              <div className="mt-2"><Badge>Competition ID: {form._id}</Badge></div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default AdminCompetitionEdit


