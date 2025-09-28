import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
// import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import { Link } from 'react-router-dom'
import { Dialog, DialogContent, DialogFooter, DialogHeader as UIDialogHeader, DialogTitle as UIDialogTitle } from '../../components/ui/dialog'
import { api } from '../../services/api'
import { Plus, Trash2, QrCode } from 'lucide-react'
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cuộc thi</h1>
        <p className="text-gray-600">Quản lý và theo dõi cuộc thi</p>
      </div>
      <div className="flex justify-end">
        <Button asChild className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"><Link to="/admin/competitions/new"><Plus className="h-4 w-4 mr-1" /> Tạo cuộc thi</Link></Button>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Số lượng hiển thị</label>
          <select className="border rounded px-2 py-1" value={pageSize} onChange={e => { 
            setPage(1); 
            setPageSize(parseInt(e.target.value)) 
          }}>
            <option value={6}>6</option>
            <option value={9}>9</option>
            <option value={12}>12</option>
            <option value={24}>24</option>
          </select>
        </div>
        {/* <div className="flex items-center gap-2">
          <Button asChild className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"><Link to="/admin/competitions/new"><Plus className="h-4 w-4 mr-1" /> Tạo cuộc thi</Link></Button>
        </div> */}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((c) => (
          <Card key={c._id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{c.title}</span>
                <Badge>{c.status}</Badge>
              </CardTitle>
              <CardDescription>
                {c.description}
                {c.stats && (
                  <div className="mt-2 text-xs text-gray-500">
                    {c.stats.count} lượt nộp • Điểm TB {Math.round((c.stats.avgScore || 0))}% • Cao nhất {Math.round((c.stats.maxScore || 0))}%
                  </div>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">{c.participants} người tham gia • Cấp {c.level}</div>
              <div className="mt-3 flex gap-2">
                <Button asChild variant="outline" size="sm"><Link to={`/admin/competitions/${c._id}`}>Sửa</Link></Button>
                <Button asChild variant="outline" size="sm"><Link to={`/admin/competitions/${c._id}/stats`}>Thống kê</Link></Button>
                <Button variant="outline" size="sm" className="text-red-600" onClick={() => setDeleteId(c._id)}><Trash2 className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => buildQr(c._id)}><QrCode className="h-4 w-4" /> QR</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Pagination */}
      {items.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Hiển thị {items.length} trong {totalItems} cuộc thi (Trang {page}/{totalPages})
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page === 1} 
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Trước
            </Button>
            <Badge variant="outline">Trang {page}</Badge>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page >= totalPages} 
              onClick={() => setPage(p => p + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      )}
      {qr && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center" onClick={() => setQr(null)}>
          <div className="bg-white p-4 rounded shadow">
            <img src={qr} alt="QR to join" className="w-64 h-64" />
          </div>
        </div>
      )}

      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null) }}>
        <DialogContent className="max-w-md">
          <UIDialogHeader><UIDialogTitle>Xác nhận xóa cuộc thi</UIDialogTitle></UIDialogHeader>
          <p className="text-sm text-gray-600">Bạn có chắc muốn xóa cuộc thi này? Hành động này không thể hoàn tác.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Hủy</Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={() => { if (deleteId) deleteCompetition(deleteId); setDeleteId(null) }}>Xóa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


