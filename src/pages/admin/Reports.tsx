import { useEffect, useState } from 'react'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Dialog, DialogContent, DialogFooter, DialogHeader as UIDialogHeader, DialogTitle as UIDialogTitle } from '../../components/ui/dialog'
import { api } from '../../services/api'
import toast from 'react-hot-toast'
import { AlertCircle, CheckCircle, Search, XCircle } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'

interface ReportItem {
  _id: string
  id?: string
  type: 'vocabulary' | 'question' | 'test' | string
  targetId?: string
  category?: string
  description: string
  status: 'pending' | 'approved' | 'reviewed' | 'rejected' | string
  createdAt: string
  user?: {
    _id?: string
    email?: string
    username?: string
    name?: string
  }
  targetSummary?: {
    word?: string
    pronunciation?: string
    meaning?: string
    level?: number
    topics?: string[]
    question?: string
    questionType?: string
  }
}

const getStatusBadgeClass = (status: string) => {
  if (status === 'pending') return 'bg-amber-100 text-amber-700 border border-amber-200'
  if (status === 'approved' || status === 'reviewed') return 'bg-green-100 text-green-700 border border-green-200'
  if (status === 'rejected') return 'bg-red-100 text-red-700 border border-red-200'
  return 'bg-gray-200 text-gray-800'
}

const getStatusLabel = (status: string) => {
  if (status === 'reviewed') return 'approved'
  return status
}

