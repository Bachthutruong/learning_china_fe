import { useEffect, useState } from 'react'
import { api } from '../../services/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { CheckCircle, XCircle, Eye, BookOpen, Search } from 'lucide-react'

function renderAnswerPretty(value: any, options?: string[]) {
  try {
    if (value === null || value === undefined) return '-'
    if (Array.isArray(value)) {
      if (options && options.length) {
        return value.map((idx: any) => {
          const n = typeof idx === 'string' ? parseInt(idx, 10) : idx
          return options[n] ? `${String.fromCharCode(65 + n)}. ${options[n]}` : String(idx)
        }).join(', ')
      }
      return value.map((idx: any) => {
        const n = typeof idx === 'string' ? parseInt(idx, 10) : idx
        return String.fromCharCode(65 + (Number.isFinite(n) ? n : 0))
      }).join(', ')
    }
    if (typeof value === 'number') {
      if (options && options[value]) {
        return `${String.fromCharCode(65 + value)}. ${options[value]}`
      }
      return String.fromCharCode(65 + value)
    }
    if (typeof value === 'string' && /^\d+$/.test(value)) {
      const n = parseInt(value, 10)
      if (options && options[n]) return `${String.fromCharCode(65 + n)}. ${options[n]}`
      return String.fromCharCode(65 + n)
    }
    if (value && typeof value === 'object') return JSON.stringify(value)
    return String(value ?? '')
  } catch {
    return String(value)
  }
}

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
    options?: string[]
  }>
}

export const AdminTestHistories = () => {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [userId, setUserId] = useState('')
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
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
             <div className="w-10 h-10 chinese-gradient rounded-xl flex items-center justify-center text-white mr-4 shadow-lg">
                <BookOpen className="w-6 h-6" />
             </div>
             Nhật ký khảo thí
          </h1>
          <p className="text-gray-500 font-medium">Giám sát và phân tích kết quả bài thi của toàn bộ học viên.</p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl space-y-6">
         <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex-1 relative group">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-primary transition-colors" />
               <Input
                 placeholder="Lọc theo ID người dùng hoặc tên..."
                 value={userId}
                 onChange={(e) => setUserId(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && fetchData(1)}
                 className="h-12 pl-11 rounded-xl border-gray-50 bg-gray-50/50 focus:bg-white focus:border-primary transition-all font-bold"
               />
            </div>
            <Button onClick={() => fetchData(1)} className="chinese-gradient h-12 px-8 rounded-xl font-black text-white shadow-lg">Lọc kết quả</Button>
         </div>
      </div>

      {/* Histories Table Rendering */}
      <div className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-xl">
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                     <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Thời gian làm bài</th>
                     <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Học viên</th>
                     <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Trình độ</th>
                     <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Kết quả</th>
                     <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Phần thưởng</th>
                     <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Thao tác</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    [1, 2, 3].map(i => <tr key={i} className="animate-pulse h-20" />)
                  ) : items.map((it) => (
                    <tr key={it._id} className="group hover:bg-gray-50/50 transition-colors">
                       <td className="px-8 py-6">
                          <div className="flex flex-col">
                             <span className="text-sm font-bold text-gray-900">{new Date(it.createdAt).toLocaleDateString('vi-VN')}</span>
                             <span className="text-[10px] font-medium text-gray-400 uppercase">{new Date(it.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex items-center space-x-3">
                             <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 font-black text-xs">
                                {(typeof it.userId === 'string' ? it.userId : (it.userId.name || 'U'))[0].toUpperCase()}
                             </div>
                             <span className="text-sm font-bold text-gray-700 group-hover:text-primary transition-colors">
                                {typeof it.userId === 'string' ? it.userId : (it.userId.name || it.userId.email || it.userId._id)}
                             </span>
                          </div>
                       </td>
                       <td className="px-8 py-6 text-center">
                          <Badge className="bg-primary/5 text-primary border-none rounded-lg font-black text-[10px]">HSK {it.level}</Badge>
                       </td>
                       <td className="px-8 py-6 text-center">
                          <div className="flex items-center justify-center space-x-2">
                             <Badge className="bg-green-50 text-green-600 border-none font-black text-[10px]">{it.correctCount} Đúng</Badge>
                             <Badge className="bg-red-50 text-red-400 border-none font-black text-[10px]">{it.wrongCount} Sai</Badge>
                             <span className="text-[10px] font-bold text-gray-400">/ {it.totalQuestions}</span>
                          </div>
                       </td>
                       <td className="px-8 py-6 text-right">
                          <div className="space-y-0.5">
                             <p className="text-xs font-black text-amber-500">+{it.rewards.coins} Xu</p>
                             <p className="text-[9px] font-bold text-primary uppercase tracking-widest">+{it.rewards.experience} XP</p>
                          </div>
                       </td>
                       <td className="px-8 py-6 text-right">
                          <Button variant="ghost" size="sm" onClick={() => { setSelected(it); setDetailOpen(true) }} className="h-9 rounded-xl font-black text-[10px] uppercase tracking-widest text-gray-400 hover:text-primary hover:bg-primary/5">
                             <Eye className="w-3.5 h-3.5 mr-2" /> Chi tiết
                          </Button>
                       </td>
                    </tr>
                  ))}
                  {items.length === 0 && !loading && (
                    <tr><td colSpan={6} className="px-8 py-20 text-center text-gray-400 font-bold italic">Chưa ghi nhận lịch sử bài làm nào.</td></tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-4 mt-8">
           <Button variant="ghost" disabled={page <= 1} onClick={() => fetchData(page - 1)} className="rounded-xl font-bold text-xs uppercase text-gray-400 hover:text-primary">Trang trước</Button>
           <div className="bg-white px-6 py-2 rounded-2xl border border-gray-100 shadow-sm font-black text-sm text-gray-900">
              Trang {page} / {totalPages}
           </div>
           <Button variant="ghost" disabled={page >= totalPages} onClick={() => fetchData(page + 1)} className="rounded-xl font-bold text-xs uppercase text-gray-400 hover:text-primary">Trang sau</Button>
        </div>
      )}

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
                            <div className="text-gray-900 break-words">{renderAnswerPretty(d.userAnswer, d.options)}</div>
                          </div>
                          <div className="p-3 rounded bg-white border">
                            <div className="font-medium text-gray-700 mb-1">Đáp án đúng</div>
                            <div className="text-gray-900 break-words">{renderAnswerPretty(d.correctAnswer, d.options)}</div>
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
