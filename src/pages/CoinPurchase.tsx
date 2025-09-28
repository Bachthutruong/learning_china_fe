import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
// import { Textarea } from '../components/ui/textarea'
import { 
  Coins, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  CheckCircle, 
  Clock, 
  XCircle,
  // Upload,
  Loader2
} from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'

interface CoinPurchase {
  _id: string
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

export const CoinPurchase = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'purchase' | 'history'>('purchase')
  const [purchases, setPurchases] = useState<CoinPurchase[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Purchase form state
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [bankAccount, setBankAccount] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [proofOfPayment, setProofOfPayment] = useState('')

  useEffect(() => {
    if (activeTab === 'history') {
      fetchPurchaseHistory()
    }
  }, [activeTab])

  const fetchPurchaseHistory = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/coin-purchases/my-purchases')
      setPurchases(response.data.purchases)
    } catch (error) {
      console.error('Error fetching purchase history:', error)
      toast.error('Không thể tải lịch sử mua xu')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitPurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!amount || parseInt(amount) < 10000) {
      toast.error('Số tiền tối thiểu là 10,000 VND')
      return
    }

    setIsSubmitting(true)
    try {
      await api.post('/coin-purchases', {
        amount: parseInt(amount),
        paymentMethod,
        bankAccount: bankAccount || undefined,
        transactionId: transactionId || undefined,
        proofOfPayment: proofOfPayment || undefined
      })

      toast.success('Yêu cầu mua xu đã được gửi! Vui lòng chờ admin duyệt.')
      
      // Reset form
      setAmount('')
      setBankAccount('')
      setTransactionId('')
      setProofOfPayment('')
      
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

  const calculateCoins = (amount: number) => Math.floor(amount / 1000)

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
                {/* Amount Input */}
                <div className="space-y-2">
                  <Label htmlFor="amount">Số tiền (VND)</Label>
                  <div className="relative">
                    <Input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Nhập số tiền (tối thiểu 10,000 VND)"
                      min="10000"
                      required
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                      VND
                    </div>
                  </div>
                  {amount && parseInt(amount) >= 10000 && (
                    <p className="text-sm text-green-600">
                      Bạn sẽ nhận được: <strong>{calculateCoins(parseInt(amount))} xu</strong>
                    </p>
                  )}
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                  <Label>Phương thức thanh toán</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: 'bank_transfer', label: 'Chuyển khoản', icon: Banknote },
                      { value: 'momo', label: 'MoMo', icon: Smartphone },
                      { value: 'zalopay', label: 'ZaloPay', icon: Smartphone },
                      { value: 'vnpay', label: 'VNPay', icon: CreditCard }
                    ].map((method) => (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => setPaymentMethod(method.value)}
                        className={`p-4 border rounded-lg text-left transition-colors ${
                          paymentMethod === method.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <method.icon className="h-6 w-6 mb-2" />
                        <div className="font-medium">{method.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bank Account (for bank transfer) */}
                {paymentMethod === 'bank_transfer' && (
                  <div className="space-y-2">
                    <Label htmlFor="bankAccount">Số tài khoản ngân hàng</Label>
                    <Input
                      id="bankAccount"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      placeholder="Nhập số tài khoản"
                    />
                  </div>
                )}

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

                {/* Proof of Payment */}
                <div className="space-y-2">
                  <Label htmlFor="proofOfPayment">Link ảnh chứng minh thanh toán</Label>
                  <Input
                    id="proofOfPayment"
                    value={proofOfPayment}
                    onChange={(e) => setProofOfPayment(e.target.value)}
                    placeholder="Dán link ảnh chụp màn hình giao dịch"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting || !amount || parseInt(amount) < 10000}
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
          <div className="space-y-4">
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
              purchases.map((purchase) => (
                <Card key={purchase._id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(purchase.status)}
                        <div>
                          <h3 className="font-semibold text-lg">
                            {purchase.amount.toLocaleString()} VND → {purchase.coins} xu
                          </h3>
                          <p className="text-sm text-gray-600">
                            {getPaymentMethodText(purchase.paymentMethod)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          purchase.status === 'approved' 
                            ? 'bg-green-100 text-green-800'
                            : purchase.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {getStatusText(purchase.status)}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(purchase.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    
                    {purchase.adminNotes && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <strong>Ghi chú từ admin:</strong> {purchase.adminNotes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