export const AdminReports = () => {
  const [reports, setReports] = useState<ReportItem[]>([])
  const [rewardXp, setRewardXp] = useState<Record<string, number>>({})
  const [rewardCoins, setRewardCoins] = useState<Record<string, number>>({})
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [search, setSearch] = useState('')
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: 'approved' | 'rejected' } | null>(null)

  const fetchReports = async () => {
    try {
      const res = await api.get('/reports/admin/all', { params: { page, limit: pageSize, search } })
      setReports(res.data?.reports || [])
      setTotalPages(res.data?.totalPages || 1)
      setTotalItems(res.data?.total || 0)
    } catch {
      setReports([])
      setTotalPages(1)
      setTotalItems(0)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [page, pageSize, search])

  const updateReport = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const defaultXp = 0.5
      const defaultCoins = 0.5
      const rawXp = rewardXp[id]
      const rawCoins = rewardCoins[id]
      const xp = status === 'approved'
        ? (typeof rawXp === 'number' && !Number.isNaN(rawXp) ? rawXp : defaultXp)
        : 0
      const coins = status === 'approved'
        ? (typeof rawCoins === 'number' && !Number.isNaN(rawCoins) ? rawCoins : defaultCoins)
        : 0

      await api.put(`/reports/admin/${id}`, {
        status,
        rewardExperience: xp,
        rewardCoins: coins
      })
      if (status === 'approved') {
        toast.success(`Đã duyệt báo cáo và cộng ${xp} XP, ${coins} xu cho người dùng!`)
      } else {
        toast.success('Đã từ chối báo cáo')
      }
      fetchReports()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Cập nhật thất bại')
    }
  }

  const showReportDetail = (report: ReportItem) => {
    setSelectedReport(report)
    setShowDetailDialog(true)
  }

  const handleApproveReject = (id: string, action: 'approved' | 'rejected') => {
    setConfirmAction({ id, action })
  }

  const confirmActionHandler = async () => {
    if (confirmAction) {
      await updateReport(confirmAction.id, confirmAction.action)
      setConfirmAction(null)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-8 pb-8 sm:pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center flex-wrap gap-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 chinese-gradient rounded-xl flex items-center justify-center text-white shadow-lg shrink-0 mr-2 sm:mr-4">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            Trung tâm phản hồi
          </h1>
        </div>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-[2rem] border shadow-xl flex flex-col sm:flex-row gap-4 sm:gap-6 items-stretch sm:items-center">
        <div className="flex-1 min-w-0 relative group">
          <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
          <Input
            placeholder="Tìm kiếm..."
            value={search}
            onChange={e => { setPage(1); setSearch(e.target.value) }}
            className="h-11 sm:h-12 pl-10 sm:pl-11 rounded-xl min-h-[44px] bg-gray-50/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-gray-400 uppercase hidden xs:inline">Hiển thị</span>
          <Select value={pageSize.toString()} onValueChange={v => { setPageSize(parseInt(v)); setPage(1) }}>
            <SelectTrigger className="w-20 sm:w-24 h-10 sm:h-11 rounded-xl min-h-[44px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl sm:rounded-[2.5rem] border shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[500px]">
            <thead>
              <tr className="bg-gray-50/50 border-b">
                <th className="px-4 sm:px-6 md:px-8 py-3 sm:py-5 text-[10px] font-black uppercase text-gray-400">#</th>
                <th className="px-4 sm:px-6 md:px-8 py-3 sm:py-5 text-[10px] font-black uppercase text-gray-400">Loại</th>
                <th className="px-4 sm:px-6 md:px-8 py-3 sm:py-5 text-[10px] font-black uppercase text-gray-400">Nội dung</th>
                <th className="px-4 sm:px-6 md:px-8 py-3 sm:py-5 text-[10px] font-black uppercase text-gray-400 text-center">Trạng thái</th>
                <th className="px-4 sm:px-6 md:px-8 py-3 sm:py-5 text-[10px] font-black uppercase text-gray-400 hidden md:table-cell">Ngày tạo</th>
                <th className="px-4 sm:px-6 md:px-8 py-3 sm:py-5 text-[10px] font-black uppercase text-gray-400 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {reports.map((r, i) => (
                <tr key={r._id} className="group hover:bg-gray-50/50">
                <td className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 text-xs sm:text-sm text-gray-400">{(page - 1) * pageSize + i + 1}</td>
                <td className="px-4 sm:px-6 md:px-8 py-4 sm:py-6">
                  <Badge variant="outline" className="text-primary text-[10px]">{r.type}</Badge>
                </td>
                <td className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 min-w-0">
                  {r.type === 'vocabulary' && r.targetSummary?.word ? (
                    <div>
                      <p className="text-sm font-black">
                        {r.targetSummary.word}
                        <span className="text-gray-400 font-medium"> — {r.targetSummary.meaning}</span>
                      </p>
                      <p className="text-[10px] text-gray-400 italic line-clamp-1">"{r.description}"</p>
                    </div>
                  ) : r.type === 'question' && r.targetSummary?.question ? (
                    <div>
                      <p className="text-sm font-black">{r.targetSummary.question}</p>
                      <p className="text-[10px] text-gray-400 italic line-clamp-1">"{r.description}"</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-black">{r.targetSummary?.word || r.targetSummary?.question || 'N/A'}</p>
                      <p className="text-[10px] text-gray-400 italic line-clamp-1">"{r.description}"</p>
                    </div>
                  )}
                </td>
                <td className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 text-center">
                  <Badge className={getStatusBadgeClass(r.status)}>{getStatusLabel(r.status)}</Badge>
                </td>
                <td className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 text-xs sm:text-sm text-gray-500 hidden md:table-cell">
                  {new Date(r.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 text-right">
                  <div className="flex items-center justify-end gap-1 flex-wrap">
                    <Button variant="ghost" size="sm" className="min-h-[44px] rounded-xl text-[10px] font-black uppercase" onClick={() => showReportDetail(r)}>
                      Chi tiết
                    </Button>
                    {r.status === 'pending' && (
                      <>
                        <Button size="sm" className="min-h-[44px] min-w-[44px] rounded-xl bg-green-500 text-white p-0" onClick={() => handleApproveReject(r.id || r._id, 'approved')}>
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="min-h-[44px] min-w-[44px] rounded-xl text-red-500 p-0" onClick={() => handleApproveReject(r.id || r._id, 'rejected')}>
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-gray-400 font-bold text-sm">
                  Không có báo cáo
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 mt-6 sm:mt-8">
        <Button 
          variant="ghost" 
          disabled={page === 1} 
          onClick={() => setPage(p => p - 1)} 
          className="rounded-xl font-bold border hover:bg-gray-50 min-h-[44px]"
        >
          Trước
        </Button>
        
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className="bg-white px-4 sm:px-6 py-2 rounded-xl border font-black text-xs sm:text-sm shadow-sm">
            Trang {page} / {totalPages}
          </span>
          <span className="text-[10px] font-black text-gray-400 uppercase bg-gray-50 px-3 py-2 rounded-lg border">
            Tổng: {totalItems}
          </span>
        </div>

        <Button 
          variant="ghost" 
          disabled={page >= totalPages} 
          onClick={() => setPage(p => p + 1)} 
          className="rounded-xl font-bold border hover:bg-gray-50 min-h-[44px]"
        >
          Tiếp
        </Button>
      </div>

      {/* Report Detail Dialog - mobile */}
      <Dialog open={showDetailDialog} onOpenChange={(open) => { if (!open) setShowDetailDialog(false) }}>
        <DialogContent className="sm:max-w-2xl rounded-xl sm:rounded-[2.5rem] p-4 sm:p-6 md:p-10 max-h-[90dvh] overflow-y-auto">
          <UIDialogHeader>
            <UIDialogTitle className="text-3xl font-black">Chi tiết báo cáo</UIDialogTitle>
          </UIDialogHeader>
          {selectedReport && (
            <div className="space-y-5 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-black uppercase text-gray-400">Loại</p>
                  <Badge variant="outline" className="text-primary mt-1">{selectedReport.type}</Badge>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-black uppercase text-gray-400">Trạng thái</p>
                  <Badge className={`mt-1 ${getStatusBadgeClass(selectedReport.status)}`}>
                    {getStatusLabel(selectedReport.status)}
                  </Badge>
                </div>
              </div>

              {/* Vocabulary target summary */}
              {selectedReport.type === 'vocabulary' && selectedReport.targetSummary && (
                <div className="p-5 bg-purple-50/50 rounded-2xl border border-purple-100">
                  <div className="text-sm space-y-1">
                    <div><span className="font-black">Từ:</span> {selectedReport.targetSummary.word} {selectedReport.targetSummary.pronunciation && `(${selectedReport.targetSummary.pronunciation})`}</div>
                    <div><span className="font-black">Nghĩa:</span> {selectedReport.targetSummary.meaning}</div>
                    <div>
                      <span className="font-black">Cấp:</span> L{selectedReport.targetSummary.level}
                      {selectedReport.targetSummary.topics && selectedReport.targetSummary.topics.length > 0 && (
                        <> • <span className="font-black">Chủ đề:</span> {selectedReport.targetSummary.topics.join(', ')}</>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Question target summary */}
              {selectedReport.type === 'question' && selectedReport.targetSummary?.question && (
                <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                  <div className="text-sm space-y-1">
                    <div><span className="font-black">Câu hỏi:</span> {selectedReport.targetSummary.question}</div>
                    <div><span className="font-black">Loại:</span> {selectedReport.targetSummary.questionType}</div>
                    {selectedReport.targetSummary.level && (
                      <div><span className="font-black">Cấp:</span> L{selectedReport.targetSummary.level}</div>
                    )}
                  </div>
                </div>
              )}

              {selectedReport.category && (
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-black uppercase text-gray-400">Danh mục</p>
                  <p className="text-sm font-bold mt-1">{selectedReport.category}</p>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-[10px] font-black uppercase text-gray-400">Người báo cáo</p>
                <p className="font-bold mt-1">
                  {selectedReport.user?.name || selectedReport.user?.username || selectedReport.user?._id || 'Ẩn danh'}
                  {selectedReport.user?.email && <span className="text-gray-400 font-medium"> ({selectedReport.user.email})</span>}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-[10px] font-black uppercase text-gray-400">Mô tả lỗi</p>
                <p className="text-sm font-medium mt-1 whitespace-pre-wrap">"{selectedReport.description}"</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-[10px] font-black uppercase text-gray-400">Ngày tạo</p>
                <p className="text-sm font-bold mt-1">{new Date(selectedReport.createdAt).toLocaleString()}</p>
              </div>

              {/* Reward inputs for pending reports */}
              {selectedReport.status === 'pending' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-2xl">
                    <label className="text-[10px] font-black uppercase text-gray-400">Thưởng XP (mặc định: 0.5)</label>
                    <Input
                      type="number"
                      min={0}
                      step="0.1"
                      placeholder="0.5"
                      className="mt-1 rounded-xl"
                      value={rewardXp[selectedReport.id || selectedReport._id] ?? ''}
                      onChange={(e) => setRewardXp({ ...rewardXp, [selectedReport.id || selectedReport._id]: Number(e.target.value) })}
                    />
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl">
                    <label className="text-[10px] font-black uppercase text-gray-400">Thưởng Xu (mặc định: 0.5)</label>
                    <Input
                      type="number"
                      min={0}
                      step="0.1"
                      placeholder="0.5"
                      className="mt-1 rounded-xl"
                      value={rewardCoins[selectedReport.id || selectedReport._id] ?? ''}
                      onChange={(e) => setRewardCoins({ ...rewardCoins, [selectedReport.id || selectedReport._id]: Number(e.target.value) })}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="pt-4">
            <Button variant="ghost" onClick={() => setShowDetailDialog(false)} className="rounded-xl font-bold text-gray-400">
              Đóng
            </Button>
            {selectedReport?.status === 'pending' && (
              <>
                <Button
                  onClick={() => { handleApproveReject(selectedReport.id || selectedReport._id, 'approved'); setShowDetailDialog(false) }}
                  className="rounded-xl font-bold bg-green-500 hover:bg-green-600 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" /> Duyệt
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { handleApproveReject(selectedReport.id || selectedReport._id, 'rejected'); setShowDetailDialog(false) }}
                  className="rounded-xl font-bold text-red-500"
                >
                  <XCircle className="w-4 h-4 mr-2" /> Từ chối
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog - mobile */}
      <Dialog open={!!confirmAction} onOpenChange={(open) => { if (!open) setConfirmAction(null) }}>
        <DialogContent className="sm:max-w-md rounded-xl sm:rounded-[2.5rem] p-4 sm:p-6 md:p-10 max-h-[90dvh] overflow-y-auto">
          <UIDialogHeader>
            <UIDialogTitle className="text-2xl font-black">
              {confirmAction?.action === 'approved' ? 'Xác nhận duyệt báo cáo' : 'Xác nhận từ chối báo cáo'}
            </UIDialogTitle>
          </UIDialogHeader>
          <p className="text-sm text-gray-500 font-medium">
            {confirmAction?.action === 'approved'
              ? 'Bạn có chắc muốn duyệt báo cáo này? Hành động này sẽ cấp thưởng cho người báo cáo.'
              : 'Bạn có chắc muốn từ chối báo cáo này? Hành động này không thể hoàn tác.'}
          </p>
          <DialogFooter className="pt-4">
            <Button variant="ghost" onClick={() => setConfirmAction(null)} className="rounded-xl font-bold text-gray-400">
              Hủy
            </Button>
            <Button
              className={`rounded-xl font-bold text-white ${confirmAction?.action === 'approved' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
              onClick={confirmActionHandler}
            >
              {confirmAction?.action === 'approved' ? 'Duyệt' : 'Từ chối'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
