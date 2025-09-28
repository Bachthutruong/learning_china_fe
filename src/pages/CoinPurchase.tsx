import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
// import { Textarea } from '../components/ui/textarea'
import { 
  Coins, 
  CheckCircle, 
  Clock, 
  XCircle,
  Upload,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'

interface CoinPurchase {
  _id: string
  amount: number
  currency: string
  coins: number
  paymentMethod: string
  bankAccount?: string
  transactionId?: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  adminNotes?: string
  receiptImage?: string
  canEdit: boolean
  createdAt: string
}

interface PaymentConfig {
  _id: string
  qrCodeImage: string
  exchangeRate: number
  bankAccount: string
  bankName: string
  accountHolder: string
  isActive: boolean
}

export const CoinPurchase = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'purchase' | 'history'>('purchase')
  const [purchases, setPurchases] = useState<CoinPurchase[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  
  // Purchase form state
  const [amount, setAmount] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [receiptImage, setReceiptImage] = useState('')

  useEffect(() => {
    if (activeTab === 'history') {
      fetchPurchaseHistory()
    } else if (activeTab === 'purchase') {
      fetchPaymentConfig()
    }
  }, [activeTab])

  useEffect(() => {
    if (activeTab === 'history') {
      fetchPurchaseHistory()
    }
  }, [currentPage, itemsPerPage])

  const fetchPaymentConfig = async () => {
    try {
      const response = await api.get('/coin-purchases/config/payment')
      setPaymentConfig(response.data.config)
    } catch (error) {
      console.error('Error fetching payment config:', error)
      toast.error('Không thể tải cấu hình thanh toán')
    }
  }

  const fetchPurchaseHistory = async () => {
    setIsLoading(true)
    try {
      const response = await api.get(`/coin-purchases/my-purchases?page=${currentPage}&limit=${itemsPerPage}`)
      setPurchases(response.data.purchases)
      setTotalPages(response.data.totalPages || 1)
      setTotalItems(response.data.totalItems || 0)
    } catch (error) {
      console.error('Error fetching purchase history:', error)
      toast.error('Không thể tải lịch sử mua xu')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitPurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!amount || parseInt(amount) < 1) {
      toast.error('Số tiền tối thiểu là 1 TWD')
      return
    }

    setIsSubmitting(true)
    try {
      await api.post('/coin-purchases', {
        amount: parseInt(amount),
        bankAccount: bankAccount || undefined,
        transactionId: transactionId || undefined,
        receiptImage: receiptImage || undefined
      })

      toast.success('Yêu cầu mua xu đã được gửi! Vui lòng chờ admin duyệt.')
      
      // Reset form
      setAmount('')
      setBankAccount('')
      setTransactionId('')
      setReceiptImage('')
      
      // Switch to history tab
      setActiveTab('history')
      fetchPurchaseHistory()
    } catch (error: any) {
      console.error('Error creating purchase:', error)
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo yêu cầu mua xu')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReceiptUpload = async (file: File) => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await api.post('/upload/receipt', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      console.log('Receipt upload response:', response.data)
      setReceiptImage(response.data.imageUrl)
      toast.success('Ảnh biên lai đã được upload thành công!')
    } catch (error: any) {
      console.error('Error uploading receipt:', error)
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi upload ảnh biên lai')
    } finally {
      setIsUploading(false)
    }
  }

  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file ảnh')
        return
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước file không được vượt quá 5MB')
        return
      }

      handleReceiptUpload(file)
    }
  }

  const handleUpdatePurchase = async (purchaseId: string, action: 'edit' | 'cancel') => {
    if (action === 'cancel') {
      try {
        await api.put(`/coin-purchases/${purchaseId}`, { action: 'cancel' })
        toast.success('Đã hủy yêu cầu mua xu')
        fetchPurchaseHistory()
      } catch (error: any) {
        console.error('Error cancelling purchase:', error)
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi hủy yêu cầu')
      }
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
      case 'cancelled':
        return 'Đã hủy'
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
      default:
        return method
    }
  }

  const calculateCoins = (amount: number) => {
    if (!paymentConfig) return 0
    return Math.floor(amount * paymentConfig.exchangeRate)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mua Xu</h1>
          <p className="text-gray-600">Mua xu để tham gia các bài test và cuộc thi</p>
          {user && (
            <div className="mt-4 inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
              <Coins className="h-5 w-5" />
              <span className="font-semibold">Xu hiện tại: {user.coins}</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('purchase')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'purchase'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Mua Xu
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Lịch Sử Mua
          </button>
        </div>

        {/* Purchase Form */}
        {activeTab === 'purchase' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-6 w-6 text-yellow-500" />
                Mua Xu Mới
              </CardTitle>
              <CardDescription>
                Điền thông tin để mua xu. Xu sẽ được cộng vào tài khoản sau khi admin duyệt.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitPurchase} className="space-y-6">
                {/* Payment Info */}
                {paymentConfig && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-blue-900 mb-3">Thông tin thanh toán</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-blue-700 mb-2">
                          <strong>Ngân hàng:</strong> {paymentConfig.bankName}
                        </p>
                        <p className="text-sm text-blue-700 mb-2">
                          <strong>Số tài khoản:</strong> {paymentConfig.bankAccount}
                        </p>
                        <p className="text-sm text-blue-700">
                          <strong>Chủ tài khoản:</strong> {paymentConfig.accountHolder}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-blue-700 mb-2">Quét mã QR để chuyển khoản</p>
                        <img 
                          src={paymentConfig.qrCodeImage} 
                          alt="QR Code" 
                          className="w-32 h-32 mx-auto border border-gray-300 rounded"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Amount Input */}
                <div className="space-y-2">
                  <Label htmlFor="amount">Số tiền (TWD)</Label>
                  <div className="relative">
                    <Input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Nhập số tiền (tối thiểu 1 TWD)"
                      min="1"
                      required
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                      TWD
                    </div>
                  </div>
                  {amount && parseInt(amount) >= 1 && (
                    <p className="text-sm text-green-600">
                      Bạn sẽ nhận được: <strong>{calculateCoins(parseInt(amount))} xu</strong>
                      {paymentConfig && (
                        <span className="text-gray-500 ml-2">
                          (Tỷ lệ: 1 TWD = {paymentConfig.exchangeRate} xu)
                        </span>
                      )}
                    </p>
                  )}
                </div>

                {/* Bank Account */}
                <div className="space-y-2">
                  <Label htmlFor="bankAccount">Số tài khoản ngân hàng của bạn</Label>
                  <Input
                    id="bankAccount"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="Nhập số tài khoản ngân hàng của bạn"
                  />
                </div>

                {/* Transaction ID */}
                <div className="space-y-2">
                  <Label htmlFor="transactionId">Mã giao dịch (nếu có)</Label>
                  <Input
                    id="transactionId"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Nhập mã giao dịch"
                  />
                </div>

                {/* Receipt Image */}
                <div className="space-y-2">
                  <Label htmlFor="receiptImage">Ảnh biên lai chuyển khoản</Label>
                  
                  {/* Upload Section */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      id="receiptImage"
                      accept="image/*"
                      onChange={handleReceiptFileChange}
                      className="hidden"
                      disabled={isUploading}
                    />
                    
                    {receiptImage ? (
                      <div className="space-y-4">
                        <img 
                          src={receiptImage} 
                          alt="Receipt Preview" 
                          className="w-32 h-32 mx-auto border border-gray-300 rounded object-cover"
                        />
                        <div className="flex gap-2 justify-center">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('receiptImage')?.click()}
                            disabled={isUploading}
                          >
                            {isUploading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Đang upload...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Thay đổi ảnh
                              </>
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setReceiptImage('')}
                            disabled={isUploading}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Xóa ảnh
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Upload className="h-12 w-12 mx-auto text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600 mb-2">
                            Chọn ảnh biên lai chuyển khoản
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('receiptImage')?.click()}
                            disabled={isUploading}
                          >
                            {isUploading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Đang upload...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Chọn ảnh
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    Hỗ trợ định dạng: JPG, PNG, GIF, WebP. Kích thước tối đa: 5MB
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting || !amount || parseInt(amount) < 1}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang gửi yêu cầu...
                    </>
                  ) : (
                    <>
                      <Coins className="h-4 w-4 mr-2" />
                      Gửi yêu cầu mua xu
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Purchase History */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="itemsPerPage" className="text-sm">Hiển thị:</Label>
                  <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                    setItemsPerPage(parseInt(value))
                    setCurrentPage(1)
                  }}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-gray-500">mục</span>
                </div>
                <div className="text-sm text-gray-600">
                  Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} trong {totalItems} mục
                </div>
              </div>
            </div>

            {/* Table */}
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : purchases.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Coins className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Chưa có giao dịch nào</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Giao dịch
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Trạng thái
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ngày tạo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Thao tác
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {purchases.map((purchase) => (
                          <tr key={purchase._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0">
                                  {getStatusIcon(purchase.status)}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {purchase.amount.toLocaleString()} {purchase.currency} → {purchase.coins.toLocaleString()} xu
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {getPaymentMethodText(purchase.paymentMethod)}
                                  </div>
                                  {purchase.bankAccount && (
                                    <div className="text-xs text-gray-400">
                                      TK: {purchase.bankAccount}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                purchase.status === 'approved' 
                                  ? 'bg-green-100 text-green-800'
                                  : purchase.status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : purchase.status === 'cancelled'
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {getStatusText(purchase.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(purchase.createdAt).toLocaleDateString('vi-VN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {purchase.status === 'pending' && purchase.canEdit && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUpdatePurchase(purchase._id, 'cancel')}
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  Hủy
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="text-sm text-gray-500">
                  Trang {currentPage} / {totalPages}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
