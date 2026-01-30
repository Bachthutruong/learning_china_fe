import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { Gem, TrendingDown, TrendingUp, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CoinTransaction {
  _id: string
  amount: number
  type: 'earn' | 'spend' | 'adjust'
  category: string
  description?: string
  balanceAfter: number
  createdAt: string
}

export const UserCoinHistory = () => {
  const [items, setItems] = useState<CoinTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchData = async (p = 1) => {
    setLoading(true)
    try {
      const res = await api.get('/coin-transactions/me', { params: { page: p, limit: 20 } })
      setItems(res.data.transactions || [])
      setTotalPages(res.data.totalPages || 1)
      setPage(res.data.currentPage || p)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData(1) }, [])

  return (
    <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Lịch sử <span className="text-primary">Biến động Xu</span></h1>
            <p className="text-gray-500 font-medium">Theo dõi chi tiết tất cả giao dịch và phần thưởng Xu của bạn.</p>
          </div>
          <div className="flex items-center space-x-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
             <div className="px-6 py-2 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Số dư khả dụng</p>
                <p className="text-2xl font-black text-amber-500 flex items-center justify-center">
                   <Gem className="w-5 h-5 mr-2 fill-current" /> {items.length > 0 ? items[0].balanceAfter.toLocaleString() : 0}
                </p>
             </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Thời gian</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Loại & Danh mục</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Nội dung chi tiết</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Biến động</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Số dư sau</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  [1, 2, 3].map(i => <tr key={i} className="animate-pulse"><td colSpan={5} className="h-20 bg-gray-50/20" /></tr>)
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-gray-400 font-bold italic">
                       Chưa ghi nhận giao dịch nào trong lịch sử.
                    </td>
                  </tr>
                ) : (
                  items.map(tx => (
                    <tr key={tx._id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6">
                         <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900">{new Date(tx.createdAt).toLocaleDateString('vi-VN')}</span>
                            <span className="text-[10px] font-medium text-gray-400 uppercase">{new Date(tx.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                         </div>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              tx.type === 'earn' ? 'bg-green-50 text-green-600' : 
                              tx.type === 'spend' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                            }`}>
                               {tx.type === 'earn' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            </div>
                            <div>
                               <p className="text-xs font-black uppercase tracking-widest text-gray-900">{tx.type}</p>
                               <p className="text-[10px] font-bold text-gray-400">{tx.category}</p>
                            </div>
                         </div>
                      </td>
                      <td className="px-8 py-6">
                         <p className="text-sm text-gray-600 font-medium leading-relaxed max-w-xs truncate" title={tx.description}>
                            {tx.description || 'Không có nội dung mô tả'}
                         </p>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <span className={`text-lg font-black ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.amount >= 0 ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()}
                         </span>
                      </td>
                      <td className="px-8 py-6 text-right font-black text-gray-900">
                         {tx.balanceAfter.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-4">
            <Button 
              variant="ghost" 
              disabled={page <= 1} 
              onClick={() => fetchData(page - 1)}
              className="rounded-xl font-bold text-gray-400 hover:text-primary h-10 px-6"
            >
               Trước
            </Button>
            <div className="bg-white px-6 py-2 rounded-2xl border border-gray-100 shadow-sm font-black text-sm text-gray-900">
               Trang {page} / {totalPages}
            </div>
            <Button 
              variant="ghost" 
              disabled={page >= totalPages} 
              onClick={() => fetchData(page + 1)}
              className="rounded-xl font-bold text-gray-400 hover:text-primary h-10 px-6"
            >
               Tiếp theo
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}