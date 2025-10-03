import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { 
  Coins, 
  CheckCircle, 
  XCircle, 
  Search,
  // Filter,
  Loader2
} from 'lucide-react'
import { api } from '../../services/api'
import toast from 'react-hot-toast'

interface CoinPurchase {
  _id: string
  userId: {
    _id: string
    name: string
    email: string
  }
  amount: number
  currency?: string
  coins: number
  paymentMethod: string
  bankAccount?: string
  transactionId?: string
  status: 'pending' | 'approved' | 'rejected'
  adminNotes?: string
  // receiptImage intentionally not present to hide from UI
  createdAt: string
}

export const AdminCoinPurchases = () => {
  const [purchases, setPurchases] = useState<CoinPurchase[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPurchase, setSelectedPurchase] = useState<CoinPurchase | null>(null)
  const [selectedPurchaseFull, setSelectedPurchaseFull] = useState<any | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [currencyFilter, setCurrencyFilter] = useState<'all' | 'TWD' | 'VND'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  useEffect(() => {
    fetchPurchases()
  }, [filter, currencyFilter, currentPage, itemsPerPage])

  const fetchPurchases = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') {
        params.append('status', filter)
      }
      params.append('page', String(currentPage))
      params.append('limit', String(itemsPerPage))
      
      const response = await api.get(`/coin-purchases/admin/all?${params.toString()}`)
      let list: CoinPurchase[] = response.data.purchases || []
      if (currencyFilter !== 'all') {
        list = list.filter(p => (p.currency || 'VND') === currencyFilter)
      }
      setPurchases(list)
      setTotalPages(response.data.totalPages || 1)
      setTotalItems(response.data.total || list.length)
    } catch (error) {
      console.error('Error fetching purchases:', error)
      toast.error('Không thể tải danh sách mua xu')
    } finally {
      setIsLoading(false)
    }
  }

  const loadSelectedPurchaseFull = async (purchaseId: string) => {
    try {
      const resp = await api.get(`/coin-purchases/admin/${purchaseId}`)
      setSelectedPurchaseFull(resp.data.purchase)
    } catch (e) {
      console.error('Error loading purchase details:', e)
    }
  }

  const handleApprove = async (purchaseId: string) => {
    setIsProcessing(true)
    try {
      await api.put(`/coin-purchases/admin/${purchaseId}/approve`, {
        adminNotes
      })
      
      toast.success('Đã duyệt yêu cầu mua xu')
      setSelectedPurchase(null)
      setAdminNotes('')
      fetchPurchases()
    } catch (error: any) {
      console.error('Error approving purchase:', error)
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi duyệt')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async (purchaseId: string) => {
    setIsProcessing(true)
    try {
      await api.put(`/coin-purchases/admin/${purchaseId}/reject`, {
        adminNotes
      })
      
      toast.success('Đã từ chối yêu cầu mua xu')
      setSelectedPurchase(null)
      setAdminNotes('')
      fetchPurchases()
    } catch (error: any) {
      console.error('Error rejecting purchase:', error)
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi từ chối')
    } finally {
      setIsProcessing(false)
    }
  }

  // Removed getStatusIcon - not used in table layout

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Đã duyệt'
      case 'rejected':
        return 'Từ chối'
      case 'pending':
        return 'Chờ duyệt'
      default:
        return 'Không xác định'
    }
  }

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return 'Chuyển khoản ngân hàng'
      case 'momo':
        return 'Ví MoMo'
      case 'zalopay':
        return 'Ví ZaloPay'
      case 'vnpay':
        return 'Ví VNPay'
      default:
        return method
    }
  }

  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch = searchTerm === '' || 
      purchase.userId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.userId.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.transactionId?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  const pendingCount = purchases.filter(p => p.status === 'pending').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý mua xu</h1>
          <p className="text-gray-600">Duyệt và quản lý các yêu cầu mua xu của người dùng</p>
        </div>
        {pendingCount > 0 && (
          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
            {pendingCount} yêu cầu chờ duyệt
          </div>
        )}
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
            <div className="flex-1">
              <Label htmlFor="search">Tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Tìm theo tên, email, mã giao dịch..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Trạng thái</Label>
              <div className="flex gap-2 mt-1">
                {[
                  { value: 'all', label: 'Tất cả' },
                  { value: 'pending', label: 'Chờ duyệt' },
                  { value: 'approved', label: 'Đã duyệt' },
                  { value: 'rejected', label: 'Từ chối' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => { setFilter(option.value as any); setCurrentPage(1); }}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      filter === option.value
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Tiền tệ</Label>
              <div className="flex gap-2 mt-1">
                {[
                  { value: 'all', label: 'Tất cả' },
                  { value: 'TWD', label: 'Đài Loan (TWD)' },
                  { value: 'VND', label: 'Việt Nam (VND)' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => { setCurrencyFilter(option.value as any); setCurrentPage(1); }}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      currencyFilter === option.value
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Số lượng mỗi trang</Label>
              <div className="flex gap-2 mt-1">
                {[5,10,20,50].map(n => (
                  <button key={n}
                    onClick={() => { setItemsPerPage(n); setCurrentPage(1); }}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      itemsPerPage === n ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >{n}</button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchases List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người dùng</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giao dịch</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiền tệ</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phương thức</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ghi chú admin</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPurchases.map((purchase) => (
                  <tr key={purchase._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-gray-900">{purchase.userId.name}</div>
                      <div className="text-gray-500">{purchase.userId.email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {purchase.amount.toLocaleString()} {purchase.currency || 'VND'} → {purchase.coins} xu
                      {purchase.transactionId && (
                        <div className="text-xs text-gray-500">Mã GD: {purchase.transactionId}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">{purchase.currency || 'VND'}</td>
                    <td className="px-4 py-3 text-sm">{getPaymentMethodText(purchase.paymentMethod)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        purchase.status === 'approved' ? 'bg-green-100 text-green-800' :
                        purchase.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {getStatusText(purchase.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(purchase.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">{purchase.adminNotes || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      {purchase.status === 'pending' && (
                        <Button size="sm" onClick={() => { setSelectedPurchase(purchase); loadSelectedPurchaseFull(purchase._id); }}>Xử lý</Button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredPurchases.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <Coins className="h-10 w-10 text-gray-400" />
                        Không có giao dịch nào
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} trong {totalItems} mục
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                  «
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                  ‹
                </Button>
                <span className="text-sm">Trang {currentPage} / {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
                  ›
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                  »
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Modal */}
      {selectedPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Xử lý yêu cầu mua xu</CardTitle>
              <CardDescription>
                {selectedPurchase.userId.name} - {selectedPurchase.amount.toLocaleString()} VND → {selectedPurchase.coins} xu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedPurchaseFull?.receiptImage && (
                <div>
                  <Label>Ảnh biên lai</Label>
                  <div className="mt-2">
                    <img src={selectedPurchaseFull.receiptImage} alt="Receipt" className="w-full max-h-80 object-contain border rounded" />
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="adminNotes">Ghi chú (tùy chọn)</Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Nhập ghi chú cho người dùng..."
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => handleApprove(selectedPurchase._id)}
                  disabled={isProcessing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Duyệt
                </Button>
                <Button
                  onClick={() => handleReject(selectedPurchase._id)}
                  disabled={isProcessing}
                  variant="destructive"
                  className="flex-1"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Từ chối
                </Button>
              </div>
              
              <Button
                onClick={() => {
                  setSelectedPurchase(null)
                  setSelectedPurchaseFull(null)
                  setAdminNotes('')
                }}
                variant="outline"
                className="w-full"
              >
                Hủy
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
