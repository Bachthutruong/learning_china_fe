import { useState, useEffect } from 'react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import {
  Coins,
  Search,
  Loader2,
  X,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  CreditCard,
  Building2,
  Receipt,
  MessageSquare
} from 'lucide-react'
import { Badge } from '../../components/ui/badge'
import { api } from '../../services/api'
import toast from 'react-hot-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../components/ui/dialog'
import { Textarea } from '../../components/ui/textarea'

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
  receiptImage?: string
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
  const [currencyFilter, setCurrencyFilter] = useState<'all' | 'TWD' | 'VND'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    fetchPurchases()
  }, [filter, currencyFilter, currentPage, itemsPerPage, searchTerm, startDate, endDate])

  const fetchPurchases = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.append('status', filter)
      params.append('page', String(currentPage))
      params.append('limit', String(itemsPerPage))
      if (searchTerm) params.append('search', searchTerm)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      
      const response = await api.get(`/coin-purchases/admin/all?${params.toString()}`)
      let list: CoinPurchase[] = response.data.purchases || []
      
      if (currencyFilter !== 'all') {
        list = list.filter(p => (p.currency || 'VND') === currencyFilter)
      }
      
      setPurchases(list)
      setTotalPages(response.data.totalPages || 1)
      setTotalItems(response.data.total || list.length)
    } catch (error) {
      toast.error('Không thể tải danh sách mua xu')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (purchaseId: string) => {
    setIsProcessing(true)
    try {
      await api.put(`/coin-purchases/admin/${purchaseId}/approve`, { adminNotes })
      toast.success('Đã duyệt yêu cầu mua xu')
      setSelectedPurchase(null)
      setAdminNotes('')
      fetchPurchases()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi duyệt')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async (purchaseId: string) => {
    setIsProcessing(true)
    try {
      await api.put(`/coin-purchases/admin/${purchaseId}/reject`, { adminNotes })
      toast.success('Đã từ chối yêu cầu mua xu')
      setSelectedPurchase(null)
      setAdminNotes('')
      fetchPurchases()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi từ chối')
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusText = (status: string) => {
    if (status === 'approved') return 'Đã duyệt'
    if (status === 'rejected') return 'Từ chối'
    return 'Chờ duyệt'
  }

  const filteredPurchases = purchases.filter(p => 
    searchTerm === '' || 
    p.userId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.userId.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.transactionId?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const pendingCount = purchases.filter(p => p.status === 'pending').length

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center tracking-tight">
             <div className="w-10 h-10 chinese-gradient rounded-xl flex items-center justify-center text-white mr-4 shadow-lg">
                <Coins className="w-6 h-6" />
             </div>
             Quản trị doanh thu
          </h1>
          <p className="text-gray-500 font-medium">Kiểm soát và phê duyệt các giao dịch nạp Xu toàn hệ thống.</p>
        </div>
        {pendingCount > 0 && (
          <Badge className="bg-amber-100 text-amber-700 border-none px-4 py-2 rounded-xl font-black animate-pulse shadow-sm shadow-amber-100">
            {pendingCount} YÊU CẦU CHỜ DUYỆT
          </Badge>
        )}
      </div>

      {/* Control Bar */}
      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl space-y-6">
         <div className="flex flex-col lg:flex-row lg:items-end gap-6">
            <div className="flex-1 space-y-2">
               <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Tìm kiếm giao dịch</Label>
               <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-primary transition-colors" />
                  <Input 
                    placeholder="Tìm theo tên học viên, email hoặc mã GD..." 
                    value={searchTerm} 
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                    className="h-12 pl-11 rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-primary/20 transition-all font-bold" 
                  />
               </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Từ ngày</Label>
                  <Input 
                    type="date"
                    value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                    className="h-12 rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white transition-all font-bold text-xs"
                  />
               </div>
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Đến ngày</Label>
                  <Input 
                    type="date"
                    value={endDate}
                    onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                    className="h-12 rounded-xl bg-gray-50/50 border-gray-100 focus:bg-white transition-all font-bold text-xs"
                  />
               </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-6">
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Trạng thái</Label>
                  <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100 h-12 items-center">
                     {[
                       { v: 'all', l: 'Tất cả' },
                       { v: 'pending', l: 'Đợi' },
                       { v: 'approved', l: 'Duyệt' },
                       { v: 'rejected', l: 'Hủy' }
                     ].map((s) => (
                       <button 
                         key={s.v} 
                         onClick={() => { setFilter(s.v as any); setCurrentPage(1); }} 
                         className={`px-4 h-full rounded-lg text-[10px] font-black uppercase transition-all ${filter === s.v ? 'chinese-gradient text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                       >
                          {s.l}
                       </button>
                     ))}
                  </div>
               </div>

               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Tiền tệ</Label>
                  <Select value={currencyFilter} onValueChange={(v: any) => { setCurrencyFilter(v); setCurrentPage(1); }}>
                     <SelectTrigger className="w-32 h-12 rounded-xl border-gray-100 bg-gray-50 font-black text-xs focus:bg-white transition-all">
                        <SelectValue />
                     </SelectTrigger>
                     <SelectContent className="rounded-xl border-gray-100">
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="TWD">Đài Loan (TWD)</SelectItem>
                        <SelectItem value="VND">Việt Nam (VND)</SelectItem>
                     </SelectContent>
                  </Select>
               </div>

               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Hiển thị</Label>
                  <Select value={itemsPerPage.toString()} onValueChange={(v) => { setItemsPerPage(parseInt(v)); setCurrentPage(1); }}>
                     <SelectTrigger className="w-24 h-12 rounded-xl border-gray-100 bg-gray-50 font-black text-xs focus:bg-white transition-all">
                        <SelectValue />
                     </SelectTrigger>
                     <SelectContent className="rounded-xl border-gray-100">
                        <SelectItem value="10">10 dòng</SelectItem>
                        <SelectItem value="20">20 dòng</SelectItem>
                        <SelectItem value="50">50 dòng</SelectItem>
                     </SelectContent>
                  </Select>
               </div>
            </div>
         </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-xl">
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                     <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Học viên</th>
                     <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Giao dịch</th>
                     <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Phương thức</th>
                     <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Trạng thái</th>
                     <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Thao tác</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {isLoading ? (
                    <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>
                  ) : filteredPurchases.length === 0 ? (
                    <tr><td colSpan={5} className="py-20 text-center text-gray-400 font-bold italic">Không tìm thấy dữ liệu giao dịch nào.</td></tr>
                  ) : filteredPurchases.map((p) => (
                    <tr key={p._id} className="group hover:bg-gray-50/30 transition-colors">
                       <td className="px-8 py-6">
                          <div className="flex items-center space-x-4">
                             <div className="w-12 h-12 rounded-2xl chinese-gradient flex items-center justify-center text-white font-black text-xl shadow-md transform group-hover:rotate-6 transition-transform">
                                {p.userId.name ? p.userId.name[0].toUpperCase() : '?'}
                             </div>
                             <div>
                                <p className="text-sm font-black text-gray-900 leading-none mb-1">{p.userId.name}</p>
                                <p className="text-[11px] text-gray-400 font-medium">{p.userId.email}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <div className="space-y-1">
                             <p className="text-sm font-black text-gray-900">
                                {p.amount.toLocaleString()} {p.currency || 'VND'}
                                <span className="mx-2 text-gray-300">→</span>
                                <span className="text-primary">{p.coins.toLocaleString()} Xu</span>
                             </p>
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center">
                                <Clock className="w-3 h-3 mr-1" /> {new Date(p.createdAt).toLocaleDateString('vi-VN')} {new Date(p.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                             </p>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex flex-col space-y-1">
                             <Badge variant="outline" className="w-fit text-[9px] font-black uppercase border-gray-200 text-gray-500 rounded-lg h-6">
                                {p.paymentMethod === 'bank_transfer' ? 'Chuyển khoản' : p.paymentMethod}
                             </Badge>
                             {p.transactionId && <p className="text-[10px] font-medium text-gray-400">ID: {p.transactionId}</p>}
                          </div>
                       </td>
                       <td className="px-8 py-6 text-center">
                          <Badge className={`rounded-xl font-black uppercase text-[9px] px-3 py-1 border-none ${
                            p.status === 'approved' ? 'bg-green-100 text-green-700' : 
                            p.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                            'bg-amber-100 text-amber-700 shadow-sm shadow-amber-50'
                          }`}>
                             {getStatusText(p.status)}
                          </Badge>
                       </td>
                       <td className="px-8 py-6 text-right">
                          <div className="flex justify-end space-x-2">
                             {p.status === 'pending' ? (
                               <Button 
                                 onClick={() => setSelectedPurchase(p)} 
                                 className="chinese-gradient h-10 px-6 rounded-xl font-black text-[10px] text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 transform hover:-translate-y-0.5 transition-all"
                               >
                                  PHÊ DUYỆT
                               </Button>
                             ) : (
                               <Button 
                                 variant="ghost" 
                                 size="icon" 
                                 onClick={() => setSelectedPurchase(p)}
                                 className="w-10 h-10 rounded-xl hover:bg-gray-100 text-gray-400"
                               >
                                  <Eye className="w-4.5 h-4.5" />
                               </Button>
                             )}
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-4 mt-8">
           <Button variant="ghost" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)} className="rounded-xl font-bold text-xs uppercase text-gray-400 hover:text-primary">Trang trước</Button>
           <div className="bg-white px-6 py-2 rounded-2xl border border-gray-100 shadow-sm font-black text-sm text-gray-900">
              Trang {currentPage} / {totalPages}
           </div>
           <Button variant="ghost" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="rounded-xl font-bold text-xs uppercase text-gray-400 hover:text-primary">Trang sau</Button>
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={!!selectedPurchase} onOpenChange={(open) => !open && setSelectedPurchase(null)}>
        <DialogContent className="rounded-[2.5rem] p-10 max-w-2xl border-none shadow-2xl">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-3xl font-black text-gray-900 flex items-center">
               <div className="w-12 h-12 chinese-gradient rounded-2xl flex items-center justify-center text-white mr-4 shadow-lg">
                  <Receipt className="w-6 h-6" />
               </div>
               {selectedPurchase?.status === 'pending' ? 'Xử lý giao dịch' : 'Chi tiết giao dịch'}
            </DialogTitle>
            <DialogDescription className="font-medium text-gray-500">
               Mã hệ thống: {selectedPurchase?._id}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8 pt-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Transaction Info */}
                <div className="space-y-6">
                   <div className="bg-gray-50 p-6 rounded-3xl space-y-4 border border-gray-100 shadow-inner">
                      <div className="flex items-center space-x-3">
                         <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary"><CreditCard className="w-5 h-5" /></div>
                         <div><p className="text-[10px] font-black uppercase text-gray-400">Số tiền nạp</p><p className="text-xl font-black text-gray-900">{selectedPurchase?.amount.toLocaleString()} {selectedPurchase?.currency}</p></div>
                      </div>
                      <div className="flex items-center space-x-3">
                         <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-amber-500"><Coins className="w-5 h-5" /></div>
                         <div><p className="text-[10px] font-black uppercase text-gray-400">Xu hệ thống</p><p className="text-xl font-black text-amber-500">+{selectedPurchase?.coins.toLocaleString()} Xu</p></div>
                      </div>
                   </div>

                   <div className="space-y-4 px-2">
                      <div className="flex items-center justify-between text-sm">
                         <span className="text-gray-400 font-bold uppercase text-[10px] flex items-center"><Building2 className="w-3 h-3 mr-1.5" /> Tài khoản nạp:</span>
                         <span className="font-black text-gray-700">{selectedPurchase?.bankAccount || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                         <span className="text-gray-400 font-bold uppercase text-[10px] flex items-center"><Receipt className="w-3 h-3 mr-1.5" /> Mã giao dịch:</span>
                         <span className="font-black text-gray-700">{selectedPurchase?.transactionId || 'N/A'}</span>
                      </div>
                   </div>
                </div>

                {/* Receipt Image */}
                <div className="space-y-3">
                   <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Minh chứng thanh toán (Receipt)</Label>
                   {selectedPurchase?.receiptImage ? (
                     <div className="aspect-[3/4] rounded-2xl border-2 border-gray-100 overflow-hidden group/img relative shadow-lg">
                        <img 
                          src={selectedPurchase.receiptImage} 
                          alt="Receipt" 
                          className="w-full h-full object-cover cursor-zoom-in" 
                          onClick={() => window.open(selectedPurchase.receiptImage, '_blank')}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                           <Eye className="text-white w-8 h-8" />
                        </div>
                     </div>
                   ) : (
                     <div className="aspect-[3/4] rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center p-6 space-y-3">
                        <Receipt className="w-10 h-10 text-gray-300" />
                        <p className="text-xs font-bold text-gray-400">Học viên không đính kèm ảnh biên lai.</p>
                     </div>
                   )}
                </div>
             </div>

             <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-gray-400 ml-1 flex items-center">
                   <MessageSquare className="w-3 h-3 mr-1.5" /> 
                   {selectedPurchase?.status === 'pending' ? 'Ghi chú phê duyệt' : 'Ghi chú hệ thống'}
                </Label>
                <Textarea 
                  value={adminNotes || selectedPurchase?.adminNotes || ''} 
                  onChange={(e) => setAdminNotes(e.target.value)} 
                  placeholder={selectedPurchase?.status === 'pending' ? "Nhập lý do từ chối hoặc lời nhắn gửi đến học viên..." : "Không có ghi chú."}
                  className="min-h-[100px] rounded-2xl border-gray-100 bg-gray-50 focus:bg-white focus:border-primary transition-all font-medium leading-relaxed"
                  readOnly={selectedPurchase?.status !== 'pending'}
                />
             </div>
          </div>

          <DialogFooter className="gap-4 mt-10">
             <Button 
               variant="ghost" 
               onClick={() => setSelectedPurchase(null)} 
               className="flex-1 h-14 rounded-2xl font-black text-gray-400 hover:bg-gray-50"
             >
                Hủy bỏ
             </Button>
             
             {selectedPurchase?.status === 'pending' && (
               <>
                 <Button 
                   onClick={() => handleReject(selectedPurchase!._id)} 
                   disabled={isProcessing} 
                   variant="outline" 
                   className="flex-1 h-14 rounded-2xl border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 font-black shadow-lg shadow-red-50"
                 >
                    <XCircle className="w-5 h-5 mr-2" /> TỪ CHỐI
                 </Button>
                 <Button 
                   onClick={() => handleApprove(selectedPurchase!._id)} 
                   disabled={isProcessing} 
                   className="flex-[1.5] h-14 rounded-2xl chinese-gradient text-white font-black shadow-xl shadow-primary/20 hover:shadow-primary/30 transform hover:-translate-y-1 transition-all"
                 >
                    <CheckCircle className="w-5 h-5 mr-2" /> DUYỆT NẠP XU
                 </Button>
               </>
             )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mt-8 flex items-center justify-center space-x-2">
         <Badge variant="outline" className="rounded-lg font-black text-[8px] uppercase tracking-widest border-gray-200 text-gray-400 px-3 h-6">
            Data Ledger Synchronized
         </Badge>
         <span className="text-[10px] font-black text-gray-300 uppercase">Total: {totalItems} entries</span>
      </div>
    </div>
  )
}

export default AdminCoinPurchases
