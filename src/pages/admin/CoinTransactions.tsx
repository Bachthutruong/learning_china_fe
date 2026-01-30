import { useEffect, useState } from 'react'
import { api } from '../../services/api'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Coins, Search } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'

interface CoinTransaction {
  _id: string
  userId: { _id: string; name: string; email: string } | string
  amount: number
  type: 'earn' | 'spend' | 'adjust'
  category: string
  description?: string
  balanceAfter: number
  createdAt: string
}

export const AdminCoinTransactions = () => {
  const [items, setItems] = useState<CoinTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [userId, setUserId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [totalItems, setTotalItems] = useState(0)

  const fetchData = async (p = page, size = pageSize) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', String(p))
      params.append('limit', String(size))
      if (userId) params.append('userId', userId)
      if (searchTerm) params.append('search', searchTerm)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const res = await api.get('/coin-transactions/admin', { params })
      setItems(res.data.transactions || [])
      setTotalPages(res.data.totalPages || 1)
      setTotalItems(res.data.total || 0)
      setPage(res.data.currentPage || p)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    fetchData(1, pageSize) 
  }, [pageSize, searchTerm, startDate, endDate])

  useEffect(() => {
    fetchData(page, pageSize)
  }, [page])

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
             <div className="w-10 h-10 chinese-gradient rounded-xl flex items-center justify-center text-white mr-4 shadow-lg">
                <Coins className="w-6 h-6" />
             </div>
             Nhật ký giao dịch Xu
          </h1>
          <p className="text-gray-500 font-medium">Truy xuất chi tiết các biến động số dư Xu của toàn bộ người dùng.</p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl space-y-6">
         <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-end">
            <div className="lg:col-span-2 space-y-2">
               <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Tìm kiếm học viên</Label>
               <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-primary transition-colors" />
                  <Input 
                    placeholder="Tìm theo tên hoặc email..." 
                    value={searchTerm} 
                    onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} 
                    className="h-12 pl-11 rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-primary/20 transition-all font-bold" 
                  />
               </div>
            </div>

            <div className="space-y-2">
               <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Từ ngày</Label>
               <Input 
                 type="date"
                 value={startDate}
                 onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                 className="h-12 rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white transition-all font-bold text-xs"
               />
            </div>

            <div className="space-y-2">
               <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Đến ngày</Label>
               <Input 
                 type="date"
                 value={endDate}
                 onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                 className="h-12 rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white transition-all font-bold text-xs"
               />
            </div>
         </div>

         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-4 border-t border-gray-50">
            <div className="flex items-center space-x-2">
               <span className="text-[10px] font-black uppercase text-gray-400">Hiển thị</span>
               <Select value={pageSize.toString()} onValueChange={v => { setPageSize(parseInt(v)); setPage(1); }}>
                  <SelectTrigger className="w-24 h-10 rounded-xl border-gray-100 bg-gray-50 font-black text-xs">
                     <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-100">
                     <SelectItem value="10">10 dòng</SelectItem>
                     <SelectItem value="20">20 dòng</SelectItem>
                     <SelectItem value="50">50 dòng</SelectItem>
                     <SelectItem value="100">100 dòng</SelectItem>
                  </SelectContent>
               </Select>
            </div>

            <div className="flex gap-3">
               <Input
                 placeholder="Lọc theo User ID chính xác..."
                 value={userId}
                 onChange={(e) => setUserId(e.target.value)}
                 className="h-10 rounded-xl border-gray-50 bg-gray-50/50 text-xs font-bold w-64"
               />
               <Button onClick={() => fetchData(1)} className="chinese-gradient h-10 px-6 rounded-xl font-black text-[10px] uppercase text-white shadow-lg shadow-primary/20">Lọc chính xác</Button>
            </div>
         </div>
      </div>

      {/* Transactions Table Rendering */}
      <div className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-xl">
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                     <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Thời gian</th>
                     <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Học viên</th>
                     <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Loại & Danh mục</th>
                     <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Biến động</th>
                     <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Số dư cuối</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    [1, 2, 3].map(i => <tr key={i} className="animate-pulse h-24" />)
                  ) : items.map((tx) => (
                    <tr key={tx._id} className="group hover:bg-gray-50/30 transition-colors">
                       <td className="px-8 py-6">
                          <div className="flex flex-col">
                             <span className="text-sm font-bold text-gray-900">{new Date(tx.createdAt).toLocaleDateString('vi-VN')}</span>
                             <span className="text-[10px] font-medium text-gray-400 uppercase">{new Date(tx.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex items-center space-x-3">
                             <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 font-black text-xs shadow-sm">
                                {(typeof tx.userId === 'string' ? tx.userId : (tx.userId.name || 'U'))[0].toUpperCase()}
                             </div>
                             <div className="min-w-0">
                                <p className="text-sm font-black text-gray-700 truncate max-w-[180px]">
                                   {typeof tx.userId === 'string' ? tx.userId : tx.userId.name}
                                </p>
                                <p className="text-[10px] font-medium text-gray-400 truncate max-w-[180px]">
                                   {typeof tx.userId === 'string' ? '' : tx.userId.email}
                                </p>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex items-center space-x-2">
                             <Badge variant="outline" className={`rounded-lg font-black text-[8px] uppercase tracking-widest border-gray-200 px-2 py-0.5 ${tx.type === 'spend' ? 'text-red-400 bg-red-50/30' : tx.type === 'earn' ? 'text-green-500 bg-green-50/30' : 'text-blue-500 bg-blue-50/30'}`}>
                                {tx.type}
                             </Badge>
                             <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight">{tx.category}</span>
                          </div>
                          <p className="text-[10px] text-gray-400 font-medium italic mt-1 line-clamp-1">{tx.description || '-'}</p>
                       </td>
                       <td className="px-8 py-6 text-right">
                          <span className={`text-base font-black ${tx.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                             {tx.amount >= 0 ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()}
                          </span>
                       </td>
                       <td className="px-8 py-6 text-right">
                          <span className="text-sm font-black text-gray-900">{tx.balanceAfter.toLocaleString()} Xu</span>
                       </td>
                    </tr>
                  ))}
                  {items.length === 0 && !loading && (
                    <tr><td colSpan={5} className="px-8 py-20 text-center text-gray-400 font-bold italic">Không có dữ liệu giao dịch nào được ghi nhận.</td></tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-8">
         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">
            Tổng số: {totalItems} Giao dịch
         </span>
         
         {totalPages > 1 && (
           <div className="flex items-center space-x-4">
              <Button variant="ghost" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="rounded-xl font-bold text-xs uppercase text-gray-400 hover:text-primary">Trang trước</Button>
              <div className="bg-white px-6 py-2 rounded-2xl border border-gray-100 shadow-sm font-black text-sm text-gray-900">
                 Trang {page} / {totalPages}
              </div>
              <Button variant="ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="rounded-xl font-bold text-xs uppercase text-gray-400 hover:text-primary">Trang sau</Button>
           </div>
         )}
      </div>
    </div>
  )
}


