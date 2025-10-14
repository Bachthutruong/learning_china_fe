import { useEffect, useState } from 'react'
import { api } from '../../services/api'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { CheckCircle, XCircle, Eye } from 'lucide-react'

interface HistoryItem {
  _id: string
  userId: { _id: string; email?: string; name?: string } | string
  level: number
  totalQuestions: number
  correctCount: number
  wrongCount: number
  rewards: { coins: number; experience: number }
  createdAt: string
  details?: Array<{
    questionId: string
    question: string
    userAnswer: any
    correctAnswer: any
    correct: boolean
  }>
}

export const AdminTestHistories = () => {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [userId, setUserId] = useState('')
  console.log(setUserId)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<HistoryItem | null>(null)

  const fetchData = async (p = 1) => {
    try {
      setLoading(true)
      const res = await api.get('/admin/test-histories', { params: { page: p, userId: userId || undefined } })
      setItems(res.data.items || [])
      setTotalPages(res.data.totalPages || 1)
      setPage(res.data.page || p)
    } catch (e) {
      console.error('Fetch test histories error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData(1) }, [])

  return (
    <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Lịch sử làm bài</CardTitle>
          </CardHeader>
          <CardContent>
            {/* <div className="flex gap-2 mb-4">
              <input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Lọc theo userId"
                className="border rounded px-3 py-2 w-64"
              />
              <button onClick={() => fetchData(1)} className="px-4 py-2 bg-blue-600 text-white rounded">Lọc</button>
            </div> */}
            <div className="overflow-x-auto rounded-xl border bg-white shadow">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b bg-gray-50">
                    <th className="py-3 pr-4 pl-4">Thời gian</th>
                    <th className="py-3 pr-4">User</th>
                    <th className="py-3 pr-4">Level</th>
                    <th className="py-3 pr-4">Tổng</th>
                    <th className="py-3 pr-4">Đúng</th>
                    <th className="py-3 pr-4">Sai</th>
                    <th className="py-3 pr-4">XP</th>
                    <th className="py-3 pr-4">Xu</th>
                    <th className="py-3 pr-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(it => (
                    <tr key={it._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 pr-4 pl-4">{new Date(it.createdAt).toLocaleString()}</td>
                      <td className="py-2 pr-4">{typeof it.userId === 'string' ? it.userId : (it.userId.name || it.userId.email || it.userId._id)}</td>
                      <td className="py-2 pr-4">{it.level}</td>
                      <td className="py-2 pr-4">{it.totalQuestions}</td>
                      <td className="py-2 pr-4"><Badge className="bg-green-100 text-green-700">{it.correctCount}</Badge></td>
                      <td className="py-2 pr-4"><Badge className="bg-red-100 text-red-700">{it.wrongCount}</Badge></td>
                      <td className="py-2 pr-4">{it.rewards.experience}</td>
                      <td className="py-2 pr-4">{it.rewards.coins}</td>
                      <td className="py-2 pr-4">
                        <Button variant="outline" size="sm" onClick={() => { setSelected(it); setDetailOpen(true) }}>
                          <Eye className="h-4 w-4 mr-2" /> Xem chi tiết
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && !loading && (
                    <tr>
                      <td className="py-4 text-gray-500" colSpan={8}>Không có dữ liệu</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <button disabled={page <= 1} onClick={() => fetchData(page - 1)} className="px-3 py-2 border rounded disabled:opacity-50">Trước</button>
              <div>Trang {page}/{totalPages}</div>
              <button disabled={page >= totalPages} onClick={() => fetchData(page + 1)} className="px-3 py-2 border rounded disabled:opacity-50">Sau</button>
            </div>
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Chi tiết lần làm bài {selected && (<span className="text-sm text-gray-500 ml-2">{new Date(selected.createdAt).toLocaleString()}</span>)}
              </DialogTitle>
            </DialogHeader>
            {selected && (
              <div className="space-y-4 max-h-[70vh] overflow-auto pr-2">
                <div className="flex gap-3 text-sm">
                  <Badge className="bg-blue-100 text-blue-700">Level {selected.level}</Badge>
                  <Badge className="bg-green-100 text-green-700">Đúng {selected.correctCount}</Badge>
                  <Badge className="bg-red-100 text-red-700">Sai {selected.wrongCount}</Badge>
                  <Badge className="bg-yellow-100 text-yellow-700">+{selected.rewards.experience} XP</Badge>
                  <Badge className="bg-purple-100 text-purple-700">+{selected.rewards.coins} Xu</Badge>
                </div>
                <div className="space-y-3">
                  {(selected.details || []).map((d, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border ${d.correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-start gap-3">
                        {d.correct ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 mt-1" />
                        )}
                        <div className="flex-1">
                          <div className="font-semibold mb-1">Câu {idx + 1}</div>
                          <div className="text-gray-800 mb-2">{d.question}</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div className="p-3 rounded bg-white border">
                              <div className="font-medium text-gray-700 mb-1">Đáp án của user</div>
                              <div className="text-gray-900 break-words">{renderAnswerPretty(d.userAnswer, (d as any).options)}</div>
                            </div>
                            <div className="p-3 rounded bg-white border">
                              <div className="font-medium text-gray-700 mb-1">Đáp án đúng</div>
                              <div className="text-gray-900 break-words">{renderAnswerPretty(d.correctAnswer, (d as any).options)}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
  )
}

export default AdminTestHistories

function renderAnswerPretty(value: any, options?: string[]) {
  try {
    if (Array.isArray(value)) {
      if (options && options.length) {
        return value.map((idx: number) => `${String.fromCharCode(65 + idx)} (${options[idx] ?? ''})`).join(', ')
      }
      return value.map((idx: any) => {
        const n = typeof idx === 'string' ? parseInt(idx, 10) : idx
        return String.fromCharCode(65 + (Number.isFinite(n) ? n : 0))
      }).join(', ')
    }
    if (typeof value === 'number') {
      if (options && options.length) {
        return `${String.fromCharCode(65 + value)} (${options[value] ?? ''})`
      }
      return String.fromCharCode(65 + value)
    }
    if (typeof value === 'string' && /^\d+$/.test(value)) {
      const n = parseInt(value, 10)
      if (options && options.length) return `${String.fromCharCode(65 + n)} (${options[n] ?? ''})`
      return String.fromCharCode(65 + n)
    }
    if (value && typeof value === 'object') return JSON.stringify(value)
    return String(value ?? '')
  } catch {
    return String(value)
  }
}


