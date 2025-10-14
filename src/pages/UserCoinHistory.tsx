import { useEffect, useState } from 'react'
import { api } from '../services/api'

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
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Lịch sử XU</h1>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 text-left text-sm text-gray-600">
            <tr>
              <th className="p-3">Thời gian</th>
              <th className="p-3">Loại</th>
              <th className="p-3">Danh mục</th>
              <th className="p-3">Mô tả</th>
              <th className="p-3 text-right">+/- XU</th>
              <th className="p-3 text-right">Số dư</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-4" colSpan={6}>Đang tải...</td></tr>
            ) : items.length === 0 ? (
              <tr><td className="p-4" colSpan={6}>Chưa có giao dịch</td></tr>
            ) : (
              items.map(tx => (
                <tr key={tx._id} className="border-t text-sm">
                  <td className="p-3">{new Date(tx.createdAt).toLocaleString()}</td>
                  <td className="p-3 capitalize">{tx.type}</td>
                  <td className="p-3">{tx.category}</td>
                  <td className="p-3">{tx.description || '-'}</td>
                  <td className={`p-3 text-right font-medium ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>{tx.amount >= 0 ? `+${tx.amount}` : tx.amount}</td>
                  <td className="p-3 text-right">{tx.balanceAfter}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center mt-4">
        <button disabled={page <= 1} onClick={() => fetchData(page - 1)} className="px-3 py-1 border rounded disabled:opacity-50">Trước</button>
        <div>Trang {page} / {totalPages}</div>
        <button disabled={page >= totalPages} onClick={() => fetchData(page + 1)} className="px-3 py-1 border rounded disabled:opacity-50">Sau</button>
      </div>
    </div>
  )
}


