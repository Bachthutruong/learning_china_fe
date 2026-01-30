import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Coins, CheckCircle, Clock, XCircle, Upload, Loader2, Gem, Shield, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import { Badge } from '@/components/ui/badge'

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

export const CoinPurchase = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'purchase' | 'history'>('purchase')
  const [purchases, setPurchases] = useState<CoinPurchase[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [paymentConfig, setPaymentConfig] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [amount, setAmount] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [receiptImage, setReceiptImage] = useState('')
  const [currency, setCurrency] = useState<'TWD' | 'VND'>('TWD')

  useEffect(() => {
    if (activeTab === 'history') fetchHistory()
    else fetchConfig()
  }, [activeTab])

  useEffect(() => {
    if (activeTab === 'history') fetchHistory()
  }, [currentPage, itemsPerPage])

  const fetchConfig = async () => {
    try {
      const res = await api.get('/coin-purchases/config/payment')
      setPaymentConfig(res.data.config)
    } catch {
      toast.error('Không thể tải cấu hình thanh toán')
    }
  }

  const fetchHistory = async () => {
    try {
      setIsLoading(true)
      const res = await api.get(`/coin-purchases/my-purchases?page=${currentPage}&limit=${itemsPerPage}`)
      setPurchases(res.data.purchases)
      setTotalPages(res.data.totalPages || 1)
      setTotalItems(res.data.totalItems || 0)
    } catch {
      toast.error('Không thể tải lịch sử mua xu')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước file không được vượt quá 5MB')
      return
    }

    handleUpload(file)
  }

  const handleUpload = async (file: File) => {
    setIsUploading(true)
    try {
      const data = new FormData()
      data.append('image', file)
      const res = await api.post('/upload/receipt', data, { headers: { 'Content-Type': 'multipart/form-data' } })
      setReceiptImage(res.data.imageUrl)
      toast.success('Ảnh biên lai đã được upload thành công!')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi upload ảnh biên lai')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!amount || parseInt(amount) < 1) {
      toast.error('Số tiền tối thiểu là 1')
      return
    }

    setIsSubmitting(true)
    try {
      await api.post('/coin-purchases', {
        amount: parseInt(amount),
        bankAccount: bankAccount || undefined,
        transactionId: transactionId || undefined,
        receiptImage: receiptImage || undefined,
        currency
      })
      toast.success('Yêu cầu mua xu đã được gửi! Vui lòng chờ admin duyệt.')

      setAmount('')
      setBankAccount('')
      setTransactionId('')
      setReceiptImage('')
      setActiveTab('history')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo yêu cầu mua xu')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelPurchase = async (purchaseId: string) => {
    try {
      await api.put(`/coin-purchases/${purchaseId}`, { action: 'cancel' })
      toast.success('Đã hủy yêu cầu mua xu')
      fetchHistory()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi hủy yêu cầu')
    }
  }

  const calculateCoins = (amt: number) => {
    if (!paymentConfig) return 0
    const cfg = currency === 'VND' ? paymentConfig.vn : paymentConfig.tw
    return Math.floor(amt * cfg.exchangeRate)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="rounded-xl font-black uppercase text-[9px] bg-green-100 text-green-700 border-none"><CheckCircle className="w-3 h-3 mr-1" />Đã duyệt</Badge>
      case 'rejected':
        return <Badge className="rounded-xl font-black uppercase text-[9px] bg-red-100 text-red-700 border-none"><XCircle className="w-3 h-3 mr-1" />Từ chối</Badge>
      case 'cancelled':
        return <Badge className="rounded-xl font-black uppercase text-[9px] bg-gray-100 text-gray-500 border-none"><XCircle className="w-3 h-3 mr-1" />Đã hủy</Badge>
      default:
        return <Badge className="rounded-xl font-black uppercase text-[9px] bg-amber-100 text-amber-700 border-none"><Clock className="w-3 h-3 mr-1" />Chờ duyệt</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
           <div className="w-16 h-16 chinese-gradient rounded-2xl flex items-center justify-center mx-auto shadow-lg"><Coins className="text-white" /></div>
           <h1 className="text-4xl font-black text-gray-900">Nạp Xu <span className="text-primary">Học tập</span></h1>
           {user && <div className="inline-flex items-center space-x-3 bg-white px-6 py-3 rounded-2xl shadow-sm border mt-4"><Gem className="text-amber-500 fill-current" /><div><p className="text-[10px] font-black uppercase text-gray-400">Số dư</p><p className="text-xl font-black">{user.coins.toLocaleString()} Xu</p></div></div>}
        </div>

        <div className="flex justify-center gap-2 bg-white p-1.5 rounded-2xl border w-fit mx-auto">
           <button onClick={() => setActiveTab('purchase')} className={`px-8 py-3 rounded-xl text-sm font-black ${activeTab === 'purchase' ? 'chinese-gradient text-white shadow-lg' : 'text-gray-400'}`}>Nạp Xu</button>
           <button onClick={() => setActiveTab('history')} className={`px-8 py-3 rounded-xl text-sm font-black ${activeTab === 'history' ? 'chinese-gradient text-white shadow-lg' : 'text-gray-400'}`}>Lịch sử</button>
        </div>

        {activeTab === 'purchase' ? (
          <div className="bg-white rounded-[2.5rem] border shadow-xl overflow-hidden grid lg:grid-cols-5">
             <div className="lg:col-span-2 chinese-gradient p-10 text-white relative">
                <h3 className="text-2xl font-black mb-8">Hướng dẫn</h3>
                <div className="space-y-6">{['Chọn quốc gia', 'Chuyển khoản', 'Tải biên lai'].map((s, i) => <div key={i} className="flex gap-4"><span className="text-3xl font-black opacity-20">0{i+1}</span><p className="font-bold">{s}</p></div>)}</div>
                <div className="mt-10 pt-8 border-t border-white/10 flex gap-3"><Shield className="opacity-80" /><p className="text-[10px] font-bold">Giao dịch an toàn & bảo mật.</p></div>
             </div>
             <div className="lg:col-span-3 p-10 space-y-8">
                {paymentConfig && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-gray-400">Tài khoản nạp</span>
                      <Select value={currency} onValueChange={(v: any) => setCurrency(v)}>
                        <SelectTrigger className="w-40 rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TWD">Đài Loan (TWD)</SelectItem>
                          <SelectItem value="VND">Việt Nam (VND)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-3xl border flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-black text-gray-400">Ngân hàng</p>
                        <p className="font-bold">{currency === 'VND' ? paymentConfig.vn.bankName : paymentConfig.tw.bankName}</p>
                        <p className="text-sm font-black text-primary mt-2">{currency === 'VND' ? paymentConfig.vn.bankAccount : paymentConfig.tw.bankAccount}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Chủ TK: {currency === 'VND' ? paymentConfig.vn.accountHolder : paymentConfig.tw.accountHolder}
                        </p>
                      </div>
                      <img src={currency === 'VND' ? paymentConfig.vn.qrCodeImage : paymentConfig.tw.qrCodeImage} className="w-24 h-24 rounded-xl border-4 border-white shadow-lg" alt="QR" />
                    </div>
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-6">
                   {/* Amount */}
                   <div className="space-y-2">
                     <Label className="text-xs font-black uppercase text-gray-400">Số tiền ({currency})</Label>
                     <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="h-14 rounded-2xl text-lg font-black" placeholder="0.00" min="1" />
                     {amount && parseInt(amount) >= 1 && (
                       <p className="text-sm font-bold text-green-600">
                         Bạn sẽ nhận được: <strong>{calculateCoins(parseInt(amount)).toLocaleString()} xu</strong>
                         {paymentConfig && (
                           <span className="text-gray-400 ml-2 text-xs">
                             (Tỷ lệ: 1 {currency} = {(currency === 'VND' ? paymentConfig.vn : paymentConfig.tw)?.exchangeRate} xu)
                           </span>
                         )}
                       </p>
                     )}
                   </div>

                   {/* Bank Account */}
                   <div className="space-y-2">
                     <Label className="text-xs font-black uppercase text-gray-400">Số tài khoản ngân hàng của bạn</Label>
                     <Input value={bankAccount} onChange={e => setBankAccount(e.target.value)} className="h-12 rounded-2xl font-bold" placeholder="Nhập số tài khoản ngân hàng" />
                   </div>

                   {/* Transaction ID */}
                   <div className="space-y-2">
                     <Label className="text-xs font-black uppercase text-gray-400">Mã giao dịch (nếu có)</Label>
                     <Input value={transactionId} onChange={e => setTransactionId(e.target.value)} className="h-12 rounded-2xl font-bold" placeholder="Nhập mã giao dịch" />
                   </div>

                   {/* Receipt Upload */}
                   <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-gray-400">Bằng chứng chuyển khoản</Label>
                     <div
                       onClick={() => !isUploading && document.getElementById('file-up')?.click()}
                       className="h-32 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer bg-gray-50/50 hover:bg-white transition-all"
                     >
                       {isUploading ? (
                         <Loader2 className="animate-spin" />
                       ) : receiptImage ? (
                         <div className="flex items-center gap-4">
                           <img src={receiptImage} className="h-24 w-24 object-cover rounded-lg" />
                           <Button
                             type="button"
                             variant="ghost"
                             size="sm"
                             className="text-red-500 hover:text-red-700"
                             onClick={(e) => { e.stopPropagation(); setReceiptImage('') }}
                           >
                             <X className="w-4 h-4 mr-1" /> Xóa
                           </Button>
                         </div>
                       ) : (
                         <>
                           <Upload className="text-gray-300 mb-2" />
                           <p className="text-[10px] font-bold text-gray-400">Tải ảnh biên lai</p>
                         </>
                       )}
                     </div>
                     <input id="file-up" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                     <p className="text-[10px] text-gray-400">Hỗ trợ: JPG, PNG, GIF, WebP. Tối đa: 5MB</p>
                   </div>

                   <Button type="submit" disabled={isSubmitting || !amount || parseInt(amount) < 1} className="w-full h-16 rounded-2xl chinese-gradient text-white font-black text-xl shadow-xl">
                     {isSubmitting ? <Loader2 className="animate-spin" /> : 'Xác nhận nạp Xu'}
                   </Button>
                </form>
             </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in">
             {/* Controls */}
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
               <div className="flex items-center gap-3">
                 <span className="text-[10px] font-black uppercase text-gray-400">Hiển thị:</span>
                 <Select value={itemsPerPage.toString()} onValueChange={(v) => { setItemsPerPage(parseInt(v)); setCurrentPage(1) }}>
                   <SelectTrigger className="w-20 rounded-xl h-9"><SelectValue /></SelectTrigger>
                   <SelectContent>
                     <SelectItem value="5">5</SelectItem>
                     <SelectItem value="10">10</SelectItem>
                     <SelectItem value="20">20</SelectItem>
                     <SelectItem value="50">50</SelectItem>
                   </SelectContent>
                 </Select>
                 <span className="text-xs text-gray-400 font-bold">
                   {totalItems > 0 ? `${((currentPage - 1) * itemsPerPage) + 1}-${Math.min(currentPage * itemsPerPage, totalItems)} / ${totalItems}` : '0 mục'}
                 </span>
               </div>
             </div>

             {/* Table */}
             <div className="bg-white rounded-[2.5rem] border shadow-xl overflow-hidden">
               <table className="w-full text-left">
                 <thead>
                   <tr className="bg-gray-50/50 border-b">
                     <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400">Giao dịch</th>
                     <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 text-center">Trạng thái</th>
                     <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 text-right">Thời gian</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y">
                   {isLoading ? (
                     <tr><td colSpan={3} className="py-20 text-center"><Loader2 className="animate-spin mx-auto" /></td></tr>
                   ) : purchases.length === 0 ? (
                     <tr><td colSpan={3} className="py-20 text-center">
                       <Coins className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                       <p className="font-bold text-gray-400">Chưa có giao dịch nào</p>
                     </td></tr>
                   ) : purchases.map(p => (
                     <tr key={p._id} className="group hover:bg-gray-50/50">
                       <td className="px-8 py-6">
                         <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-primary shrink-0">
                             <Coins />
                           </div>
                           <div>
                             <p className="text-sm font-black">{p.amount.toLocaleString()} {p.currency} → {p.coins.toLocaleString()} Xu</p>
                             {p.bankAccount && <p className="text-[10px] text-gray-400 font-medium">TK: {p.bankAccount}</p>}
                           </div>
                         </div>
                       </td>
                       <td className="px-8 py-6 text-center">
                         <div className="space-y-1">
                           {getStatusBadge(p.status)}
                           {p.adminNotes && <p className="text-[10px] text-gray-500 mt-1">Ghi chú: {p.adminNotes}</p>}
                         </div>
                       </td>
                       <td className="px-8 py-6 text-right">
                         <div className="space-y-2">
                           <p className="text-xs font-black">
                             {new Date(p.createdAt).toLocaleDateString('vi-VN', {
                               year: 'numeric', month: '2-digit', day: '2-digit',
                               hour: '2-digit', minute: '2-digit'
                             })}
                           </p>
                           {p.status === 'pending' && p.canEdit && (
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => handleCancelPurchase(p._id)}
                               className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 text-[10px] font-black rounded-lg"
                             >
                               <X className="w-3 h-3 mr-1" /> Hủy
                             </Button>
                           )}
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>

             {/* Pagination */}
             {totalPages > 1 && (
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-1">
                   <Button variant="ghost" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="rounded-lg h-9 w-9 p-0">
                     <ChevronsLeft className="w-4 h-4" />
                   </Button>
                   <Button variant="ghost" size="sm" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} className="rounded-lg h-9 w-9 p-0">
                     <ChevronLeft className="w-4 h-4" />
                   </Button>
                   {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                     let pageNum
                     if (totalPages <= 5) pageNum = i + 1
                     else if (currentPage <= 3) pageNum = i + 1
                     else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i
                     else pageNum = currentPage - 2 + i
                     return (
                       <Button
                         key={pageNum}
                         variant={currentPage === pageNum ? 'default' : 'ghost'}
                         size="sm"
                         onClick={() => setCurrentPage(pageNum)}
                         className={`rounded-lg h-9 w-9 p-0 font-black ${currentPage === pageNum ? 'chinese-gradient text-white' : 'text-gray-400'}`}
                       >
                         {pageNum}
                       </Button>
                     )
                   })}
                   <Button variant="ghost" size="sm" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} className="rounded-lg h-9 w-9 p-0">
                     <ChevronRight className="w-4 h-4" />
                   </Button>
                   <Button variant="ghost" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="rounded-lg h-9 w-9 p-0">
                     <ChevronsRight className="w-4 h-4" />
                   </Button>
                 </div>
                 <span className="text-xs font-bold text-gray-400">Trang {currentPage} / {totalPages}</span>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  )
}
