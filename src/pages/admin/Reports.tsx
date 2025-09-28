import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Dialog, DialogContent, DialogFooter, DialogHeader as UIDialogHeader, DialogTitle as UIDialogTitle } from '../../components/ui/dialog'
import { api } from '../../services/api'
import toast from 'react-hot-toast'

interface ReportItem {
  _id: string
  type: string
  targetId: string
  category: string
  description: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  userId: {
    _id: string
    name: string
    email: string
  }
}

export const AdminReports = () => {
  const [reports, setReports] = useState<ReportItem[]>([])
  const [rewardXp, setRewardXp] = useState<Record<string, number>>({})
  const [rewardCoins, setRewardCoins] = useState<Record<string, number>>({})
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{id: string, action: 'approved' | 'rejected'} | null>(null)

  useEffect(() => {
    fetchReports()
  }, [page, pageSize, search])

  const fetchReports = async () => {
    try {
      const res = await api.get('/reports/admin/all', { 
        params: { page, limit: pageSize, search } 
      })
      setReports(res.data?.reports || res.data || [])
    } catch {
      setReports([])
    }
  }

  const updateReport = async (id: string, status: 'approved' | 'rejected') => {
    try {
      // Default rewards: 0.5 XP and 0.5 coins for approved reports
      const defaultXp = 0.5
      const defaultCoins = 0.5
      const xp = status === 'approved' ? (rewardXp[id] || defaultXp) : 0
      const coins = status === 'approved' ? (rewardCoins[id] || defaultCoins) : 0
      
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
    setConfirmAction({id, action})
  }

  const confirmActionHandler = async () => {
    if (confirmAction) {
      await updateReport(confirmAction.id, confirmAction.action)
      setConfirmAction(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Báo cáo</h1>
          <p className="text-gray-600">Danh sách báo cáo từ người dùng</p>
        </div>
        <div className="flex items-center gap-2">
          <Input 
            placeholder="Tìm kiếm theo loại..." 
            value={search} 
            onChange={e => { setPage(1); setSearch(e.target.value) }} 
            className="w-64" 
          />
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Danh sách báo cáo</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-4">#</th>
                  <th className="py-2 pr-4">Loại</th>
                  <th className="py-2 pr-4">Nội dung</th>
                  <th className="py-2 pr-4">Trạng thái</th>
                  <th className="py-2 pr-4">Ngày tạo</th>
                  <th className="py-2">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r, i) => (
                  <tr key={r._id} className="border-t">
                    <td className="py-2 pr-4">{(page - 1) * pageSize + i + 1}</td>
                    <td className="py-2 pr-4">{r.type}</td>
                    <td className="py-2 pr-4 max-w-xs">
                      <div className="truncate">{r.description}</div>
                    </td>
                    <td className="py-2 pr-4">
                      <Badge variant={r.status === 'pending' ? 'secondary' : r.status === 'approved' ? 'default' : 'destructive'}>
                        {r.status}
                      </Badge>
                    </td>
                    <td className="py-2 pr-4">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => showReportDetail(r)}>Chi tiết</Button>
                        {r.status === 'pending' && (
                          <>
                            <Button size="sm" onClick={() => handleApproveReject(r._id, 'approved')}>Duyệt</Button>
                            <Button variant="outline" size="sm" onClick={() => handleApproveReject(r._id, 'rejected')}>Từ chối</Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr><td colSpan={6} className="py-6 text-center text-gray-500">Không có báo cáo</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-3 text-sm">
            <div className="flex items-center gap-2">
              <label className="text-gray-600">Hiển thị</label>
              <select className="border rounded px-2 py-1" value={pageSize} onChange={e => { setPage(1); setPageSize(parseInt(e.target.value)) }}>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Trước</Button>
              <Badge variant="outline">Trang {page}</Badge>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)}>Sau</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={(open) => { if (!open) setShowDetailDialog(false) }}>
        <DialogContent className="max-w-2xl">
          <UIDialogHeader><UIDialogTitle>Chi tiết báo cáo</UIDialogTitle></UIDialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">Loại</label>
                  <div className="text-sm">{selectedReport.type}</div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Trạng thái</label>
                  <div className="text-sm">
                    <Badge variant={selectedReport.status === 'pending' ? 'secondary' : selectedReport.status === 'approved' ? 'default' : 'destructive'}>
                      {selectedReport.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Danh mục</label>
                <div className="text-sm">{selectedReport.category}</div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Người báo cáo</label>
                <div className="text-sm">{selectedReport.userId?.name} ({selectedReport.userId?.email})</div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Nội dung</label>
                <div className="text-sm p-3 bg-gray-50 rounded whitespace-pre-wrap">{selectedReport.description}</div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Ngày tạo</label>
                <div className="text-sm">{new Date(selectedReport.createdAt).toLocaleString()}</div>
              </div>
              {selectedReport.status === 'pending' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500">Thưởng XP (mặc định: 0.5)</label>
                      <Input
                        type="number"
                        min={0}
                        step="0.1"
                        placeholder="0.5"
                        value={rewardXp[selectedReport._id] ?? ''}
                        onChange={(e) => setRewardXp({ ...rewardXp, [selectedReport._id]: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Thưởng Xu (mặc định: 0.5)</label>
                      <Input
                        type="number"
                        min={0}
                        step="0.1"
                        placeholder="0.5"
                        value={rewardCoins[selectedReport._id] ?? ''}
                        onChange={(e) => setRewardCoins({ ...rewardCoins, [selectedReport._id]: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Đóng</Button>
            {selectedReport?.status === 'pending' && (
              <>
                <Button onClick={() => { handleApproveReject(selectedReport._id, 'approved'); setShowDetailDialog(false) }}>Duyệt</Button>
                <Button variant="outline" onClick={() => { handleApproveReject(selectedReport._id, 'rejected'); setShowDetailDialog(false) }}>Từ chối</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmAction} onOpenChange={(open) => { if (!open) setConfirmAction(null) }}>
        <DialogContent className="max-w-md">
          <UIDialogHeader>
            <UIDialogTitle>
              {confirmAction?.action === 'approved' ? 'Xác nhận duyệt báo cáo' : 'Xác nhận từ chối báo cáo'}
            </UIDialogTitle>
          </UIDialogHeader>
          <p className="text-sm text-gray-600">
            {confirmAction?.action === 'approved' 
              ? 'Bạn có chắc muốn duyệt báo cáo này? Hành động này sẽ cấp thưởng cho người báo cáo.'
              : 'Bạn có chắc muốn từ chối báo cáo này? Hành động này không thể hoàn tác.'
            }
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>Hủy</Button>
            <Button 
              className={confirmAction?.action === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
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


