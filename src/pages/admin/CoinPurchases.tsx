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
  Clock, 
  Search,
  // Filter,
  Loader2,
  User,
  Calendar,
  CreditCard
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
  coins: number
  paymentMethod: string
  bankAccount?: string
  transactionId?: string
  status: 'pending' | 'approved' | 'rejected'
  adminNotes?: string
  proofOfPayment?: string
  createdAt: string
}

export const AdminCoinPurchases = () => {
  const [purchases, setPurchases] = useState<CoinPurchase[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPurchase, setSelectedPurchase] = useState<CoinPurchase | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    fetchPurchases()
  }, [filter])

  const fetchPurchases = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') {
        params.append('status', filter)
      }
      
      const response = await api.get(`/coin-purchases/admin/all?${params.toString()}`)
      setPurchases(response.data.purchases)
    } catch (error) {
      console.error('Error fetching purchases:', error)
      toast.error('Không thể tải danh sách mua xu')
    } finally {
      setIsLoading(false)
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

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
          <div className="flex flex-col sm:flex-row gap-4">
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
                    onClick={() => setFilter(option.value as any)}
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
          {filteredPurchases.map((purchase) => (
            <Card key={purchase._id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(purchase.status)}
                    <div>
                      <h3 className="font-semibold text-lg">
                        {purchase.amount.toLocaleString()} VND → {purchase.coins} xu
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {purchase.userId.name} ({purchase.userId.email})
                        </div>
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-4 w-4" />
                          {getPaymentMethodText(purchase.paymentMethod)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(purchase.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium mb-2 ${
                      purchase.status === 'approved' 
                        ? 'bg-green-100 text-green-800'
                        : purchase.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {getStatusText(purchase.status)}
                    </div>
                    {purchase.status === 'pending' && (
                      <Button
                        onClick={() => setSelectedPurchase(purchase)}
                        size="sm"
                      >
                        Xử lý
                      </Button>
                    )}
                  </div>
                </div>

                {/* Additional Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {purchase.bankAccount && (
                    <div>
                      <strong>Tài khoản:</strong> {purchase.bankAccount}
                    </div>
                  )}
                  {purchase.transactionId && (
                    <div>
                      <strong>Mã giao dịch:</strong> {purchase.transactionId}
                    </div>
                  )}
                  {purchase.proofOfPayment && (
                    <div className="md:col-span-2">
                      <strong>Chứng minh thanh toán:</strong>{' '}
                      <a 
                        href={purchase.proofOfPayment} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Xem ảnh
                      </a>
                    </div>
                  )}
                </div>

                {purchase.adminNotes && (
                  <div className="mt-4 bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Ghi chú admin:</strong> {purchase.adminNotes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {filteredPurchases.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Coins className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Không có giao dịch nào</p>
              </CardContent>
            </Card>
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
