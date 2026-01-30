import { useEffect, useState } from 'react'
import { Badge } from '../../components/ui/badge'
// import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import { Link } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader as UIDialogHeader, DialogTitle as UIDialogTitle } from '../../components/ui/dialog'
import { api } from '../../services/api'
import { Plus, Trash2, QrCode, Trophy, Edit, BarChart3 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
// Lightweight QR generation using Google Chart API to avoid extra deps

interface CompetitionItem {
  _id: string
  title: string
  description: string
  status: 'active' | 'upcoming' | 'ended'
  level: string
  participants: number
  startDate?: string
  endDate?: string
  cost?: number
  reward?: { xp: number, coins: number }
  prizes?: any
  questions?: Array<{ question: string; options: string[]; correctAnswer: number | number[] }>
  stats?: { count: number; avgScore: number; maxScore: number }
}

export const AdminCompetitions = () => {
  const [items, setItems] = useState<CompetitionItem[]>([])
  const [qr, setQr] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(9)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
    const t = setInterval(() => fetchData(), 60000) // refresh status every 60s
    return () => clearInterval(t)
  }, [])

  // Refetch when pagination changes
  useEffect(() => {
    fetchData()
  }, [page, pageSize])

  const fetchData = async () => {
    try {
      const res = await api.get('/admin/competitions', {
        params: {
          page,
          limit: pageSize
        }
      })
      
      console.log('Competitions API response:', res.data)
      
      // Handle different response formats
      if (res.data.competitions) {
        setItems(res.data.competitions)
        setTotalPages(res.data.totalPages || 1)
        setTotalItems(res.data.total || res.data.competitions.length)
      } else if (Array.isArray(res.data)) {
        setItems(res.data)
        setTotalPages(1)
        setTotalItems(res.data.length)
      } else {
        setItems([])
        setTotalPages(1)
        setTotalItems(0)
      }
    } catch (error) {
      console.error('Error fetching competitions:', error)
      setItems([])
    }
  }

  const deleteCompetition = async (id: string) => {
    await api.delete(`/admin/competitions/${id}`)
    fetchData()
  }

  const buildQr = async (competitionId: string) => {
    const joinUrl = `${window.location.origin}/competition?c=${competitionId}`
    // Use qrserver.com to avoid CORS/blocked Google endpoints
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(joinUrl)}`
    setQr(qrUrl)
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
             <div className="w-10 h-10 chinese-gradient rounded-xl flex items-center justify-center text-white mr-4 shadow-lg">
                <Trophy className="w-6 h-6" />
             </div>
             Giải đấu hệ thống
          </h1>
          <p className="text-gray-500 font-medium">Tổ chức và giám sát các kỳ thi đấu trí tuệ định kỳ trên toàn nền tảng.</p>
        </div>
        
        <Button asChild className="chinese-gradient h-11 px-6 rounded-xl font-black text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-1">
          <Link to="/admin/competitions/new"><Plus className="mr-2 h-4 w-4" /> Tạo giải đấu mới</Link>
        </Button>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl flex items-center justify-between">
         <div className="flex items-center space-x-2">
            <span className="text-[10px] font-black uppercase text-gray-400">Hiển thị</span>
            <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(parseInt(v)); setPage(1); }}>
               <SelectTrigger className="w-20 h-8 rounded-lg border-none bg-gray-50 font-black text-[10px]">
                  <SelectValue />
               </SelectTrigger>
               <SelectContent className="rounded-xl">
                  <SelectItem value="6">6</SelectItem>
                  <SelectItem value="12">12</SelectItem>
                  <SelectItem value="24">24</SelectItem>
               </SelectContent>
            </Select>
         </div>
         
         <Badge variant="outline" className="rounded-lg font-black text-[8px] uppercase tracking-widest border-gray-200 text-gray-400">
            Total: {totalItems} Competitions
         </Badge>
      </div>

      {/* Competitions Grid Rendering */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((c) => (
          <div key={c._id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden flex flex-col">
             <div className="p-8 space-y-6 flex-1 relative">
                <div className="absolute top-0 right-0 w-32 h-32 chinese-gradient opacity-5 rounded-bl-[4rem]" />
                
                <div className="flex justify-between items-start">
                   <div className="space-y-1">
                      <h3 className="text-xl font-black text-gray-900 group-hover:text-primary transition-colors line-clamp-1">{c.title}</h3>
                      <p className="text-xs text-gray-400 font-medium line-clamp-2 leading-relaxed">{c.description}</p>
                   </div>
                   <Badge className={`rounded-lg font-black uppercase text-[8px] px-2 py-1 tracking-widest ${
                     c.status === 'active' ? 'bg-green-50 text-green-600' :
                     c.status === 'upcoming' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'
                   }`}>
                      {c.status}
                   </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-gray-50 p-4 rounded-2xl border border-gray-50">
                      <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest mb-1">Tham gia</p>
                      <p className="text-sm font-black text-gray-900">{c.participants} Học viên</p>
                   </div>
                   <div className="bg-gray-50 p-4 rounded-2xl border border-gray-50">
                      <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest mb-1">Trình độ</p>
                      <p className="text-sm font-black text-gray-900">Level {c.level}</p>
                   </div>
                </div>

                {c.stats && (
                  <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 space-y-3">
                     <p className="text-[8px] font-black uppercase text-primary tracking-widest">Hiệu suất giải đấu</p>
                     <div className="flex justify-between items-center">
                        <div className="text-center">
                           <p className="text-xs font-black text-gray-900">{Math.round(c.stats.avgScore)}%</p>
                           <p className="text-[7px] font-bold text-gray-400 uppercase">Avg Score</p>
                        </div>
                        <div className="w-px h-6 bg-primary/10" />
                        <div className="text-center">
                           <p className="text-xs font-black text-gray-900">{Math.round(c.stats.maxScore)}%</p>
                           <p className="text-[7px] font-bold text-gray-400 uppercase">Top Score</p>
                        </div>
                        <div className="w-px h-6 bg-primary/10" />
                        <div className="text-center">
                           <p className="text-xs font-black text-gray-900">{c.stats.count}</p>
                           <p className="text-[7px] font-bold text-gray-400 uppercase">Entries</p>
                        </div>
                     </div>
                  </div>
                )}
             </div>

             <div className="bg-gray-50 px-8 py-4 flex items-center justify-between border-t border-gray-100">
                <div className="flex space-x-1">
                   <Button asChild variant="ghost" size="icon" className="w-8 h-8 rounded-lg hover:bg-blue-50 hover:text-blue-600">
                      <Link to={`/admin/competitions/${c._id}`}><Edit className="w-4 h-4" /></Link>
                   </Button>
                   <Button asChild variant="ghost" size="icon" className="w-8 h-8 rounded-lg hover:bg-green-50 hover:text-green-600">
                      <Link to={`/admin/competitions/${c._id}/stats`}><BarChart3 className="w-4 h-4" /></Link>
                   </Button>
                   <Button variant="ghost" size="icon" onClick={() => buildQr(c._id)} className="w-8 h-8 rounded-lg hover:bg-gray-200 hover:text-gray-900">
                      <QrCode className="w-4 h-4" />
                   </Button>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setDeleteId(c._id)} className="w-8 h-8 rounded-lg hover:bg-red-50 hover:text-red-600">
                   <Trash2 className="w-4 h-4" />
                </Button>
             </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-4 mt-8">
           <Button variant="ghost" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="rounded-xl font-bold text-xs uppercase text-gray-400 hover:text-primary">Trang trước</Button>
           <div className="bg-white px-6 py-2 rounded-2xl border border-gray-100 shadow-sm font-black text-sm text-gray-900">
              Trang {page} / {totalPages}
           </div>
           <Button variant="ghost" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="rounded-xl font-bold text-xs uppercase text-gray-400 hover:text-primary">Trang sau</Button>
        </div>
      )}

      {qr && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setQr(null)}>
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl space-y-6 text-center animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
             <h3 className="text-xl font-black text-gray-900">QR Code Tham gia</h3>
             <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 shadow-inner">
                <img src={qr} alt="QR to join" className="w-64 h-64" />
             </div>
             <p className="text-xs font-medium text-gray-400 max-w-[200px] mx-auto">Học viên quét mã này để tham gia giải đấu trực tiếp.</p>
             <Button onClick={() => setQr(null)} variant="outline" className="rounded-xl font-bold">Đóng cửa sổ</Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="rounded-[2.5rem] p-10 border-none shadow-2xl max-w-sm text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500">
             <Trash2 className="w-8 h-8" />
          </div>
          <UIDialogHeader className="space-y-2">
            <UIDialogTitle className="text-2xl font-black text-gray-900">Xóa giải đấu?</UIDialogTitle>
            <p className="text-sm font-medium text-gray-500">Toàn bộ dữ liệu về lượt tham gia và kết quả của giải đấu này sẽ bị gỡ bỏ vĩnh viễn.</p>
          </UIDialogHeader>
          <div className="flex flex-col gap-3 mt-8">
            <Button onClick={() => { if (deleteId) { deleteCompetition(deleteId); setDeleteId(null); } }} className="h-12 rounded-xl font-black text-white bg-red-500 hover:bg-red-600 shadow-lg">Xác nhận xóa</Button>
            <Button variant="ghost" onClick={() => setDeleteId(null)} className="h-12 rounded-xl font-bold text-gray-400">Hủy bỏ</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}